import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  ShieldCheck,
  BarChart3,
  Clock,
  CheckCircle,
  FileSpreadsheet,
  ArrowRight,
  Sparkles,
  Layers,
  Database,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, quickDemoLogin } = useAuth();

  const handleStartAs = async (role: 'teacher' | 'candidate') => {
    await quickDemoLogin(role);
    navigate(role === 'teacher' ? '/teacher/dashboard' : '/candidate/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col">
      {/* Top Bar Contract (Zone 1, Zone 2, Zone 3) */}
      <header className="sticky top-0 z-40 bg-[#09090B]/90 backdrop-blur-md border-b border-[#27272A] flex items-center justify-between gap-8 px-6 md:px-12 py-4">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <GraduationCap className="w-4 h-4" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0">
            ApexExam
          </span>
        </div>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-zinc-400">
          <a href="#features" className="hover:text-white transition-colors whitespace-nowrap shrink-0">Features</a>
          <a href="#analytics" className="hover:text-white transition-colors whitespace-nowrap shrink-0">Faculty Analytics</a>
          <a href="#security" className="hover:text-white transition-colors whitespace-nowrap shrink-0">Examination Security</a>
          <a href="#architecture" className="hover:text-white transition-colors whitespace-nowrap shrink-0">MERN Architecture</a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          {user ? (
            <button
              onClick={() => navigate(user.role === 'teacher' ? '/teacher/dashboard' : '/candidate/dashboard')}
              className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
            >
              Open Dashboard
            </button>
          ) : (
            <button
              onClick={() => navigate('/auth')}
              className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 md:px-12 pt-20 pb-16 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-950/30 text-purple-300 text-xs font-medium mb-6">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Production-Ready MERN Stack Examination Architecture</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white max-w-3xl mx-auto leading-tight" style={{ textWrap: 'balance' }}>
          Secure, MCQ-Driven Academic Assessment Engine
        </h1>

        <p className="mt-6 text-base md:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Engineered for institutional faculty and ambitious students. Complete with automated server-side evaluation,
          resilient timer enforcement, difficult questions analytics, and zero client-side answer key exposure.
        </p>

        {/* 1-Click Fast-Access Role Cards for Instant Interactive Testing */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
          {/* Teacher Launch Card */}
          <div className="bg-[#18181B] border border-[#27272A] hover:border-purple-500/50 rounded-xl p-6 transition-all group flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                <span className="font-semibold text-purple-400 uppercase tracking-wider">Faculty Portal</span>
                <span>Instructor Role</span>
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                Teacher Dashboard & Analytics
              </h3>
              <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                Create exams with 2-4 MCQ options, view Recharts score distributions, and inspect the ranked "Most Difficult Questions" fail rate.
              </p>
            </div>
            <button
              onClick={() => handleStartAs('teacher')}
              className="mt-5 w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              <span>Launch Teacher Experience</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Candidate Launch Card */}
          <div className="bg-[#18181B] border border-[#27272A] hover:border-emerald-500/50 rounded-xl p-6 transition-all group flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                <span className="font-semibold text-emerald-400 uppercase tracking-wider">Candidate Portal</span>
                <span>Student Role</span>
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                Student Examination Interface
              </h3>
              <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                Experience the distraction-free exam screen, live countdown timer, question palette status, periodic autosave, and detailed review.
              </p>
            </div>
            <button
              onClick={() => handleStartAs('candidate')}
              className="mt-5 w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              <span>Launch Candidate Experience</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Credentials Pill Footnote */}
        <div className="mt-4 text-xs text-zinc-400">
          <span>Pre-configured credentials</span>
          <span aria-hidden="true" className="mx-2">·</span>
          <span>Teacher: teacher@apexexam.io / TeacherPass123!</span>
          <span aria-hidden="true" className="mx-2">·</span>
          <span>Candidate: student@apexexam.io / StudentPass123!</span>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section id="features" className="px-6 md:px-12 py-16 border-t border-[#27272A] bg-[#111114]">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Production-Grade Assessment Architecture
            </h2>
            <p className="mt-2 text-sm text-zinc-400 max-w-xl mx-auto">
              Every interface and controller is built according to rigorous security, accessibility, and architectural standards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-6">
              <div className="w-10 h-10 rounded-lg bg-purple-900/40 border border-purple-700/50 flex items-center justify-center text-purple-300 mb-4">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white">Difficult Questions Engine</h3>
              <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                Calculates incorrect-answer percentages across all candidate attempts to immediately identify concepts where students struggle most.
              </p>
            </div>

            <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-6">
              <div className="w-10 h-10 rounded-lg bg-indigo-900/40 border border-indigo-700/50 flex items-center justify-center text-indigo-300 mb-4">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white">Server-Enforced Timer</h3>
              <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                Countdown timer runs locally with periodic background answer autosaving, backed by strict server-side timestamps to prevent manipulation.
              </p>
            </div>

            <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-6">
              <div className="w-10 h-10 rounded-lg bg-emerald-900/40 border border-emerald-700/50 flex items-center justify-center text-emerald-300 mb-4">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white">Zero Answer Leakage</h3>
              <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                Exam questions sent to the candidate omit correct answer keys and explanations entirely. Evaluation executes strictly inside Node.js.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Specs */}
      <section id="architecture" className="px-6 md:px-12 py-16 border-t border-[#27272A] bg-[#09090B]">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8">
            <div className="max-w-md">
              <span className="text-xs font-mono text-purple-400 uppercase tracking-wider">Under The Hood</span>
              <h2 className="mt-2 text-2xl font-bold text-white tracking-tight">Full MERN Stack Specification</h2>
              <p className="mt-3 text-xs text-zinc-400 leading-relaxed">
                Built with React 19, Vite, Express, MongoDB schemas, HTTP-only JWT cookies, bcrypt encryption, and Recharts visualization.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 w-full md:w-auto">
              <div className="bg-[#18181B] border border-[#27272A] rounded-lg p-4">
                <p className="text-xs font-semibold text-zinc-200">MongoDB / Mongoose</p>
                <p className="text-[11px] text-zinc-400 mt-1">Schemas with validation & indexes</p>
              </div>
              <div className="bg-[#18181B] border border-[#27272A] rounded-lg p-4">
                <p className="text-xs font-semibold text-zinc-200">Express / Node</p>
                <p className="text-[11px] text-zinc-400 mt-1">REST API with Zod validation</p>
              </div>
              <div className="bg-[#18181B] border border-[#27272A] rounded-lg p-4">
                <p className="text-xs font-semibold text-zinc-200">React + Vite</p>
                <p className="text-[11px] text-zinc-400 mt-1">Tailwind CSS + Recharts</p>
              </div>
              <div className="bg-[#18181B] border border-[#27272A] rounded-lg p-4">
                <p className="text-xs font-semibold text-zinc-200">Security Suite</p>
                <p className="text-[11px] text-zinc-400 mt-1">Helmet, CORS, HTTP-only cookies</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto px-6 md:px-12 py-6 border-t border-[#27272A] bg-[#0E0E11] text-xs text-zinc-400 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span>ApexExam Platform</span>
          <span aria-hidden="true" className="mx-2">·</span>
          <span>MERN Online Examination System</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/auth')} className="hover:text-zinc-200 transition-colors">
            Sign In / Register
          </button>
        </div>
      </footer>
    </div>
  );
};
