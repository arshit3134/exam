import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserDoc } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'apex_super_secure_jwt_secret_key_prod_2026_exam_platform';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface AuthUserPayload {
  id: string;
  email: string;
  role: 'teacher' | 'candidate';
  name: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUserPayload;
}

export function signToken(user: UserDoc): string {
  const payload: AuthUserPayload = {
    id: user._id,
    email: user.email,
    role: user.role,
    name: user.name,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as any });
}

export function setAuthCookie(res: Response, token: string): void {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
}

export function clearAuthCookie(res: Response): void {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('token', '', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 0,
    path: '/',
  });
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  let token = req.cookies?.token;
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUserPayload;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Session expired or invalid token. Please log in again.' });
  }
}

export function requireRole(allowedRole: 'teacher' | 'candidate') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }
    if (req.user.role !== allowedRole) {
      res.status(403).json({
        success: false,
        message: `Forbidden: This resource requires ${allowedRole} privileges. Current role: ${req.user.role}.`,
      });
      return;
    }
    next();
  };
}
