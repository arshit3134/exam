import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  ArrowRight,
  ExternalLink,
  Play,
  RotateCcw,
  Key,
  Sparkles,
} from 'lucide-react';
import { StatCard } from '../../components/common/StatCard';
import { useAuth } from '../../context/AuthContext';
import { candidateAPI } from '../../services/api';
import { CandidateStats, ExamAttempt, ExamCard } from '../../types';

export const CandidateDashboard: React.FC = () => {
  const { user, addToast } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<CandidateStats | null>(null);
  const [recentAttempts, setRecentAttempts] = useState<ExamAttempt[]>([]);
  const [availableExams, setAvailableExams] = useState<ExamCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Exam Access Key Unlock
  const [accessKeyInput, setAccessKeyInput] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState('');

  const handleUnlockExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessKeyInput.trim()) return;

    setIsUnlocking(true);
    setUnlockError('');

    try {
      const res = await candidateAPI.joinExamByKey(accessKeyInput.trim().toUpperCase());
      if (res.success && res.exam) {
        addToast(`Access Key verified! Launching "${res.exam.title}"...`, 'success');
        navigate(`/candidate/exam/${res.exam._id}`);
      }
    } catch (err: any) {
      setUnlockError(err.response?.data?.message || 'Invalid exam access key. Please check with your instructor.');
    } finally {
      setIsUnlocking(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    Promise.all([candidateAPI.getDashboard(), candidateAPI.getAvailableExams()])
      .then(([dash, exams]) => {
        setStats(dash.stats);
        setRecentAttempts(dash.recentAttempts || []);
        setAvailableExams(exams || []);
      })
      .catch((err) => console.error('Error fetching candidate dashboard:', err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* Welcome Banner */}
      <div className="bg-linear-to-r from-indigo-950/40 via-purple-950/20 to-transparent border border-[#27272A] rounded-2xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1.5">
              <span>Candidate Portal</span>
              <span aria-hidden="true">·</span>
              <span>Online Testing Engine</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {user?.name || 'Student'}!
            </h1>
            <p className="mt-1 text-xs md:text-sm text-zinc-400 max-w-xl">
              Prepare for your assessments, resume active examination sessions, and review evaluated scorecards.
            </p>
          </div>

          <NavLink
            to="/candidate/exams"
            className="self-start md:self-auto flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors shrink-0"
          >
            <BookOpen className="w-4 h-4" />
            <span>Explore All Exams</span>
          </NavLink>
        </div>
      </div>

      {/* QUICK ACCESS: ENTER UNIQUE EXAM KEY BAR */}
      <div className="bg-[#18181B] border border-indigo-500/40 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-600/60 flex items-center justify-center text-indigo-400 shrink-0">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Enter Unique Exam Key</span>
                <span className="text-[10px] uppercase font-semibold text-indigo-300 px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-700/50">
                  Instant Access
                </span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Have an access passcode from your teacher? Enter it below to directly launch the assessment (e.g. <span className="font-mono text-purple-300">CLOUD-2026</span> or <span className="font-mono text-purple-300">ALGO-500</span>).
              </p>
            </div>
          </div>

          <form onSubmit={handleUnlockExam} className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
            <input
              type="text"
              required
              value={accessKeyInput}
              onChange={(e) => setAccessKeyInput(e.target.value.toUpperCase())}
              placeholder="e.g. CLOUD-2026"
              className="w-full sm:w-48 bg-[#111114] border border-[#27272A] rounded-lg px-3.5 py-2 text-xs font-mono font-bold tracking-wider text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={isUnlocking}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isUnlocking ? 'Verifying...' : 'Unlock & Start Exam'}</span>
            </button>
          </form>
        </div>

        {unlockError && (
          <div className="mt-3 p-2.5 rounded-lg bg-rose-950/50 border border-rose-800/60 text-xs text-rose-300">
            {unlockError}
          </div>
        )}
      </div>

      {/* Candidate Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard
          label="Exams Attempted"
          value={stats?.totalAttempted ?? 0}
          unit="exams"
          icon={TrendingUp}
        />
        <StatCard
          label="Average Score"
          value={`${stats?.averageScore ?? 0}%`}
          subtext="Overall performance"
          icon={Award}
        />
        <StatCard
          label="Highest Score"
          value={`${stats?.highestScore ?? 0}%`}
          subtext="Personal record"
          icon={Award}
        />
        <StatCard
          label="Passed Assessments"
          value={stats?.passedExams ?? 0}
          unit="passed"
          icon={CheckCircle2}
        />
        <StatCard
          label="Failed Assessments"
          value={stats?.failedExams ?? 0}
          unit="failed"
          icon={XCircle}
        />
      </div>

      {/* Available Exams Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#27272A]">
          <div>
            <h2 className="text-base font-bold text-white">Available Examinations</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Published assessments ready for your attempt
            </p>
          </div>
          <NavLink
            to="/candidate/exams"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </NavLink>
        </div>

        {availableExams.length === 0 ? (
          <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-8 text-center text-xs text-zinc-400">
            No active exams are published right now. Check back soon or contact your instructor.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableExams.slice(0, 3).map((exam) => {
              return (
                <div
                  key={exam._id}
                  className="bg-[#18181B] border border-[#27272A] hover:border-zinc-700/80 rounded-xl p-5 flex flex-col justify-between transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                      <span className="text-indigo-400 font-medium truncate">{exam.subject}</span>
                      <span className="font-mono text-[11px] text-zinc-400">
                        {exam.duration} mins
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white line-clamp-1">{exam.title}</h3>
                    <p className="mt-1.5 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {exam.description}
                    </p>

                    <div className="mt-4 pt-3 border-t border-[#27272A] flex items-center justify-between text-xs text-zinc-400">
                      <span>{exam.questionCount} Questions</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{exam.totalMarks} Total Marks</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{exam.passingPercentage}% Pass Cutoff</span>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-[#27272A]">
                    {exam.hasActiveAttempt ? (
                      <NavLink
                        to={`/candidate/exam/${exam._id}`}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Resume In-Progress Attempt</span>
                      </NavLink>
                    ) : exam.isCompleted ? (
                      <NavLink
                        to={exam.latestAttemptId ? `/candidate/results/${exam.latestAttemptId}` : '/candidate/results'}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold border border-[#27272A] transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Completed · View Result</span>
                      </NavLink>
                    ) : (
                      <NavLink
                        to={`/candidate/exam/${exam._id}`}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Start Examination</span>
                      </NavLink>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* My Results Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#27272A]">
          <div>
            <h2 className="text-base font-bold text-white">My Recent Results</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Previous exam attempts and score breakdowns</p>
          </div>
          <NavLink
            to="/candidate/results"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
          >
            <span>All Results</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </NavLink>
        </div>

        {recentAttempts.length === 0 ? (
          <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-8 text-center text-xs text-zinc-400">
            You haven't completed any exams yet. Start an exam from the list above to view your score reports.
          </div>
        ) : (
          <div className="bg-[#18181B] border border-[#27272A] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#27272A] text-zinc-400 font-medium bg-[#111114]">
                    <th className="py-3 px-4">Exam Name</th>
                    <th className="py-3 px-4 text-center">Score</th>
                    <th className="py-3 px-4 text-center">Percentage</th>
                    <th className="py-3 px-4 text-center">Pass / Fail</th>
                    <th className="py-3 px-4 text-center">Time Spent</th>
                    <th className="py-3 px-4 text-right">Attempt Date</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272A]/60">
                  {recentAttempts.map((att) => (
                    <tr key={att._id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-white whitespace-nowrap">
                        {att.examTitle}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-zinc-200">
                        {att.score} pts
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-indigo-300">
                        {att.percentage}%
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            att.percentage >= 50
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
                              : 'bg-rose-950/80 text-rose-300 border border-rose-700/60'
                          }`}
                        >
                          {att.percentage >= 50 ? 'Passed' : 'Failed'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-zinc-400 text-[11px]">
                        {Math.floor((att.timeTaken || 0) / 60)}m {(att.timeTaken || 0) % 60}s
                      </td>
                      <td className="py-3.5 px-4 text-right text-zinc-400 text-[11px] whitespace-nowrap">
                        {new Date(att.submittedAt || att.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <NavLink
                          to={`/candidate/results/${att._id}`}
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1"
                        >
                          <span>Review</span>
                          <ExternalLink className="w-3 h-3" />
                        </NavLink>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
