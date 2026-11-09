import axios from 'axios';
import {
  CandidateStats,
  DifficultQuestion,
  Exam,
  ExamCard,
  ExamAttempt,
  QuestionReviewItem,
  TeacherStats,
  User,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to include localStorage token as fallback if cookies are restricted
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('apex_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  async register(data: { name: string; email: string; password: string; role?: 'teacher' | 'candidate' }) {
    const res = await api.post<{ success: boolean; user: User; token: string }>('/auth/register', data);
    return res.data;
  },

  async login(data: { email: string; password: string; expectedRole?: 'teacher' | 'candidate' }) {
    const res = await api.post<{ success: boolean; user: User; token: string; message: string }>('/auth/login', data);
    return res.data;
  },

  async logout() {
    const res = await api.post<{ success: boolean }>('/auth/logout');
    return res.data;
  },

  async getMe() {
    const res = await api.get<{ success: boolean; user: User }>('/auth/me');
    return res.data;
  },

  async provisionTeacher(data: { name: string; email: string; password: string; secretKey: string }) {
    const res = await api.post<{ success: boolean; user: User; token: string }>('/auth/provision-teacher', data);
    return res.data;
  },
};

export const teacherAPI = {
  async getDashboardStats() {
    const res = await api.get<{ success: boolean; stats: TeacherStats }>('/teacher/dashboard');
    return res.data.stats;
  },

  async getAnalytics() {
    const res = await api.get<{
      success: boolean;
      analytics: {
        examAverages: Array<{
          examId: string;
          examTitle: string;
          fullTitle: string;
          totalMarks: number;
          averageMarks: number;
          averagePercentage: number;
          attemptsCount: number;
        }>;
        distribution: Array<{ range: string; count: number }>;
        examPassFail: Array<{ examTitle: string; passed: number; failed: number; total: number }>;
        passVsFail: Array<{ name: string; value: number; percentage: number }>;
      };
    }>('/teacher/analytics');
    return res.data.analytics;
  },

  async getDifficultQuestions() {
    const res = await api.get<{ success: boolean; difficultQuestions: DifficultQuestion[] }>(
      '/teacher/difficult-questions'
    );
    return res.data.difficultQuestions;
  },

  async getExams() {
    const res = await api.get<{ success: boolean; exams: Exam[] }>('/teacher/exams');
    return res.data.exams;
  },

  async getExamById(id: string) {
    const res = await api.get<{ success: boolean; exam: Exam }>(`/teacher/exams/${id}`);
    return res.data.exam;
  },

  async createExam(data: Partial<Exam>) {
    const res = await api.post<{ success: boolean; exam: Exam }>('/teacher/exams', data);
    return res.data;
  },

  async updateExam(id: string, data: Partial<Exam>) {
    const res = await api.put<{ success: boolean; exam: Exam }>(`/teacher/exams/${id}`, data);
    return res.data;
  },

  async deleteExam(id: string) {
    const res = await api.delete<{ success: boolean; message: string }>(`/teacher/exams/${id}`);
    return res.data;
  },

  async togglePublish(id: string) {
    const res = await api.patch<{ success: boolean; exam: Exam }>(`/teacher/exams/${id}/status`);
    return res.data.exam;
  },

  async toggleResultRelease(id: string) {
    const res = await api.patch<{ success: boolean; exam: Exam }>(`/teacher/exams/${id}/result-release`);
    return res.data.exam;
  },

  async getExamAttempts(id: string) {
    const res = await api.get<{
      success: boolean;
      examTitle: string;
      totalMarks: number;
      passingPercentage: number;
      attempts: ExamAttempt[];
    }>(`/teacher/exams/${id}/attempts`);
    return res.data;
  },

  async getStudents() {
    const res = await api.get<{
      success: boolean;
      students: Array<{
        id: string;
        name: string;
        email: string;
        createdAt: string;
        totalAttempts: number;
        averagePercentage: number;
      }>;
    }>('/teacher/students');
    return res.data.students;
  },
};

export const candidateAPI = {
  async getDashboard() {
    const res = await api.get<{
      success: boolean;
      stats: CandidateStats;
      recentAttempts: ExamAttempt[];
    }>('/candidate/dashboard');
    return res.data;
  },

  async getAvailableExams() {
    const res = await api.get<{ success: boolean; exams: ExamCard[] }>('/candidate/exams');
    return res.data.exams;
  },

  async joinExamByKey(accessKey: string) {
    const res = await api.post<{ success: boolean; exam: ExamCard }>('/candidate/exams/join-by-key', {
      accessKey,
    });
    return res.data;
  },

  async startExam(examId: string) {
    const res = await api.post<{
      success: boolean;
      message: string;
      attempt: {
        _id: string;
        examId: string;
        examTitle: string;
        duration: number;
        totalMarks: number;
        startedAt: string;
        answers: Record<string, 'A' | 'B' | 'C' | 'D' | null>;
        timeRemainingSeconds: number;
      };
      questions: Array<{
        id: string;
        questionText: string;
        options: Array<{ key: 'A' | 'B' | 'C' | 'D'; text: string }>;
        marks: number;
        order: number;
      }>;
    }>(`/candidate/exams/${examId}/start`);
    return res.data;
  },

  async saveAnswers(attemptId: string, answers: Record<string, string | null>) {
    const res = await api.put<{ success: boolean; savedAt: string }>(`/candidate/attempts/${attemptId}/answers`, {
      answers,
    });
    return res.data;
  },

  async submitExam(attemptId: string, answers: Record<string, string | null>) {
    const res = await api.post<{
      success: boolean;
      attemptId: string;
      resultReleased: boolean;
      summary: {
        score: number;
        totalMarks: number;
        percentage: number;
        correctCount: number;
        incorrectCount: number;
        unansweredCount: number;
        passed: boolean;
        passingPercentage: number;
        timeTaken: number;
      };
    }>(`/candidate/attempts/${attemptId}/submit`, { answers });
    return res.data;
  },

  async getMyResults() {
    const res = await api.get<{
      success: boolean;
      results: Array<ExamAttempt & { passed: boolean; totalMarks: number }>;
    }>('/candidate/results');
    return res.data.results;
  },

  async getResultDetail(attemptId: string) {
    const res = await api.get<{
      success: boolean;
      resultReleased: boolean;
      message?: string;
      attempt: {
        _id: string;
        examId?: string;
        examTitle: string;
        subject?: string;
        score?: number;
        totalMarks?: number;
        percentage?: number;
        passed?: boolean;
        passingPercentage?: number;
        correctCount?: number;
        incorrectCount?: number;
        unansweredCount?: number;
        startedAt?: string;
        submittedAt?: string;
        timeTaken: number;
      };
      questionsReview?: QuestionReviewItem[];
    }>(`/candidate/results/${attemptId}`);
    return res.data;
  },
};
