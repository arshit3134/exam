import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { BookOpen, Search, Clock, Award, Play, RotateCcw, CheckCircle2, Key, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { candidateAPI } from '../../services/api';
import { ExamCard } from '../../types';

export const CandidateExams: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useAuth();

  const [exams, setExams] = useState<ExamCard[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Key unlock states
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
        addToast(`Exam unlocked! Launching assessment...`, 'success');
        navigate(`/candidate/exam/${res.exam._id}`);
      }
    } catch (err: any) {
      setUnlockError(err.response?.data?.message || 'Invalid exam access key. Please verify with your teacher.');
    } finally {
      setIsUnlocking(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    candidateAPI
      .getAvailableExams()
      .then((data) => setExams(data))
      .catch((err) => console.error('Error fetching exams:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const subjects = ['all', ...Array.from(new Set(exams.map((e) => e.subject)))];

  const filtered = exams.filter((e) => {
    const matchSearch =
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSubject = selectedSubject === 'all' || e.subject === selectedSubject;
    return matchSearch && matchSubject;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#27272A]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Available Examinations</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Browse published evaluations, review duration constraints, and launch your test session.
          </p>
        </div>

        {/* Filter and Search */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search assessment..."
              className="w-full bg-[#18181B] border border-[#27272A] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
          >
            {subjects.map((sub) => (
              <option key={sub} value={sub} className="bg-[#18181B]">
                {sub === 'all' ? 'All Subjects' : sub}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* QUICK PASSCODE UNLOCK BAR */}
      <div className="bg-[#18181B] border border-indigo-500/40 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Key className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="text-xs text-zinc-300">
            Have a unique exam key from your instructor? Enter it here to jump straight in:
          </span>
        </div>
        <form onSubmit={handleUnlockExam} className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            required
            value={accessKeyInput}
            onChange={(e) => setAccessKeyInput(e.target.value.toUpperCase())}
            placeholder="e.g. CLOUD-2026"
            className="w-full md:w-40 bg-[#111114] border border-[#27272A] rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={isUnlocking}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isUnlocking ? 'Unlocking...' : 'Unlock'}</span>
          </button>
        </form>
      </div>

      {unlockError && (
        <div className="p-2.5 rounded-lg bg-rose-950/50 border border-rose-800/60 text-xs text-rose-300">
          {unlockError}
        </div>
      )}

      {isLoading ? (
        <div className="py-20 text-center text-xs text-zinc-400">Loading assessments...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-12 text-center text-xs text-zinc-400">
          No published examinations matching your criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((exam) => (
            <div
              key={exam._id}
              className="bg-[#18181B] border border-[#27272A] hover:border-zinc-700/80 rounded-xl p-6 flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                  <span className="text-indigo-400 font-medium truncate">{exam.subject}</span>
                  <div className="flex items-center gap-1 font-mono text-[11px] text-zinc-400">
                    <Clock className="w-3 h-3" />
                    <span>{exam.duration} mins</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white line-clamp-1">{exam.title}</h3>
                <p className="mt-2 text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                  {exam.description}
                </p>

                {exam.accessKey && (
                  <div className="mt-3 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800/60 text-[11px] font-mono text-purple-300 font-semibold">
                    <Key className="w-3 h-3 text-purple-400" />
                    <span>Key: {exam.accessKey}</span>
                  </div>
                )}

                <div className="mt-5 pt-3 border-t border-[#27272A] grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-[11px] text-zinc-400">Questions</span>
                    <p className="font-mono tabular-nums font-semibold text-zinc-200 mt-0.5">
                      {exam.questionCount} MCQs
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] text-zinc-400">Total Marks</span>
                    <p className="font-mono tabular-nums font-semibold text-zinc-200 mt-0.5">
                      {exam.totalMarks} pts
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] text-zinc-400">Pass Cutoff</span>
                    <p className="font-mono tabular-nums font-semibold text-indigo-400 mt-0.5">
                      {exam.passingPercentage}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#27272A]">
                {exam.hasActiveAttempt ? (
                  <NavLink
                    to={`/candidate/exam/${exam._id}`}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Resume In-Progress Assessment</span>
                  </NavLink>
                ) : exam.isCompleted ? (
                  <NavLink
                    to={exam.latestAttemptId ? `/candidate/results/${exam.latestAttemptId}` : '/candidate/results'}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold border border-[#27272A] transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Completed · Review Score</span>
                  </NavLink>
                ) : (
                  <NavLink
                    to={`/candidate/exam/${exam._id}`}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Start Assessment</span>
                  </NavLink>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
