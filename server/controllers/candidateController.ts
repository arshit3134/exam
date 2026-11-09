import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { DataService } from '../services/dataService.js';

const SaveAnswersSchema = z.object({
  answers: z.record(z.string(), z.enum(['A', 'B', 'C', 'D']).nullable()),
});

export const CandidateController = {
  async getDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const candidateId = req.user!.id;
      const attempts = await DataService.findAttemptsByCandidate(candidateId);
      const submitted = attempts.filter((a) => a.status === 'submitted' || a.status === 'timed-out');
      const exams = await DataService.getAllExams();

      let totalScorePct = 0;
      let highestPct = 0;
      let passedCount = 0;
      let failedCount = 0;

      for (const a of submitted) {
        totalScorePct += a.percentage;
        if (a.percentage > highestPct) highestPct = a.percentage;

        const exam = exams.find((e) => e._id === a.examId);
        const passingPct = exam ? exam.passingPercentage : 50;
        if (a.percentage >= passingPct) {
          passedCount++;
        } else {
          failedCount++;
        }
      }

      const avgScore = submitted.length > 0 ? +(totalScorePct / submitted.length).toFixed(1) : 0;

      res.status(200).json({
        success: true,
        stats: {
          totalAttempted: submitted.length,
          averageScore: avgScore,
          highestScore: highestPct,
          passedExams: passedCount,
          failedExams: failedCount,
        },
        recentAttempts: submitted.slice(0, 5),
      });
    } catch (err) {
      console.error('Candidate dashboard error:', err);
      res.status(500).json({ success: false, message: 'Server error retrieving candidate dashboard.' });
    }
  },

  async getAvailableExams(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const candidateId = req.user!.id;
      const publishedExams = await DataService.getAllExams({ status: 'Published' });
      const myAttempts = await DataService.findAttemptsByCandidate(candidateId);

      const examCards = publishedExams.map((exam) => {
        const attemptsForThisExam = myAttempts.filter((a) => a.examId === exam._id);
        const hasActiveAttempt = attemptsForThisExam.find((a) => a.status === 'in-progress');
        const hasSubmittedAttempt = attemptsForThisExam.find((a) => a.status === 'submitted' || a.status === 'timed-out');

        return {
          _id: exam._id,
          title: exam.title,
          description: exam.description,
          subject: exam.subject,
          duration: exam.duration,
          totalMarks: exam.totalMarks,
          passingPercentage: exam.passingPercentage,
          questionCount: exam.questions.length,
          allowMultipleAttempts: exam.allowMultipleAttempts,
          createdByName: exam.createdByName || 'Faculty Lead',
          accessKey: exam.accessKey,
          hasActiveAttempt: !!hasActiveAttempt,
          activeAttemptId: hasActiveAttempt ? hasActiveAttempt._id : null,
          isCompleted: !!hasSubmittedAttempt && !exam.allowMultipleAttempts,
          latestAttemptId: hasSubmittedAttempt ? hasSubmittedAttempt._id : null,
        };
      });

      res.status(200).json({ success: true, exams: examCards });
    } catch (err) {
      console.error('Error getting candidate exams:', err);
      res.status(500).json({ success: false, message: 'Server error.' });
    }
  },

  async joinExamByKey(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { accessKey } = req.body;
      if (!accessKey || typeof accessKey !== 'string') {
        res.status(400).json({ success: false, message: 'Please provide a valid exam access key.' });
        return;
      }

      const exam = await DataService.findExamByAccessKey(accessKey);
      if (!exam) {
        res.status(404).json({
          success: false,
          message: `No examination found matching access key "${accessKey.trim().toUpperCase()}". Please verify the key with your teacher.`,
        });
        return;
      }

      if (exam.status !== 'Published') {
        res.status(403).json({
          success: false,
          message: `Exam "${exam.title}" is currently in Draft mode and has not been published yet.`,
        });
        return;
      }

      const candidateId = req.user!.id;
      const myAttempts = await DataService.findAttemptsByCandidate(candidateId);
      const attemptsForThisExam = myAttempts.filter((a) => a.examId === exam._id);
      const hasActiveAttempt = attemptsForThisExam.find((a) => a.status === 'in-progress');
      const hasSubmittedAttempt = attemptsForThisExam.find(
        (a) => a.status === 'submitted' || a.status === 'timed-out'
      );

      res.status(200).json({
        success: true,
        exam: {
          _id: exam._id,
          title: exam.title,
          description: exam.description,
          subject: exam.subject,
          duration: exam.duration,
          totalMarks: exam.totalMarks,
          passingPercentage: exam.passingPercentage,
          questionCount: exam.questions.length,
          accessKey: exam.accessKey,
          hasActiveAttempt: !!hasActiveAttempt,
          isCompleted: !!hasSubmittedAttempt && !exam.allowMultipleAttempts,
          latestAttemptId: hasSubmittedAttempt ? hasSubmittedAttempt._id : null,
        },
      });
    } catch (err) {
      console.error('Error joining exam by key:', err);
      res.status(500).json({ success: false, message: 'Server error verifying access key.' });
    }
  },

  async startExam(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const candidateId = req.user!.id;

      const exam = await DataService.findExamById(id);
      if (!exam || exam.status !== 'Published') {
        res.status(404).json({ success: false, message: 'Exam is not currently available or published.' });
        return;
      }

      // Check existing attempts
      const myAttempts = await DataService.findAttemptsByCandidate(candidateId);
      const activeAttempt = myAttempts.find((a) => a.examId === id && a.status === 'in-progress');

      if (activeAttempt) {
        // Check if active attempt has already expired on server side
        const elapsedSec = Math.floor((Date.now() - new Date(activeAttempt.startedAt).getTime()) / 1000);
        const maxAllowedSec = exam.duration * 60 + 45; // 45s grace

        if (elapsedSec > maxAllowedSec) {
          // Auto submit expired attempt
          await DataService.updateAttempt(activeAttempt._id, { status: 'timed-out' });
        } else {
          // Restore active session: Return questions WITHOUT correct answers or explanations
          const sanitizedQuestions = exam.questions.map((q) => ({
            id: q.id,
            questionText: q.questionText,
            options: q.options,
            marks: q.marks,
            order: q.order,
          }));

          res.status(200).json({
            success: true,
            message: 'Resuming active examination session.',
            attempt: {
              _id: activeAttempt._id,
              examId: exam._id,
              examTitle: exam.title,
              duration: exam.duration,
              totalMarks: exam.totalMarks,
              startedAt: activeAttempt.startedAt,
              answers: activeAttempt.answers || {},
              timeRemainingSeconds: Math.max(0, exam.duration * 60 - elapsedSec),
            },
            questions: sanitizedQuestions,
          });
          return;
        }
      }

      // Check if duplicate attempt is prohibited
      const completedAttempt = myAttempts.find(
        (a) => a.examId === id && (a.status === 'submitted' || a.status === 'timed-out')
      );
      if (completedAttempt && !exam.allowMultipleAttempts) {
        res.status(403).json({
          success: false,
          message: 'You have already completed this examination. Retakes are not permitted for this assessment.',
        });
        return;
      }

      // Create new attempt
      const newAttempt = await DataService.createAttempt({
        examId: exam._id,
        examTitle: exam.title,
        candidateId,
        candidateName: req.user!.name,
        candidateEmail: req.user!.email,
        answers: {},
        score: 0,
        percentage: 0,
        correctCount: 0,
        incorrectCount: 0,
        unansweredCount: exam.questions.length,
        startedAt: new Date(),
        timeTaken: 0,
        status: 'in-progress',
        resultReleased: exam.resultReleaseSettings === 'immediate',
      });

      // STRICT SECURITY RULE:
      // Strip correctOption and explanation so candidate frontend NEVER receives the answer key!
      const sanitizedQuestions = exam.questions.map((q) => ({
        id: q.id,
        questionText: q.questionText,
        options: q.options,
        marks: q.marks,
        order: q.order,
      }));

      res.status(201).json({
        success: true,
        message: 'Exam session initialized.',
        attempt: {
          _id: newAttempt._id,
          examId: exam._id,
          examTitle: exam.title,
          duration: exam.duration,
          totalMarks: exam.totalMarks,
          startedAt: newAttempt.startedAt,
          answers: {},
          timeRemainingSeconds: exam.duration * 60,
        },
        questions: sanitizedQuestions,
      });
    } catch (err) {
      console.error('Error starting exam:', err);
      res.status(500).json({ success: false, message: 'Server error starting exam.' });
    }
  },

  async saveAnswers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params; // attempt ID
      const candidateId = req.user!.id;

      const parsed = SaveAnswersSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, message: 'Invalid answers payload format.' });
        return;
      }

      const attempt = await DataService.findAttemptById(id);
      if (!attempt) {
        res.status(404).json({ success: false, message: 'Attempt not found.' });
        return;
      }

      if (attempt.candidateId !== candidateId) {
        res.status(403).json({ success: false, message: 'Unauthorized attempt access.' });
        return;
      }

      if (attempt.status !== 'in-progress') {
        res.status(400).json({ success: false, message: 'This attempt is already finalized.' });
        return;
      }

      const exam = await DataService.findExamById(attempt.examId);
      if (exam) {
        const elapsedSec = Math.floor((Date.now() - new Date(attempt.startedAt).getTime()) / 1000);
        if (elapsedSec > exam.duration * 60 + 60) {
          // Duration expired
          await DataService.updateAttempt(id, { status: 'timed-out' });
          res.status(400).json({ success: false, message: 'Exam duration has expired. Please submit.' });
          return;
        }
      }

      const updated = await DataService.updateAttempt(id, {
        answers: parsed.data.answers as any,
      });

      res.status(200).json({ success: true, message: 'Answers saved.', savedAt: new Date() });
    } catch (err) {
      console.error('Error saving answers:', err);
      res.status(500).json({ success: false, message: 'Server error saving answers.' });
    }
  },

  async submitExam(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params; // attempt ID
      const candidateId = req.user!.id;
      const submittedAnswers = req.body.answers || {};

      const attempt = await DataService.findAttemptById(id);
      if (!attempt) {
        res.status(404).json({ success: false, message: 'Attempt not found.' });
        return;
      }

      if (attempt.candidateId !== candidateId) {
        res.status(403).json({ success: false, message: 'Unauthorized attempt submission.' });
        return;
      }

      if (attempt.status === 'submitted') {
        res.status(400).json({ success: false, message: 'This attempt has already been submitted.' });
        return;
      }

      const exam = await DataService.findExamById(attempt.examId);
      if (!exam) {
        res.status(404).json({ success: false, message: 'Associated exam not found.' });
        return;
      }

      const mergedAnswers = {
        ...(attempt.answers || {}),
        ...submittedAnswers,
      };

      // SERVER-SIDE EVALUATION:
      // Answers are rigorously evaluated on the backend against the official database answer keys.
      let totalEarnedScore = 0;
      let correctCount = 0;
      let incorrectCount = 0;
      let unansweredCount = 0;

      for (const q of exam.questions) {
        const candidateChoice = mergedAnswers[q.id];
        if (!candidateChoice) {
          unansweredCount++;
        } else if (candidateChoice === q.correctOption) {
          correctCount++;
          totalEarnedScore += q.marks;
        } else {
          incorrectCount++;
        }
      }

      const totalMarks = exam.totalMarks || 1;
      const percentage = +((totalEarnedScore / totalMarks) * 100).toFixed(1);
      const startedAt = new Date(attempt.startedAt).getTime();
      const timeTaken = Math.max(1, Math.floor((Date.now() - startedAt) / 1000));
      const isResultReleased = exam.resultReleaseSettings === 'immediate';

      const updatedAttempt = await DataService.updateAttempt(id, {
        answers: mergedAnswers,
        score: totalEarnedScore,
        percentage,
        correctCount,
        incorrectCount,
        unansweredCount,
        submittedAt: new Date(),
        timeTaken,
        status: 'submitted',
        resultReleased: isResultReleased,
      });

      res.status(200).json({
        success: true,
        message: 'Exam submitted and evaluated successfully.',
        attemptId: id,
        resultReleased: isResultReleased,
        summary: {
          score: totalEarnedScore,
          totalMarks,
          percentage,
          correctCount,
          incorrectCount,
          unansweredCount,
          passed: percentage >= exam.passingPercentage,
          passingPercentage: exam.passingPercentage,
          timeTaken,
        },
      });
    } catch (err) {
      console.error('Error submitting exam:', err);
      res.status(500).json({ success: false, message: 'Server error submitting exam.' });
    }
  },

  async getMyResults(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const candidateId = req.user!.id;
      const attempts = await DataService.findAttemptsByCandidate(candidateId);
      const submitted = attempts.filter((a) => a.status === 'submitted' || a.status === 'timed-out');
      const exams = await DataService.getAllExams();

      const results = submitted.map((att) => {
        const exam = exams.find((e) => e._id === att.examId);
        const passPercent = exam ? exam.passingPercentage : 50;
        return {
          _id: att._id,
          examId: att.examId,
          examTitle: att.examTitle,
          score: att.score,
          totalMarks: exam ? exam.totalMarks : att.score + att.incorrectCount,
          percentage: att.percentage,
          passed: att.percentage >= passPercent,
          correctCount: att.correctCount,
          incorrectCount: att.incorrectCount,
          unansweredCount: att.unansweredCount,
          submittedAt: att.submittedAt || att.createdAt,
          timeTaken: att.timeTaken,
          resultReleased: att.resultReleased,
        };
      });

      res.status(200).json({ success: true, results });
    } catch (err) {
      console.error('Error fetching results:', err);
      res.status(500).json({ success: false, message: 'Server error.' });
    }
  },

  async getResultDetail(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const candidateId = req.user!.id;

      const attempt = await DataService.findAttemptById(id);
      if (!attempt) {
        res.status(404).json({ success: false, message: 'Result record not found.' });
        return;
      }

      // Check ownership or teacher role
      if (attempt.candidateId !== candidateId && req.user!.role !== 'teacher') {
        res.status(403).json({ success: false, message: 'Access denied.' });
        return;
      }

      const exam = await DataService.findExamById(attempt.examId);
      if (!exam) {
        res.status(404).json({ success: false, message: 'Associated exam not found.' });
        return;
      }

      // If candidate is requesting and results are unreleased, hide answers/explanations
      if (req.user!.role === 'candidate' && !attempt.resultReleased) {
        res.status(200).json({
          success: true,
          resultReleased: false,
          message: 'The examination has been submitted, but the instructor has not released detailed answers and explanations yet.',
          attempt: {
            _id: attempt._id,
            examTitle: attempt.examTitle,
            submittedAt: attempt.submittedAt,
            status: attempt.status,
            timeTaken: attempt.timeTaken,
          },
        });
        return;
      }

      // Detailed question-by-question breakdown with clear visual indicators
      const questionsReview = exam.questions.map((q) => {
        const studentChoice = attempt.answers[q.id] || null;
        const isCorrect = studentChoice === q.correctOption;
        const isUnanswered = !studentChoice;

        return {
          id: q.id,
          order: q.order,
          questionText: q.questionText,
          options: q.options,
          marks: q.marks,
          candidateAnswer: studentChoice,
          correctOption: q.correctOption,
          isCorrect,
          isUnanswered,
          explanation: q.explanation || 'No additional explanation provided by instructor.',
        };
      });

      res.status(200).json({
        success: true,
        resultReleased: true,
        attempt: {
          _id: attempt._id,
          examId: exam._id,
          examTitle: exam.title,
          subject: exam.subject,
          score: attempt.score,
          totalMarks: exam.totalMarks,
          percentage: attempt.percentage,
          passed: attempt.percentage >= exam.passingPercentage,
          passingPercentage: exam.passingPercentage,
          correctCount: attempt.correctCount,
          incorrectCount: attempt.incorrectCount,
          unansweredCount: attempt.unansweredCount,
          startedAt: attempt.startedAt,
          submittedAt: attempt.submittedAt,
          timeTaken: attempt.timeTaken,
        },
        questionsReview,
      });
    } catch (err) {
      console.error('Error fetching result detail:', err);
      res.status(500).json({ success: false, message: 'Server error retrieving result.' });
    }
  },
};
