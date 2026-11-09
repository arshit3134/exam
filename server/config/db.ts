import { jsonStore } from '../services/jsonFileStore.js';

export interface UserDoc {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: 'teacher' | 'candidate';
  createdAt: Date;
  updatedAt: Date;
}

export interface QuestionOption {
  key: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface QuestionDoc {
  id: string;
  questionText: string;
  options: QuestionOption[];
  correctOption: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  marks: number;
  order: number;
}

export interface ExamDoc {
  _id: string;
  title: string;
  description: string;
  subject: string;
  duration: number; // in minutes
  totalMarks: number;
  passingPercentage: number;
  questions: QuestionDoc[];
  createdBy: string; // Teacher User ID
  createdByName?: string;
  accessKey?: string; // Unique exam entry passcode for students
  status: 'Draft' | 'Published';
  resultReleaseSettings: 'immediate' | 'manual';
  startDate?: string;
  endDate?: string;
  allowMultipleAttempts: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExamAttemptDoc {
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
  startedAt: Date;
  submittedAt?: Date;
  timeTaken: number; // in seconds
  status: 'in-progress' | 'submitted' | 'timed-out';
  resultReleased: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export async function connectDB(): Promise<void> {
  await jsonStore.init();
  console.log('[Database] Operating with zero-config Server-Side JSON File Store (data/store.json). No external database required.');
}

export function getIsMongoConnected(): boolean {
  return false;
}
