import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';

// Teacher Pages
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { TeacherDifficultQuestions } from './pages/teacher/TeacherDifficultQuestions';
import { TeacherExams } from './pages/teacher/TeacherExams';
import { TeacherExamEditor } from './pages/teacher/TeacherExamEditor';
import { TeacherExamAttempts } from './pages/teacher/TeacherExamAttempts';
import { TeacherStudents } from './pages/teacher/TeacherStudents';

// Candidate Pages
import { CandidateDashboard } from './pages/candidate/CandidateDashboard';
import { CandidateExams } from './pages/candidate/CandidateExams';
import { CandidateExamScreen } from './pages/candidate/CandidateExamScreen';
import { CandidateResults } from './pages/candidate/CandidateResults';
import { CandidateResultView } from './pages/candidate/CandidateResultView';

// Protected Route Guard
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRole?: 'teacher' | 'candidate';
}> = ({ children, allowedRole }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center text-xs text-zinc-400">
        Authenticating session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={user.role === 'teacher' ? '/teacher/dashboard' : '/candidate/dashboard'} replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing & Auth */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />

          {/* Distraction-Free Full-Screen Exam Session (Candidate Only) */}
          <Route
            path="/candidate/exam/:id"
            element={
              <ProtectedRoute allowedRole="candidate">
                <CandidateExamScreen />
              </ProtectedRoute>
            }
          />

          {/* Teacher Faculty Portal Routes */}
          <Route
            path="/teacher"
            element={
              <ProtectedRoute allowedRole="teacher">
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/teacher/dashboard" replace />} />
            <Route path="dashboard" element={<TeacherDashboard />} />
            <Route path="difficult-questions" element={<TeacherDifficultQuestions />} />
            <Route path="exams" element={<TeacherExams />} />
            <Route path="exams/new" element={<TeacherExamEditor />} />
            <Route path="exams/:id/edit" element={<TeacherExamEditor />} />
            <Route path="exams/:id/attempts" element={<TeacherExamAttempts />} />
            <Route path="students" element={<TeacherStudents />} />
          </Route>

          {/* Candidate Student Portal Routes */}
          <Route
            path="/candidate"
            element={
              <ProtectedRoute allowedRole="candidate">
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/candidate/dashboard" replace />} />
            <Route path="dashboard" element={<CandidateDashboard />} />
            <Route path="exams" element={<CandidateExams />} />
            <Route path="results" element={<CandidateResults />} />
            <Route path="results/:id" element={<CandidateResultView />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
