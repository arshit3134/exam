import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { DataService } from '../services/dataService.js';

const QuestionOptionInputSchema = z.object({
  key: z.enum(['A', 'B', 'C', 'D']),
  text: z.string().min(1, 'Option text is required'),
});

const QuestionInputSchema = z.object({
  id: z.string().optional(),
  questionText: z.string().min(3, 'Question text must be at least 3 characters'),
  options: z.array(QuestionOptionInputSchema).min(2, 'At least 2 options required').max(4, 'Maximum 4 options allowed'),
  correctOption: z.enum(['A', 'B', 'C', 'D']),
  explanation: z.string().optional().default(''),
  marks: z.number().min(1, 'Marks must be at least 1').default(1),
  order: z.number().default(0),
});

const CreateExamSchema = z.object({
  title: z.string().min(3, 'Exam title must be at least 3 characters'),
  description: z.string().min(5, 'Exam description is required'),
  subject: z.string().min(2, 'Subject is required'),
  duration: z.number().min(1, 'Duration must be at least 1 minute'),
  passingPercentage: z.number().min(0).max(100, 'Passing percentage must be between 0 and 100'),
  status: z.enum(['Draft', 'Published']).default('Draft'),
  resultReleaseSettings: z.enum(['immediate', 'manual']).default('immediate'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  allowMultipleAttempts: z.boolean().default(false),
  accessKey: z.string().min(2, 'Access key must be at least 2 characters').max(30).optional(),
  questions: z.array(QuestionInputSchema).min(1, 'At least one question is required'),
});

export const TeacherController = {
  async getDashboardStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const candidates = await DataService.getAllCandidates();
      const exams = await DataService.getAllExams();
      const attempts = await DataService.getAllAttempts();

      const submittedAttempts = attempts.filter((a) => a.status === 'submitted' || a.status === 'timed-out');

      let totalScoreSum = 0;
      let highestScore = 0;
      let lowestScore = submittedAttempts.length > 0 ? 999999 : 0;
      let passCount = 0;

      for (const att of submittedAttempts) {
        totalScoreSum += att.score;
        if (att.score > highestScore) highestScore = att.score;
        if (att.score < lowestScore) lowestScore = att.score;

        const exam = exams.find((e) => e._id === att.examId);
        const passPercent = exam ? exam.passingPercentage : 50;
        if (att.percentage >= passPercent) {
          passCount++;
        }
      }

      if (submittedAttempts.length === 0) {
        lowestScore = 0;
      }

      const overallAverageMarks =
        submittedAttempts.length > 0 ? +(totalScoreSum / submittedAttempts.length).toFixed(1) : 0;

      const averagePassPercentage =
        submittedAttempts.length > 0 ? +((passCount / submittedAttempts.length) * 100).toFixed(1) : 0;

      res.status(200).json({
        success: true,
        stats: {
          totalStudents: candidates.length,
          totalExams: exams.length,
          totalAttempts: submittedAttempts.length,
          overallAverageMarks,
          highestScore,
          lowestScore,
          averagePassPercentage,
        },
      });
    } catch (err) {
      console.error('Error fetching teacher dashboard stats:', err);
      res.status(500).json({ success: false, message: 'Server error retrieving stats.' });
    }
  },

  async getAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const exams = await DataService.getAllExams();
      const attempts = await DataService.getAllAttempts();
      const submitted = attempts.filter((a) => a.status === 'submitted' || a.status === 'timed-out');

      // 1. Average Marks Across Exams
      const examAverages = exams.map((exam) => {
        const examAttempts = submitted.filter((a) => a.examId === exam._id);
        const avg =
          examAttempts.length > 0
            ? +(examAttempts.reduce((acc, curr) => acc + curr.score, 0) / examAttempts.length).toFixed(1)
            : 0;
        const avgPct =
          examAttempts.length > 0
            ? +(examAttempts.reduce((acc, curr) => acc + curr.percentage, 0) / examAttempts.length).toFixed(1)
            : 0;
        return {
          examId: exam._id,
          examTitle: exam.title.length > 22 ? exam.title.substring(0, 20) + '...' : exam.title,
          fullTitle: exam.title,
          totalMarks: exam.totalMarks,
          averageMarks: avg,
          averagePercentage: avgPct,
          attemptsCount: examAttempts.length,
        };
      });

      // 2. Score Distribution (Ranges 0-20, 21-40, 41-60, 61-80, 81-100)
      const distribution = [
        { range: '0 - 20%', count: 0 },
        { range: '21 - 40%', count: 0 },
        { range: '41 - 60%', count: 0 },
        { range: '61 - 80%', count: 0 },
        { range: '81 - 100%', count: 0 },
      ];

      for (const att of submitted) {
        const pct = att.percentage;
        if (pct <= 20) distribution[0].count++;
        else if (pct <= 40) distribution[1].count++;
        else if (pct <= 60) distribution[2].count++;
        else if (pct <= 80) distribution[3].count++;
        else distribution[4].count++;
      }

      // 3. Exam-wise Pass / Fail breakdown
      const examPassFail = exams.map((exam) => {
        const examAttempts = submitted.filter((a) => a.examId === exam._id);
        let pass = 0;
        let fail = 0;
        for (const a of examAttempts) {
          if (a.percentage >= exam.passingPercentage) pass++;
          else fail++;
        }
        return {
          examTitle: exam.title.length > 18 ? exam.title.substring(0, 16) + '...' : exam.title,
          passed: pass,
          failed: fail,
          total: examAttempts.length,
        };
      });

      // 4. Overall Pass vs Fail Percentage
      let totalPass = 0;
      let totalFail = 0;
      for (const a of submitted) {
        const exam = exams.find((e) => e._id === a.examId);
        const passPercent = exam ? exam.passingPercentage : 50;
        if (a.percentage >= passPercent) totalPass++;
        else totalFail++;
      }

      const totalCount = submitted.length;
      const passVsFail = [
        { name: 'Passed', value: totalPass, percentage: totalCount > 0 ? +((totalPass / totalCount) * 100).toFixed(1) : 0 },
        { name: 'Failed', value: totalFail, percentage: totalCount > 0 ? +((totalFail / totalCount) * 100).toFixed(1) : 0 },
      ];

      res.status(200).json({
        success: true,
        analytics: {
          examAverages,
          distribution,
          examPassFail,
          passVsFail,
        },
      });
    } catch (err) {
      console.error('Error fetching analytics:', err);
      res.status(500).json({ success: false, message: 'Server error generating analytics.' });
    }
  },

  async getMostDifficultQuestions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const exams = await DataService.getAllExams();
      const attempts = await DataService.getAllAttempts();
      const submitted = attempts.filter((a) => a.status === 'submitted' || a.status === 'timed-out');

      // Aggregate question-level failure metrics
      const questionStatsMap = new Map<
        string,
        {
          questionId: string;
          questionText: string;
          examId: string;
          examTitle: string;
          totalAttempts: number;
          incorrectAnswers: number;
          correctAnswers: number;
          unanswered: number;
          correctOption: string;
          correctOptionText: string;
        }
      >();

      for (const exam of exams) {
        for (const q of exam.questions) {
          const correctOptObj = q.options.find((o) => o.key === q.correctOption);
          questionStatsMap.set(q.id, {
            questionId: q.id,
            questionText: q.questionText,
            examId: exam._id,
            examTitle: exam.title,
            totalAttempts: 0,
            incorrectAnswers: 0,
            correctAnswers: 0,
            unanswered: 0,
            correctOption: q.correctOption,
            correctOptionText: correctOptObj ? `${q.correctOption}: ${correctOptObj.text}` : q.correctOption,
          });
        }
      }

      // Tally student choices
      for (const att of submitted) {
        const exam = exams.find((e) => e._id === att.examId);
        if (!exam) continue;

        for (const q of exam.questions) {
          const stat = questionStatsMap.get(q.id);
          if (!stat) continue;

          stat.totalAttempts++;
          const selected = att.answers[q.id];

          if (!selected) {
            stat.unanswered++;
            stat.incorrectAnswers++; // Unanswered is considered missed/incorrect
          } else if (selected === q.correctOption) {
            stat.correctAnswers++;
          } else {
            stat.incorrectAnswers++;
          }
        }
      }

      // Format & calculate percentage
      const questionsArray = Array.from(questionStatsMap.values())
        .filter((q) => q.totalAttempts > 0)
        .map((q) => {
          const failurePercentage = q.totalAttempts > 0 ? +((q.incorrectAnswers / q.totalAttempts) * 100).toFixed(1) : 0;
          return {
            ...q,
            failurePercentage,
          };
        });

      // Sort by failure percentage descending, then total incorrect descending
      questionsArray.sort((a, b) => b.failurePercentage - a.failurePercentage || b.incorrectAnswers - a.incorrectAnswers);

      res.status(200).json({
        success: true,
        difficultQuestions: questionsArray,
      });
    } catch (err) {
      console.error('Error fetching difficult questions:', err);
      res.status(500).json({ success: false, message: 'Server error analyzing questions.' });
    }
  },

  async getAllExams(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const exams = await DataService.getAllExams();
      res.status(200).json({ success: true, exams });
    } catch (err) {
      console.error('Error getting exams:', err);
      res.status(500).json({ success: false, message: 'Server error retrieving exams.' });
    }
  },

  async getExamById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const exam = await DataService.findExamById(id);
      if (!exam) {
        res.status(404).json({ success: false, message: 'Exam not found.' });
        return;
      }
      res.status(200).json({ success: true, exam });
    } catch (err) {
      console.error('Error getting exam:', err);
      res.status(500).json({ success: false, message: 'Server error retrieving exam.' });
    }
  },

  async createExam(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const parsed = CreateExamSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, message: parsed.error.issues[0].message });
        return;
      }

      const { questions, ...rest } = parsed.data;

      // Check unique access key
      if (rest.accessKey) {
        const formattedKey = rest.accessKey.trim().toUpperCase();
        const existingKey = await DataService.findExamByAccessKey(formattedKey);
        if (existingKey) {
          res.status(409).json({
            success: false,
            message: `Unique key "${formattedKey}" is already taken by another exam. Please choose a different key.`,
          });
          return;
        }
        rest.accessKey = formattedKey;
      }

      // Assign IDs and order to questions
      let calculatedTotalMarks = 0;
      const formattedQuestions = questions.map((q, idx) => {
        calculatedTotalMarks += q.marks;
        return {
          id: q.id || 'q_' + Math.random().toString(36).substring(2, 8) + Date.now().toString(36),
          questionText: q.questionText,
          options: q.options,
          correctOption: q.correctOption,
          explanation: q.explanation || '',
          marks: q.marks,
          order: idx + 1,
        };
      });

      const exam = await DataService.createExam({
        ...rest,
        totalMarks: calculatedTotalMarks,
        questions: formattedQuestions,
        createdBy: req.user!.id,
        createdByName: req.user!.name,
      });

      res.status(201).json({
        success: true,
        message: 'Exam created successfully.',
        exam,
      });
    } catch (err) {
      console.error('Error creating exam:', err);
      res.status(500).json({ success: false, message: 'Server error creating exam.' });
    }
  },

  async updateExam(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const parsed = CreateExamSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, message: parsed.error.issues[0].message });
        return;
      }

      const existing = await DataService.findExamById(id);
      if (!existing) {
        res.status(404).json({ success: false, message: 'Exam not found.' });
        return;
      }

      const updates: any = { ...parsed.data };

      if (updates.accessKey) {
        const formattedKey = updates.accessKey.trim().toUpperCase();
        const existingKey = await DataService.findExamByAccessKey(formattedKey);
        if (existingKey && existingKey._id !== id) {
          res.status(409).json({
            success: false,
            message: `Unique key "${formattedKey}" is already taken by another exam. Please choose a different key.`,
          });
          return;
        }
        updates.accessKey = formattedKey;
      }
      if (updates.questions) {
        let calculatedTotalMarks = 0;
        updates.questions = updates.questions.map((q: any, idx: number) => {
          calculatedTotalMarks += q.marks || 1;
          return {
            id: q.id || 'q_' + Math.random().toString(36).substring(2, 8) + idx,
            questionText: q.questionText,
            options: q.options,
            correctOption: q.correctOption,
            explanation: q.explanation || '',
            marks: q.marks || 1,
            order: idx + 1,
          };
        });
        updates.totalMarks = calculatedTotalMarks;
      }

      const updated = await DataService.updateExam(id, updates);
      res.status(200).json({
        success: true,
        message: 'Exam updated successfully.',
        exam: updated,
      });
    } catch (err) {
      console.error('Error updating exam:', err);
      res.status(500).json({ success: false, message: 'Server error updating exam.' });
    }
  },

  async deleteExam(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const existing = await DataService.findExamById(id);
      if (!existing) {
        res.status(404).json({ success: false, message: 'Exam not found.' });
        return;
      }

      await DataService.deleteExam(id);
      res.status(200).json({ success: true, message: 'Exam and its attempt records deleted successfully.' });
    } catch (err) {
      console.error('Error deleting exam:', err);
      res.status(500).json({ success: false, message: 'Server error deleting exam.' });
    }
  },

  async togglePublishStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const exam = await DataService.findExamById(id);
      if (!exam) {
        res.status(404).json({ success: false, message: 'Exam not found.' });
        return;
      }

      const newStatus = exam.status === 'Published' ? 'Draft' : 'Published';
      const updated = await DataService.updateExam(id, { status: newStatus });

      res.status(200).json({
        success: true,
        message: `Exam status updated to ${newStatus}.`,
        exam: updated,
      });
    } catch (err) {
      console.error('Error toggling status:', err);
      res.status(500).json({ success: false, message: 'Server error.' });
    }
  },

  async toggleResultRelease(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const exam = await DataService.findExamById(id);
      if (!exam) {
        res.status(404).json({ success: false, message: 'Exam not found.' });
        return;
      }

      const newSetting = exam.resultReleaseSettings === 'immediate' ? 'manual' : 'immediate';
      const updated = await DataService.updateExam(id, { resultReleaseSettings: newSetting });

      res.status(200).json({
        success: true,
        message: `Result release mode set to ${newSetting}.`,
        exam: updated,
      });
    } catch (err) {
      console.error('Error toggling result release:', err);
      res.status(500).json({ success: false, message: 'Server error.' });
    }
  },

  async getExamAttempts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const exam = await DataService.findExamById(id);
      if (!exam) {
        res.status(404).json({ success: false, message: 'Exam not found.' });
        return;
      }

      const attempts = await DataService.findAttemptsByExam(id);
      res.status(200).json({
        success: true,
        examTitle: exam.title,
        totalMarks: exam.totalMarks,
        passingPercentage: exam.passingPercentage,
        attempts,
      });
    } catch (err) {
      console.error('Error getting exam attempts:', err);
      res.status(500).json({ success: false, message: 'Server error.' });
    }
  },

  async getStudents(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const candidates = await DataService.getAllCandidates();
      const attempts = await DataService.getAllAttempts();

      const studentList = candidates.map((c) => {
        const studentAttempts = attempts.filter((a) => a.candidateId === c._id && a.status === 'submitted');
        const avgScore =
          studentAttempts.length > 0
            ? +(studentAttempts.reduce((acc, curr) => acc + curr.percentage, 0) / studentAttempts.length).toFixed(1)
            : 0;
        return {
          id: c._id,
          name: c.name,
          email: c.email,
          createdAt: c.createdAt,
          totalAttempts: studentAttempts.length,
          averagePercentage: avgScore,
        };
      });

      res.status(200).json({ success: true, students: studentList });
    } catch (err) {
      console.error('Error getting student list:', err);
      res.status(500).json({ success: false, message: 'Server error.' });
    }
  },
};
