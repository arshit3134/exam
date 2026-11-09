import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest, clearAuthCookie, setAuthCookie, signToken } from '../middleware/auth.js';
import { DataService } from '../services/dataService.js';

const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.string().optional(),
});

const LoginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
  expectedRole: z.enum(['teacher', 'candidate']).optional(),
});

const TeacherProvisionSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  secretKey: z.string().min(1, 'Secret master key is required to provision teacher accounts'),
});

const TEACHER_PROVISION_KEY = process.env.TEACHER_PROVISION_KEY || 'APEX_TEACHER_PROVISION_SECRET_2026';

export const AuthController = {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const parsed = RegisterSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, message: parsed.error.issues[0].message });
        return;
      }

      const { name, email, password, role } = parsed.data;

      // Open registration: allow user to select 'teacher' or 'candidate' freely
      const assignedRole = role && role.toLowerCase() === 'teacher' ? 'teacher' : 'candidate';

      const existing = await DataService.findUserByEmail(email);
      if (existing) {
        res.status(409).json({ success: false, message: 'An account with this email already exists.' });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await DataService.createUser({
        name,
        email,
        password: hashedPassword,
        role: assignedRole,
      });

      const token = signToken(user);
      setAuthCookie(res, token);

      res.status(201).json({
        success: true,
        message: 'Candidate registration successful.',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      });
    } catch (err) {
      console.error('Registration error:', err);
      res.status(500).json({ success: false, message: 'Server error during registration.' });
    }
  },

  async login(req: Request, res: Response): Promise<void> {
    try {
      const parsed = LoginSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, message: parsed.error.issues[0].message });
        return;
      }

      const { email, password, expectedRole } = parsed.data;
      const user = await DataService.findUserByEmail(email);

      if (!user) {
        res.status(401).json({ success: false, message: 'Invalid email or password.' });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        res.status(401).json({ success: false, message: 'Invalid email or password.' });
        return;
      }

      // If user attempted login through role-specific portal (e.g. Teacher login form), verify role
      if (expectedRole && user.role !== expectedRole) {
        res.status(403).json({
          success: false,
          message: `Access denied. You attempted to log in as a ${expectedRole}, but your account is registered as a ${user.role}. Please use the ${user.role} portal.`,
        });
        return;
      }

      const token = signToken(user);
      setAuthCookie(res, token);

      res.status(200).json({
        success: true,
        message: `Welcome back, ${user.name}!`,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ success: false, message: 'Server error during login.' });
    }
  },

  async logout(req: Request, res: Response): Promise<void> {
    clearAuthCookie(res);
    res.status(200).json({ success: true, message: 'Logged out successfully.' });
  },

  async me(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated.' });
      return;
    }
    const user = await DataService.findUserById(req.user.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  },

  async provisionTeacher(req: Request, res: Response): Promise<void> {
    try {
      const parsed = TeacherProvisionSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, message: parsed.error.issues[0].message });
        return;
      }

      const { name, email, password, secretKey } = parsed.data;

      if (secretKey !== TEACHER_PROVISION_KEY) {
        res.status(403).json({
          success: false,
          message: 'Invalid administrative provision key. Unauthorized teacher creation.',
        });
        return;
      }

      const existing = await DataService.findUserByEmail(email);
      if (existing) {
        res.status(409).json({ success: false, message: 'An account with this email already exists.' });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const teacher = await DataService.createUser({
        name,
        email,
        password: hashedPassword,
        role: 'teacher',
      });

      const token = signToken(teacher);
      setAuthCookie(res, token);

      res.status(201).json({
        success: true,
        message: 'Teacher account provisioned successfully.',
        user: {
          id: teacher._id,
          name: teacher.name,
          email: teacher.email,
          role: teacher.role,
        },
        token,
      });
    } catch (err) {
      console.error('Provision teacher error:', err);
      res.status(500).json({ success: false, message: 'Server error provisioning teacher.' });
    }
  },
};
