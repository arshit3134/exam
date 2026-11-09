import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { GraduationCap, Shield, User, Lock, Mail, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type PortalRole = 'candidate' | 'teacher';
type Mode = 'login' | 'register';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole = (searchParams.get('role') as PortalRole) || 'candidate';

  const { login, register, quickDemoLogin, addToast } = useAuth();

  const [activeRole, setActiveRole] = useState<PortalRole>(initialRole);
  const [mode, setMode] = useState<Mode>('login');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setErrorMessage('');
  };

  const handleRoleChange = (role: PortalRole) => {
    resetForm();
    setActiveRole(role);
  };

  const handleModeChange = (newMode: Mode) => {
    resetForm();
    setMode(newMode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      if (mode === 'login') {
        const success = await login(email, password, activeRole);
        if (success) {
          navigate(activeRole === 'teacher' ? '/teacher/dashboard' : '/candidate/dashboard');
        }
      } else {
        // Direct signup without verification: teacher or candidate
        const success = await register(name, email, password, activeRole);
        if (success) {
          navigate(activeRole === 'teacher' ? '/teacher/dashboard' : '/candidate/dashboard');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || 'Authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoFill = async (role: PortalRole) => {
    setIsSubmitting(true);
    const success = await quickDemoLogin(role);
    setIsSubmitting(false);
    if (success) {
      navigate(role === 'teacher' ? '/teacher/dashboard' : '/candidate/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] flex flex-col justify-center items-center p-4 selection:bg-purple-600/30">
      {/* Brand Header */}
      <div className="mb-6 text-center">
        <div
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity"
        >
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg">
            <GraduationCap className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">ApexExam</span>
        </div>
        <p className="mt-2 text-xs text-zinc-400">
          Online Examination & Academic Assessment Engine
        </p>
      </div>

      {/* Main Auth Container */}
      <div className="w-full max-w-md bg-[#18181B] border border-[#27272A] rounded-2xl shadow-2xl p-6 sm:p-8">
        {/* Role Portal Switcher */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-[#111114] border border-[#27272A] rounded-xl mb-6">
          <button
            type="button"
            onClick={() => handleRoleChange('candidate')}
            className={`py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeRole === 'candidate'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Candidate (Student)</span>
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange('teacher')}
            className={`py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeRole === 'teacher'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Teacher (Faculty)</span>
          </button>
        </div>

        {/* Mode Toggle (Sign In vs Sign Up) */}
        <div className="mb-5 flex items-center justify-between border-b border-[#27272A] pb-3">
          <div>
            <h2 className="text-base font-bold text-white">
              {mode === 'login'
                ? activeRole === 'teacher'
                  ? 'Teacher Sign In'
                  : 'Student Sign In'
                : activeRole === 'teacher'
                ? 'Teacher Registration'
                : 'Student Registration'}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              {mode === 'login'
                ? 'Enter your email and password to access your dashboard'
                : `Create your ${activeRole === 'teacher' ? 'faculty' : 'student'} account instantly (no verification needed)`}
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleModeChange(mode === 'login' ? 'register' : 'login')}
            className="text-xs font-semibold text-purple-400 hover:text-purple-300 underline shrink-0 ml-2"
          >
            {mode === 'login' ? 'Create Account' : 'Sign In'}
          </button>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-950/40 border border-rose-800/60 rounded-lg text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={activeRole === 'teacher' ? 'Dr. Jane Doe' : 'Alex Chen'}
                  className="w-full bg-[#111114] border border-[#27272A] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={activeRole === 'teacher' ? 'teacher@apexexam.io' : 'student@apexexam.io'}
                className="w-full bg-[#111114] border border-[#27272A] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#111114] border border-[#27272A] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-2.5 px-4 rounded-lg text-xs font-semibold text-white shadow-sm transition-colors mt-2 ${
              activeRole === 'teacher'
                ? 'bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800'
                : 'bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800'
            }`}
          >
            {isSubmitting
              ? 'Processing...'
              : mode === 'login'
              ? `Sign In as ${activeRole === 'teacher' ? 'Teacher' : 'Student'}`
              : `Create ${activeRole === 'teacher' ? 'Teacher' : 'Student'} Account`}
          </button>
        </form>

        {/* 1-Click Fast Demo Credentials Bar */}
        <div className="mt-6 pt-5 border-t border-[#27272A]">
          <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-2 text-center">
            Or Click For Instant Demo Access
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoFill('teacher')}
              disabled={isSubmitting}
              className="py-2 px-2.5 bg-[#111114] hover:bg-zinc-800 border border-[#27272A] rounded-lg text-left transition-colors"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400">
                <Shield className="w-3.5 h-3.5 shrink-0" />
                <span>Demo Teacher</span>
              </div>
              <p className="text-[10px] text-zinc-400 mt-0.5 truncate">Dr. Eleanor Vance</p>
            </button>

            <button
              type="button"
              onClick={() => handleDemoFill('candidate')}
              disabled={isSubmitting}
              className="py-2 px-2.5 bg-[#111114] hover:bg-zinc-800 border border-[#27272A] rounded-lg text-left transition-colors"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                <User className="w-3.5 h-3.5 shrink-0" />
                <span>Demo Student</span>
              </div>
              <p className="text-[10px] text-zinc-400 mt-0.5 truncate">Alex Chen</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
