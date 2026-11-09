import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileCheck2,
  HelpCircle,
  Users,
  LogOut,
  Menu,
  X,
  Compass,
  Award,
  BookOpen,
  ArrowRightLeft,
  GraduationCap,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ToastContainer } from '../common/ToastContainer';

export const AppLayout: React.FC = () => {
  const { user, logout, quickDemoLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const isTeacher = user?.role === 'teacher';

  const teacherNav = [
    { name: 'Analytics & Overview', path: '/teacher/dashboard', icon: LayoutDashboard },
    { name: 'Exam Management', path: '/teacher/exams', icon: FileCheck2 },
    { name: 'Most Difficult Questions', path: '/teacher/difficult-questions', icon: HelpCircle },
    { name: 'Student Roster', path: '/teacher/students', icon: Users },
  ];

  const candidateNav = [
    { name: 'Candidate Overview', path: '/candidate/dashboard', icon: LayoutDashboard },
    { name: 'Available Exams', path: '/candidate/exams', icon: BookOpen },
    { name: 'My Results & Explanations', path: '/candidate/results', icon: Award },
  ];

  const currentNav = isTeacher ? teacherNav : candidateNav;

  // Breadcrumb helper
  const getBreadcrumb = () => {
    const p = location.pathname;
    if (p.includes('/teacher/dashboard')) return 'Faculty / Overview';
    if (p.includes('/teacher/exams/new')) return 'Faculty / Exams / Create New';
    if (p.includes('/teacher/exams/edit')) return 'Faculty / Exams / Edit';
    if (p.includes('/teacher/exams/')) return 'Faculty / Exams / Attempts';
    if (p.includes('/teacher/exams')) return 'Faculty / Examination Catalog';
    if (p.includes('/teacher/difficult-questions')) return 'Faculty / Analytics / Difficult Questions';
    if (p.includes('/teacher/students')) return 'Faculty / Student Directory';
    if (p.includes('/candidate/dashboard')) return 'Student Portal / Overview';
    if (p.includes('/candidate/exams')) return 'Student Portal / Available Assessments';
    if (p.includes('/candidate/results/')) return 'Student Portal / Results / Evaluation Review';
    if (p.includes('/candidate/results')) return 'Student Portal / My Exam Results';
    return 'ApexExam / Platform';
  };

  const handleRoleSwitch = async () => {
    setIsSwitching(true);
    const nextRole = isTeacher ? 'candidate' : 'teacher';
    await quickDemoLogin(nextRole);
    setIsSwitching(false);
    navigate(nextRole === 'teacher' ? '/teacher/dashboard' : '/candidate/dashboard');
  };

  return (
    <div className="flex min-h-screen bg-[#09090B] text-[#FAFAFA]">
      <ToastContainer />

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#111114] border-r border-[#27272A] flex flex-col justify-between transition-transform duration-200 md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand Wordmark (Zone 1) */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-[#27272A]">
            <NavLink
              to="/"
              className="flex items-center gap-2.5 font-bold tracking-tight text-white hover:text-purple-300 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-linear-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
                <GraduationCap className="w-4 h-4" />
              </div>
              <span className="text-base font-bold tracking-tight">ApexExam</span>
            </NavLink>
            <button
              onClick={() => setMobileOpen(false)}
              className="md:hidden text-zinc-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Current Mode Badge */}
          <div className="px-6 py-3 border-b border-[#27272A]/60 bg-[#0E0E11]">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-medium text-zinc-300">Active Workspace</span>
              <span
                className={`font-semibold uppercase tracking-wider text-[11px] ${
                  isTeacher ? 'text-purple-400' : 'text-emerald-400'
                }`}
              >
                {isTeacher ? 'Faculty Portal' : 'Candidate Portal'}
              </span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="p-4 space-y-1">
            {currentNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-purple-600/15 text-purple-300 border border-purple-500/30'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Profile & Demo Switcher Footer */}
        <div className="p-4 border-t border-[#27272A] bg-[#0E0E11]">
          {/* Quick 1-Click Role Switcher */}
          <button
            onClick={handleRoleSwitch}
            disabled={isSwitching}
            className="w-full mb-3 flex items-center justify-center gap-2 px-3 py-2 bg-zinc-800/80 hover:bg-zinc-700/80 border border-[#27272A] rounded-lg text-xs text-zinc-200 transition-colors"
            title="Instantly switch role to test Teacher vs Candidate views"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="whitespace-nowrap">
              {isSwitching
                ? 'Switching...'
                : isTeacher
                ? 'Switch to Candidate View'
                : 'Switch to Faculty View'}
            </span>
          </button>

          {/* User Details */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-purple-900/60 border border-purple-700/50 flex items-center justify-center text-xs font-bold text-purple-200 shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-zinc-100 truncate">{user?.name}</p>
                <p className="text-[11px] text-zinc-400 truncate">{user?.email}</p>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800/80 rounded-md transition-colors"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        {/* Top Bar Header */}
        <header className="sticky top-0 z-30 h-16 bg-[#09090B]/90 backdrop-blur-md border-b border-[#27272A] flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden text-zinc-400 hover:text-white p-1"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-xs font-medium text-zinc-400 tracking-wide font-mono">
              {getBreadcrumb()}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isTeacher ? (
              <NavLink
                to="/teacher/exams/new"
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
              >
                + Create Exam
              </NavLink>
            ) : (
              <NavLink
                to="/candidate/exams"
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
              >
                Explore Exams
              </NavLink>
            )}
          </div>
        </header>

        {/* Page Viewport */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
