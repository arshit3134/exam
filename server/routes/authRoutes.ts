import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/me', requireAuth, AuthController.me);
router.post('/provision-teacher', AuthController.provisionTeacher);

export default router;
