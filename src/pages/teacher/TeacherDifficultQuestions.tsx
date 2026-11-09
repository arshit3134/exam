import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ArrowLeft, AlertCircle, HelpCircle, Filter, ArrowUpDown } from 'lucide-react';
import { teacherAPI } from '../../services/api';
import { DifficultQuestion, Exam } from '../../types';

export const TeacherDifficultQuestions: React.FC = () => {
  const [questions, setQuestions] = useState<DifficultQuestion[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'rate' | 'count'>('rate');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [qList, eList] = await Promise.all([
          teacherAPI.getDifficultQuestions(),
          teacherAPI.getExams(),
        ]);
        setQuestions(qList);
        setExams(eList);
      } catch (err) {
        console.error('Error loading difficult questions:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const filtered = questions
    .filter((q) => (selectedExamId === 'all' ? true : q.examId === selectedExamId))
    .sort((a, b) => {
      if (sortBy === 'rate') {
        return b.failurePercentage - a.failurePercentage;
      }
      return b.incorrectAnswers - a.incorrectAnswers;
    });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#27272A]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <NavLink
              to="/teacher/dashboard"
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </NavLink>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Most Difficult Questions Diagnostic</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Item-response failure analysis calculated across student assessment submissions in MongoDB.
          </p>
        </div>

        {/* Filter & Sort Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="bg-transparent text-zinc-200 focus:outline-none"
            >
              <option value="all" className="bg-[#18181B]">All Examinations</option>
              {exams.map((e) => (
                <option key={e._id} value={e._id} className="bg-[#18181B]">
                  {e.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-1.5 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'rate' | 'count')}
              className="bg-transparent text-zinc-200 focus:outline-none"
            >
              <option value="rate" className="bg-[#18181B]">Sort by Failure %</option>
              <option value="count" className="bg-[#18181B]">Sort by Incorrect Count</option>
            </select>
          </div>
        </div>
      </div>

      {/* Questions List */}
      {isLoading ? (
        <div className="py-20 text-center text-xs text-zinc-400">Loading diagnostic metrics...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-12 text-center text-xs text-zinc-400">
          No question attempts recorded for the selected filter.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item, idx) => {
            const isHighRisk = item.failurePercentage >= 50;
            return (
              <div
                key={item.questionId}
                className="bg-[#18181B] border border-[#27272A] hover:border-zinc-700/80 rounded-xl p-5 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
                      <span className="font-mono text-zinc-400 font-semibold">Rank #{idx + 1}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-purple-400">{item.examTitle}</span>
                      <span aria-hidden="true">·</span>
                      <span>{item.totalAttempts} total attempts</span>
                    </div>

                    <h3 className="text-sm font-semibold text-white leading-relaxed">
                      {item.questionText}
                    </h3>

                    <div className="mt-4 flex flex-wrap items-center gap-4 text-xs">
                      <div className="p-2.5 rounded-lg bg-[#111114] border border-[#27272A] flex items-center gap-2">
                        <span className="text-zinc-400">Correct Option:</span>
                        <span className="font-mono font-bold text-emerald-400 px-1.5 py-0.5 bg-emerald-950/60 rounded">
                          {item.correctOption}
                        </span>
                        <span className="text-zinc-300 font-medium">{item.correctOptionText.replace(/^[A-D]:\s*/, '')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Failure Metric Card */}
                  <div className="w-full md:w-56 shrink-0 bg-[#111114] border border-[#27272A] rounded-lg p-3 text-right">
                    <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                      <span>Failure Rate</span>
                      <span className="font-mono tabular-nums text-rose-400 font-bold text-sm">
                        {item.failurePercentage}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-2">
                      <div
                        className={`h-full rounded-full ${
                          isHighRisk ? 'bg-rose-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(100, item.failurePercentage)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-zinc-400">
                      <span>Incorrect Answers:</span>
                      <span className="font-mono tabular-nums font-semibold text-zinc-200">
                        {item.incorrectAnswers} / {item.totalAttempts}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-1">
                      <span>Correct Answers:</span>
                      <span className="font-mono tabular-nums font-semibold text-emerald-400">
                        {item.correctAnswers}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
