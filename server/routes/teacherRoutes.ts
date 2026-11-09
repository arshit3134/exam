import { Router } from 'express';
import { TeacherController } from '../controllers/teacherController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Teacher authorization guard
router.use(requireAuth);
router.use(requireRole('teacher'));

router.get('/dashboard', TeacherController.getDashboardStats);
router.get('/analytics', TeacherController.getAnalytics);
router.get('/difficult-questions', TeacherController.getMostDifficultQuestions);

router.get('/exams', TeacherController.getAllExams);
router.post('/exams', TeacherController.createExam);
router.get('/exams/:id', TeacherController.getExamById);
router.put('/exams/:id', TeacherController.updateExam);
router.delete('/exams/:id', TeacherController.deleteExam);
router.patch('/exams/:id/status', TeacherController.togglePublishStatus);
router.patch('/exams/:id/result-release', TeacherController.toggleResultRelease);
router.get('/exams/:id/attempts', TeacherController.getExamAttempts);

router.get('/students', TeacherController.getStudents);

export default router;
