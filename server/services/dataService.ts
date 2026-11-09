import { ExamAttemptDoc, ExamDoc, UserDoc } from '../config/db.js';
import { jsonStore } from './jsonFileStore.js';

export const DataService = {
  // --- USERS ---
  async findUserByEmail(email: string): Promise<UserDoc | null> {
    return jsonStore.findUserByEmail(email);
  },

  async findUserById(id: string): Promise<UserDoc | null> {
    return jsonStore.findUserById(id);
  },

  async createUser(data: Omit<UserDoc, '_id' | 'createdAt' | 'updatedAt'>): Promise<UserDoc> {
    return jsonStore.createUser(data);
  },

  async getAllCandidates(): Promise<UserDoc[]> {
    return jsonStore.getAllCandidates();
  },

  // --- EXAMS ---
  async getAllExams(filter?: { status?: 'Draft' | 'Published'; createdBy?: string }): Promise<ExamDoc[]> {
    return jsonStore.getAllExams(filter);
  },

  async findExamById(id: string): Promise<ExamDoc | null> {
    return jsonStore.findExamById(id);
  },

  async findExamByAccessKey(accessKey: string): Promise<ExamDoc | null> {
    return jsonStore.findExamByAccessKey(accessKey);
  },

  async createExam(data: Omit<ExamDoc, '_id' | 'createdAt' | 'updatedAt'>): Promise<ExamDoc> {
    return jsonStore.createExam(data);
  },

  async updateExam(id: string, updates: Partial<ExamDoc>): Promise<ExamDoc | null> {
    return jsonStore.updateExam(id, updates);
  },

  async deleteExam(id: string): Promise<boolean> {
    return jsonStore.deleteExam(id);
  },

  // --- ATTEMPTS ---
  async createAttempt(data: Omit<ExamAttemptDoc, '_id' | 'createdAt' | 'updatedAt'>): Promise<ExamAttemptDoc> {
    return jsonStore.createAttempt(data);
  },

  async findAttemptById(id: string): Promise<ExamAttemptDoc | null> {
    return jsonStore.findAttemptById(id);
  },

  async updateAttempt(id: string, updates: Partial<ExamAttemptDoc>): Promise<ExamAttemptDoc | null> {
    return jsonStore.updateAttempt(id, updates);
  },

  async findAttemptsByCandidate(candidateId: string): Promise<ExamAttemptDoc[]> {
    return jsonStore.findAttemptsByCandidate(candidateId);
  },

  async findAttemptsByExam(examId: string): Promise<ExamAttemptDoc[]> {
    return jsonStore.findAttemptsByExam(examId);
  },

  async getAllAttempts(): Promise<ExamAttemptDoc[]> {
    return jsonStore.getAllAttempts();
  },

  // --- SEEDING / INITIALIZATION ---
  async seedInitialData(): Promise<void> {
    await jsonStore.init();
  },
};
