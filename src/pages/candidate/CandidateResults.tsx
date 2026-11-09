import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Award, CheckCircle2, XCircle, Clock, Calendar, ExternalLink } from 'lucide-react';
import { candidateAPI } from '../../services/api';

export const CandidateResults: React.FC = () => {
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    candidateAPI
      .getMyResults()
      .then((data) => setResults(data || []))
      .catch((err) => console.error('Error fetching results:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}m ${s}s`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="pb-4 border-b border-[#27272A]">
        <h1 className="text-2xl font-bold tracking-tight text-white">My Examination Results</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Historical record of completed assessments, score distributions, and detailed pedagogical feedback.
        </p>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-xs text-zinc-400">Loading exam results...</div>
      ) : results.length === 0 ? (
        <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-12 text-center text-xs text-zinc-400">
          <Award className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
          <p className="text-zinc-200 font-medium">No completed examinations found.</p>
          <p className="text-zinc-500 mt-1">When you complete an assessment, your verified scorecard will appear here.</p>
          <NavLink
            to="/candidate/exams"
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <span>Browse Available Exams</span>
          </NavLink>
        </div>
      ) : (
        <div className="bg-[#18181B] border border-[#27272A] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#27272A] text-zinc-400 font-medium bg-[#111114]">
                  <th className="py-3.5 px-4">Exam Name</th>
                  <th className="py-3.5 px-4 text-center">Score</th>
                  <th className="py-3.5 px-4 text-center">Percentage</th>
                  <th className="py-3.5 px-4 text-center">Outcome</th>
                  <th className="py-3.5 px-4 text-center">Correct / Total</th>
                  <th className="py-3.5 px-4 text-center">Time Spent</th>
                  <th className="py-3.5 px-4 text-right">Attempt Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272A]/60">
                {results.map((att) => (
                  <tr key={att._id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white whitespace-nowrap">
                      {att.examTitle}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-zinc-200">
                      {att.score} / {att.totalMarks}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold">
                      <span className={att.passed ? 'text-emerald-400' : 'text-rose-400'}>
                        {att.percentage}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          att.passed
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
                            : 'bg-rose-950/80 text-rose-300 border border-rose-700/60'
                        }`}
                      >
                        {att.passed ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        <span>{att.passed ? 'Passed' : 'Failed'}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-zinc-300">
                      {att.correctCount} / {att.correctCount + att.incorrectCount + att.unansweredCount}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-zinc-400 text-[11px]">
                      {formatSeconds(att.timeTaken || 0)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-zinc-400 text-[11px] whitespace-nowrap">
                      {new Date(att.submittedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <NavLink
                        to={`/candidate/results/${att._id}`}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1"
                      >
                        <span>View Review</span>
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
  );
};
