import React, { useEffect, useState } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { ArrowLeft, Users, CheckCircle2, XCircle, Clock, Calendar, ExternalLink } from 'lucide-react';
import { teacherAPI } from '../../services/api';
import { ExamAttempt } from '../../types';

export const TeacherExamAttempts: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [examTitle, setExamTitle] = useState('');
  const [totalMarks, setTotalMarks] = useState(0);
  const [passingPercentage, setPassingPercentage] = useState(50);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      setIsLoading(true);
      teacherAPI
        .getExamAttempts(id)
        .then((res) => {
          setExamTitle(res.examTitle);
          setTotalMarks(res.totalMarks);
          setPassingPercentage(res.passingPercentage);
          setAttempts(res.attempts || []);
        })
        .catch((err) => {
          console.error('Error fetching attempts:', err);
        })
        .finally(() => setIsLoading(false));
    }
  }, [id]);

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}m ${s}s`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="pb-4 border-b border-[#27272A]">
        <NavLink
          to="/teacher/exams"
          className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 mb-2 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Exam Catalog</span>
        </NavLink>
        <h1 className="text-2xl font-bold tracking-tight text-white">Student Exam Submissions</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Review candidate attempts for <span className="text-purple-400 font-semibold">{examTitle}</span> ({totalMarks} pts · {passingPercentage}% passing cutoff)
        </p>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-xs text-zinc-400">Loading student attempts...</div>
      ) : attempts.length === 0 ? (
        <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-12 text-center text-xs text-zinc-400">
          <Users className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
          <p className="text-zinc-200 font-medium">No candidate attempts submitted yet.</p>
          <p className="text-zinc-500 mt-1">Once candidates complete this assessment, their evaluations will appear here.</p>
        </div>
      ) : (
        <div className="bg-[#18181B] border border-[#27272A] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#27272A] text-zinc-400 font-medium bg-[#111114]">
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4 text-center">Score</th>
                  <th className="py-3 px-4 text-center">Percentage</th>
                  <th className="py-3 px-4 text-center">Correct / Total</th>
                  <th className="py-3 px-4 text-center">Outcome</th>
                  <th className="py-3 px-4 text-center">Duration</th>
                  <th className="py-3 px-4 text-right">Submitted At</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272A]/60">
                {attempts.map((att) => {
                  const passed = att.percentage >= passingPercentage;
                  return (
                    <tr key={att._id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-white whitespace-nowrap">
                        {att.candidateName}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-400 font-mono text-[11px] whitespace-nowrap">
                        {att.candidateEmail}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-zinc-200">
                        {att.score} / {totalMarks}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold">
                        <span className={passed ? 'text-emerald-400' : 'text-rose-400'}>
                          {att.percentage}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-zinc-300">
                        {att.correctCount} / {att.correctCount + att.incorrectCount + att.unansweredCount}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            passed
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
                              : 'bg-rose-950/80 text-rose-300 border border-rose-700/60'
                          }`}
                        >
                          {passed ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          <span>{passed ? 'Passed' : 'Failed'}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-zinc-400 text-[11px]">
                        {formatSeconds(att.timeTaken || 0)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-zinc-400 text-[11px] whitespace-nowrap">
                        {new Date(att.submittedAt || att.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <NavLink
                          to={`/candidate/results/${att._id}`}
                          className="text-xs text-purple-400 hover:text-purple-300 font-medium inline-flex items-center gap-1"
                        >
                          <span>Review</span>
                          <ExternalLink className="w-3 h-3" />
                        </NavLink>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
