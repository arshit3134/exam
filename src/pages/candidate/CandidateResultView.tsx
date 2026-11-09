import React, { useEffect, useState } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import {
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  ArrowLeft,
  Lock,
  ChevronRight,
  TrendingUp,
  FileCheck2,
} from 'lucide-react';
import { StatCard } from '../../components/common/StatCard';
import { candidateAPI } from '../../services/api';
import { QuestionReviewItem } from '../../types';

export const CandidateResultView: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // attempt ID
  const [attempt, setAttempt] = useState<any>(null);
  const [questionsReview, setQuestionsReview] = useState<QuestionReviewItem[]>([]);
  const [resultReleased, setResultReleased] = useState<boolean>(true);
  const [unreleasedMessage, setUnreleasedMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (id) {
      setIsLoading(true);
      candidateAPI
        .getResultDetail(id)
        .then((res) => {
          setResultReleased(res.resultReleased);
          setAttempt(res.attempt);
          if (res.resultReleased && res.questionsReview) {
            setQuestionsReview(res.questionsReview);
          } else if (res.message) {
            setUnreleasedMessage(res.message);
          }
        })
        .catch((err) => console.error('Error fetching result:', err))
        .finally(() => setIsLoading(false));
    }
  }, [id]);

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}m ${s}s`;
  };

  if (isLoading) {
    return <div className="py-20 text-center text-xs text-zinc-400">Loading assessment evaluation report...</div>;
  }

  if (!attempt) {
    return (
      <div className="py-20 text-center text-xs text-zinc-400">
        <p>No evaluation report found for this ID.</p>
        <NavLink to="/candidate/results" className="mt-3 text-indigo-400 underline inline-block">
          Return to My Results
        </NavLink>
      </div>
    );
  }

  // If results are held manually by the teacher
  if (!resultReleased) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-6 text-center animate-in fade-in duration-150">
        <div className="w-14 h-14 rounded-2xl bg-amber-950/60 border border-amber-800/80 flex items-center justify-center text-amber-400 mx-auto mb-4">
          <Lock className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Assessment Submitted Successfully</h1>
        <p className="mt-3 text-sm text-zinc-400 leading-relaxed max-w-md mx-auto">
          {unreleasedMessage ||
            'Your examination answers have been securely recorded. The instructor has configured this assessment for manual result release. Scores and answer keys will appear once published by faculty.'}
        </p>

        <div className="mt-8 p-4 bg-[#18181B] border border-[#27272A] rounded-xl text-left max-w-md mx-auto text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-zinc-400">Exam:</span>
            <span className="font-semibold text-white">{attempt.examTitle}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Time Taken:</span>
            <span className="font-mono text-zinc-300">{formatSeconds(attempt.timeTaken)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Status:</span>
            <span className="font-semibold text-emerald-400">Submitted & Stored</span>
          </div>
        </div>

        <NavLink
          to="/candidate/dashboard"
          className="mt-8 inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
        >
          <span>Return to Dashboard</span>
          <ChevronRight className="w-4 h-4" />
        </NavLink>
      </div>
    );
  }

  const passed = attempt.passed;

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-150 pb-16">
      {/* Top Breadcrumb & Nav */}
      <div className="flex items-center justify-between pb-4 border-b border-[#27272A]">
        <NavLink
          to="/candidate/results"
          className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Results</span>
        </NavLink>
        <div className="text-xs text-zinc-400 font-mono">
          Assessment Report #{attempt._id.substring(0, 8)}
        </div>
      </div>

      {/* Primary Scorecard Header */}
      <div
        className={`border rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 ${
          passed
            ? 'bg-linear-to-br from-emerald-950/30 via-[#18181B] to-[#18181B] border-emerald-500/30'
            : 'bg-linear-to-br from-rose-950/30 via-[#18181B] to-[#18181B] border-rose-500/30'
        }`}
      >
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-2">
            <span className={passed ? 'text-emerald-400' : 'text-rose-400'}>
              {passed ? 'Examination Passed' : 'Minimum Passing Cutoff Not Reached'}
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-zinc-400">{attempt.subject || 'Engineering'}</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            {attempt.examTitle}
          </h1>

          <p className="mt-2 text-xs text-zinc-400 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            <span>Time Taken: {formatSeconds(attempt.timeTaken)}</span>
            <span aria-hidden="true">·</span>
            <span>Completed on {new Date(attempt.submittedAt).toLocaleDateString()}</span>
          </p>
        </div>

        {/* Big Percentage & Score Gauge */}
        <div className="flex items-center gap-4 bg-[#111114] border border-[#27272A] rounded-2xl p-5 self-start md:self-auto shrink-0">
          <div className="text-right">
            <p className="text-[11px] text-zinc-400 uppercase font-medium">Final Score</p>
            <p className="text-2xl font-black text-white font-mono tabular-nums">
              {attempt.score} <span className="text-xs font-normal text-zinc-400">/ {attempt.totalMarks}</span>
            </p>
            <p className="text-[10px] text-zinc-500 font-mono">
              Cutoff: {attempt.passingPercentage}%
            </p>
          </div>

          <div
            className={`w-16 h-16 rounded-xl flex items-center justify-center font-mono font-bold text-xl ${
              passed
                ? 'bg-emerald-950/80 border border-emerald-600 text-emerald-300'
                : 'bg-rose-950/80 border border-rose-600 text-rose-300'
            }`}
          >
            {attempt.percentage}%
          </div>
        </div>
      </div>

      {/* Quantitative Stat Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Total Marks"
          value={`${attempt.score} / ${attempt.totalMarks}`}
          unit="points"
          icon={Award}
        />
        <StatCard
          label="Correct Answers"
          value={attempt.correctCount}
          unit="items"
          icon={CheckCircle2}
        />
        <StatCard
          label="Incorrect Answers"
          value={attempt.incorrectCount}
          unit="items"
          icon={XCircle}
        />
        <StatCard
          label="Unanswered"
          value={attempt.unansweredCount}
          unit="items"
          icon={HelpCircle}
        />
      </div>

      {/* Detailed Answer Review Section */}
      <div className="space-y-6 pt-4">
        <div className="pb-2 border-b border-[#27272A]">
          <h2 className="text-base font-bold text-white">Question-by-Question Review</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Pedagogical breakdowns with your selected answer, the official correct answer, and faculty explanations.
          </p>
        </div>

        <div className="space-y-6">
          {questionsReview.map((q, idx) => {
            const isCorrect = q.isCorrect;
            const isUnanswered = q.isUnanswered;

            let cardBorder = 'border-[#27272A]';
            if (isCorrect) cardBorder = 'border-emerald-500/40 bg-emerald-950/10';
            else if (!isUnanswered) cardBorder = 'border-rose-500/40 bg-rose-950/10';

            return (
              <div
                key={q.id}
                className={`bg-[#18181B] border rounded-xl p-5 md:p-6 transition-all ${cardBorder}`}
              >
                {/* Question Status Header */}
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#27272A]">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-mono font-bold text-zinc-200">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-white">Question {idx + 1}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isCorrect ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-950/80 border border-emerald-600 text-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Correct (+{q.marks} pts)</span>
                      </span>
                    ) : isUnanswered ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-zinc-800 border border-zinc-700 text-zinc-400">
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Unanswered (0 pts)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-rose-950/80 border border-rose-600 text-rose-300">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Incorrect (0 pts)</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Question Statement */}
                <div className="mb-5">
                  <h3 className="text-sm font-semibold text-white leading-relaxed">
                    {q.questionText}
                  </h3>
                </div>

                {/* MCQ Options with Green / Red / Neutral Visual Indicators */}
                <div className="space-y-2 mb-5">
                  {q.options.map((opt) => {
                    const isCandidateChoice = q.candidateAnswer === opt.key;
                    const isOfficialCorrect = q.correctOption === opt.key;

                    let optStyle = 'bg-[#111114] border-[#27272A] text-zinc-300';
                    if (isOfficialCorrect) {
                      optStyle = 'bg-emerald-950/40 border-emerald-500/80 text-emerald-200 font-medium';
                    } else if (isCandidateChoice && !isCorrect) {
                      optStyle = 'bg-rose-950/40 border-rose-500/80 text-rose-200 line-through';
                    }

                    return (
                      <div
                        key={opt.key}
                        className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-3 ${optStyle}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center font-mono font-bold text-[11px] ${
                              isOfficialCorrect
                                ? 'bg-emerald-600 text-white'
                                : isCandidateChoice
                                ? 'bg-rose-600 text-white'
                                : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            {opt.key}
                          </span>
                          <span>{opt.text}</span>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider shrink-0">
                          {isCandidateChoice && (
                            <span className={isCorrect ? 'text-emerald-400' : 'text-rose-400'}>
                              (Your Choice)
                            </span>
                          )}
                          {isOfficialCorrect && (
                            <span className="text-emerald-400 font-bold">
                              ✓ Correct Answer
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Faculty Pedagogical Explanation */}
                {q.explanation && (
                  <div className="p-4 bg-[#111114] border border-[#27272A] rounded-lg text-xs">
                    <div className="flex items-center gap-1.5 text-purple-400 font-semibold mb-1">
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Instructor's Explanation:</span>
                    </div>
                    <p className="text-zinc-300 leading-relaxed">{q.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
