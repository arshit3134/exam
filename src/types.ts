export type UserRole = 'teacher' | 'candidate';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface QuestionOption {
  key: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface Question {
  id: string;
  questionText: string;
  options: QuestionOption[];
  correctOption?: 'A' | 'B' | 'C' | 'D'; // Only present for teacher or submitted review
  explanation?: string;
  marks: number;
  order: number;
}

export interface Exam {
  _id: string;
  title: string;
  description: string;
  subject: string;
  duration: number; // in minutes
  totalMarks: number;
  passingPercentage: number;
  questions: Question[];
  createdBy: string;
  createdByName?: string;
  accessKey?: string;
  status: 'Draft' | 'Published';
  resultReleaseSettings: 'immediate' | 'manual';
  startDate?: string;
  endDate?: string;
  allowMultipleAttempts: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExamCard {
  _id: string;
  title: string;
  description: string;
  subject: string;
  duration: number;
  totalMarks: number;
  passingPercentage: number;
  questionCount: number;
  allowMultipleAttempts: boolean;
  createdByName: string;
  accessKey?: string;
  hasActiveAttempt: boolean;
  activeAttemptId: string | null;
  isCompleted: boolean;
  latestAttemptId: string | null;
}

export interface ExamAttempt {
  _id: string;
  examId: string;
  examTitle: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  answers: Record<string, 'A' | 'B' | 'C' | 'D' | null>;
  score: number;
  percentage: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  startedAt: string;
  submittedAt?: string;
  timeTaken: number; // in seconds
  status: 'in-progress' | 'submitted' | 'timed-out';
  resultReleased: boolean;
  createdAt: string;
}

export interface DifficultQuestion {
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
  failurePercentage: number;
}

export interface TeacherStats {
  totalStudents: number;
  totalExams: number;
  totalAttempts: number;
  overallAverageMarks: number;
  highestScore: number;
  lowestScore: number;
  averagePassPercentage: number;
}

export interface CandidateStats {
  totalAttempted: number;
  averageScore: number;
  highestScore: number;
  passedExams: number;
  failedExams: number;
}

export interface QuestionReviewItem {
  id: string;
  order: number;
  questionText: string;
  options: QuestionOption[];
  marks: number;
  candidateAnswer: 'A' | 'B' | 'C' | 'D' | null;
  correctOption: 'A' | 'B' | 'C' | 'D';
  isCorrect: boolean;
  isUnanswered: boolean;
  explanation: string;
}
