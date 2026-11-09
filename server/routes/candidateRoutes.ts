import { Router } from 'express';
import { CandidateController } from '../controllers/candidateController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

// Candidate routes
router.get('/dashboard', requireRole('candidate'), CandidateController.getDashboard);
router.get('/exams', requireRole('candidate'), CandidateController.getAvailableExams);
router.post('/exams/join-by-key', requireRole('candidate'), CandidateController.joinExamByKey);
router.post('/exams/:id/start', requireRole('candidate'), CandidateController.startExam);
router.put('/attempts/:id/answers', requireRole('candidate'), CandidateController.saveAnswers);
router.post('/attempts/:id/submit', requireRole('candidate'), CandidateController.submitExam);
router.get('/results', requireRole('candidate'), CandidateController.getMyResults);
// Result detail can also be reviewed by teacher or candidate
router.get('/results/:id', CandidateController.getResultDetail);

export default router;
