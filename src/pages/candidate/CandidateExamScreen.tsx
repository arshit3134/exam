import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Send,
  RotateCcw,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import { candidateAPI } from '../../services/api';

interface ExamQuestion {
  id: string;
  questionText: string;
  options: Array<{ key: 'A' | 'B' | 'C' | 'D'; text: string }>;
  marks: number;
  order: number;
}

export const CandidateExamScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // exam ID
  const navigate = useNavigate();
  const { addToast } = useAuth();

  const [attemptId, setAttemptId] = useState<string>('');
  const [examTitle, setExamTitle] = useState<string>('');
  const [totalMarks, setTotalMarks] = useState<number>(0);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Answers Map: { [questionId]: 'A' | 'B' | 'C' | 'D' | null }
  const [answers, setAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D' | null>>({});

  // Visited Tracker: Set of question indices that have been viewed
  const [visited, setVisited] = useState<Set<number>>(new Set([0]));

  // Timer states
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Submission & Confirmation states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [isAutoSaving, setIsAutoSaving] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const answersRef = useRef(answers);
  answersRef.current = answers;

  // 1. Initialize or Resume Examination Attempt
  useEffect(() => {
    if (!id) return;

    let isMounted = true;
    setIsLoading(true);

    candidateAPI
      .startExam(id)
      .then((res) => {
        if (!isMounted) return;
        setAttemptId(res.attempt._id);
        setExamTitle(res.attempt.examTitle);
        setTotalMarks(res.attempt.totalMarks);
        setQuestions(res.questions);
        setAnswers(res.attempt.answers || {});
        setSecondsRemaining(res.attempt.timeRemainingSeconds);
        setIsTimerRunning(true);
        setIsLoading(false);

        // Mark previously answered questions as visited
        const initialVisited = new Set<number>([0]);
        if (res.attempt.answers) {
          res.questions.forEach((q, idx) => {
            if (res.attempt.answers[q.id]) {
              initialVisited.add(idx);
            }
          });
        }
        setVisited(initialVisited);
      })
      .catch((err) => {
        if (!isMounted) return;
        const msg = err.response?.data?.message || 'Could not launch examination.';
        setErrorMessage(msg);
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  // 2. Countdown Timer Loop
  useEffect(() => {
    if (!isTimerRunning) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsTimerRunning(false);
          handleAutoSubmitOnTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, attemptId]);

  // 3. Periodic Background Answer Auto-save (every 15 seconds)
  useEffect(() => {
    if (!attemptId || !isTimerRunning) return;

    const autoSaveInterval = setInterval(async () => {
      try {
        setIsAutoSaving(true);
        await candidateAPI.saveAnswers(attemptId, answersRef.current);
      } catch (err) {
        console.warn('Background auto-save failed');
      } finally {
        setTimeout(() => setIsAutoSaving(false), 800);
      }
    }, 15000);

    return () => clearInterval(autoSaveInterval);
  }, [attemptId, isTimerRunning]);

  // Handle Option Selection
  const handleSelectOption = (optKey: 'A' | 'B' | 'C' | 'D') => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const updated = {
      ...answers,
      [currentQ.id]: optKey,
    };
    setAnswers(updated);
  };

  const handleClearSelection = () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const updated = {
      ...answers,
      [currentQ.id]: null,
    };
    setAnswers(updated);
  };

  // Navigation handlers
  const handleJumpToQuestion = (index: number) => {
    setCurrentIndex(index);
    setVisited((prev) => new Set([...prev, index]));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      handleJumpToQuestion(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      handleJumpToQuestion(currentIndex - 1);
    }
  };

  // Timer Formatter
  const formatTimer = (sec: number) => {
    const hours = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    if (hours > 0) {
      return `${pad(hours)}:${pad(mins)}:${pad(s)}`;
    }
    return `${pad(mins)}:${pad(s)}`;
  };

  // Submissions
  const handleFinalSubmit = async () => {
    if (!attemptId || isSubmitting) return;

    setIsSubmitting(true);
    setShowSubmitModal(false);

    try {
      const res = await candidateAPI.submitExam(attemptId, answers);
      addToast('Examination submitted successfully! Evaluating results...', 'success');
      navigate(`/candidate/results/${res.attemptId}`);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to submit exam.';
      addToast(msg, 'error');
      setIsSubmitting(false);
    }
  };

  const handleAutoSubmitOnTimeout = async () => {
    addToast('Time limit reached! System is automatically submitting your assessment...', 'info');
    if (!attemptId) return;

    setIsSubmitting(true);
    try {
      const res = await candidateAPI.submitExam(attemptId, answersRef.current);
      navigate(`/candidate/results/${res.attemptId}`);
    } catch (err: any) {
      console.error('Auto-submit failed:', err);
      navigate('/candidate/results');
    }
  };

  // Quantitative Stats for confirmation modal
  const answeredCount = questions.filter((q) => Boolean(answers[q.id])).length;
  const unansweredCount = questions.length - answeredCount;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090B] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
        <h2 className="text-base font-semibold text-white">Launching Examination Workspace...</h2>
        <p className="text-xs text-zinc-400 mt-1">Verifying candidate permissions and loading assessment payload</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-[#09090B] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-rose-950/60 border border-rose-800/80 flex items-center justify-center text-rose-400 mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-white">Examination Access Restricted</h2>
        <p className="text-xs text-zinc-400 mt-2 max-w-md leading-relaxed">{errorMessage}</p>
        <button
          onClick={() => navigate('/candidate/exams')}
          className="mt-6 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
        >
          Return to Available Exams
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  if (!currentQ) return null;

  const currentAnswer = answers[currentQ.id] || null;
  const isTimeCritical = secondsRemaining <= 300; // Under 5 mins

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col select-none">
      {/* Top Distraction-Free Header */}
      <header className="sticky top-0 z-40 bg-[#111114] border-b border-[#27272A] px-4 md:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-white truncate">{examTitle}</h1>
            <p className="text-[11px] text-zinc-400">
              Question {currentIndex + 1} of {questions.length} · {currentQ.marks} Marks
            </p>
          </div>
        </div>

        {/* Center: Countdown Timer */}
        <div
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border font-mono font-bold text-sm tracking-widest ${
            isTimeCritical
              ? 'bg-rose-950/80 border-rose-700/80 text-rose-300 animate-pulse'
              : 'bg-[#18181B] border-[#27272A] text-zinc-100'
          }`}
        >
          <Clock className={`w-4 h-4 ${isTimeCritical ? 'text-rose-400' : 'text-indigo-400'}`} />
          <span>{formatTimer(secondsRemaining)}</span>
        </div>

        {/* Right: Submit Button & Autosave Status */}
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-block text-[10px] text-zinc-500 font-mono">
            {isAutoSaving ? 'Saving...' : 'Autosaved'}
          </span>
          <button
            onClick={() => setShowSubmitModal(true)}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors whitespace-nowrap"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Finish & Submit</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 md:p-6 gap-6">
        {/* Left Side: Question Navigation Palette */}
        <aside className="w-full md:w-72 bg-[#18181B] border border-[#27272A] rounded-xl p-5 flex flex-col justify-between shrink-0 order-2 md:order-1">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
              Question Palette
            </h3>

            {/* Status Legend (Strictly unboxed text with separators per skill) */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400 pb-4 mb-4 border-b border-[#27272A]">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-purple-600 shrink-0" />
                <span>Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-600/80 shrink-0" />
                <span>Unanswered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-zinc-800 shrink-0" />
                <span>Not Visited</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded ring-2 ring-white bg-zinc-800 shrink-0" />
                <span>Current</span>
              </div>
            </div>

            {/* Question Buttons Matrix */}
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-4 gap-2">
              {questions.map((q, idx) => {
                const isAnswered = Boolean(answers[q.id]);
                const isCurrent = idx === currentIndex;
                const isVisited = visited.has(idx);

                let bgClass = 'bg-[#111114] text-zinc-400 hover:bg-zinc-800 border border-[#27272A]';
                if (isAnswered) {
                  bgClass = 'bg-purple-600 text-white font-bold border border-purple-500';
                } else if (isVisited && !isAnswered) {
                  bgClass = 'bg-amber-600/30 text-amber-300 font-semibold border border-amber-600/50';
                }

                if (isCurrent) {
                  bgClass += ' ring-2 ring-white ring-offset-2 ring-offset-[#18181B]';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => handleJumpToQuestion(idx)}
                    className={`h-9 rounded-lg text-xs font-mono transition-all flex items-center justify-center ${bgClass}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Attempt Overview */}
          <div className="mt-6 pt-4 border-t border-[#27272A] text-xs text-zinc-400">
            <div className="flex justify-between py-1">
              <span>Total Questions:</span>
              <span className="font-mono text-white font-semibold">{questions.length}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Answered:</span>
              <span className="font-mono text-purple-400 font-semibold">{answeredCount}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Unanswered:</span>
              <span className="font-mono text-amber-400 font-semibold">{unansweredCount}</span>
            </div>
          </div>
        </aside>

        {/* Right Side: Active Question & MCQ Options */}
        <main className="flex-1 bg-[#18181B] border border-[#27272A] rounded-xl p-6 md:p-8 flex flex-col justify-between order-1 md:order-2">
          <div>
            {/* Question Header & Points */}
            <div className="flex items-center justify-between pb-3 mb-6 border-b border-[#27272A]">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-indigo-950/80 border border-indigo-700/60 flex items-center justify-center text-xs font-mono font-bold text-indigo-300">
                  {currentIndex + 1}
                </span>
                <span className="text-xs font-semibold text-zinc-300">Question {currentIndex + 1}</span>
              </div>
              <span className="px-2.5 py-1 rounded bg-[#111114] border border-[#27272A] text-xs font-mono text-zinc-300">
                {currentQ.marks} {currentQ.marks === 1 ? 'Point' : 'Points'}
              </span>
            </div>

            {/* Question Text */}
            <div className="mb-8">
              <h2 className="text-base md:text-lg font-semibold text-white leading-relaxed">
                {currentQ.questionText}
              </h2>
            </div>

            {/* MCQ Options (Single Choice Only) */}
            <div className="space-y-3">
              {currentQ.options.map((opt) => {
                const isSelected = currentAnswer === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => handleSelectOption(opt.key)}
                    className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-3.5 group cursor-pointer ${
                      isSelected
                        ? 'bg-purple-950/30 border-purple-500 shadow-md text-white'
                        : 'bg-[#111114] border-[#27272A] hover:border-zinc-700 text-zinc-300'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-mono font-bold text-xs shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-purple-600 text-white'
                          : 'bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700 group-hover:text-white'
                      }`}
                    >
                      {opt.key}
                    </div>
                    <span className="text-xs md:text-sm font-medium leading-relaxed">{opt.text}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Footer: Clear selection, Previous, Next */}
          <div className="mt-8 pt-5 border-t border-[#27272A] flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleClearSelection}
              disabled={!currentAnswer}
              className="px-3 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors"
            >
              Clear Choice
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="flex items-center gap-1 px-4 py-2 bg-[#111114] hover:bg-zinc-800 disabled:opacity-30 border border-[#27272A] rounded-lg text-xs font-semibold text-zinc-300 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              {currentIndex < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-semibold text-white shadow-sm transition-colors"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(true)}
                  className="flex items-center gap-1 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-xs font-semibold text-white shadow-sm transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Review & Submit</span>
                </button>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Confirmation Modal Before Final Submission */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Confirm Examination Submission"
      >
        <div>
          <p className="text-zinc-300 leading-relaxed text-xs">
            Are you sure you are ready to conclude and submit your assessment? Once submitted, your answers will be locked and automatically evaluated on the server.
          </p>

          <div className="my-5 p-4 bg-[#111114] border border-[#27272A] rounded-xl grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-zinc-400">Answered Questions:</span>
              <p className="font-mono text-purple-400 font-bold text-base mt-0.5">
                {answeredCount} / {questions.length}
              </p>
            </div>
            <div>
              <span className="text-zinc-400">Unanswered Questions:</span>
              <p className="font-mono text-amber-400 font-bold text-base mt-0.5">
                {unansweredCount}
              </p>
            </div>
          </div>

          {unansweredCount > 0 && (
            <div className="mb-5 p-3 bg-amber-950/40 border border-amber-800/60 rounded-lg text-xs text-amber-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                You have {unansweredCount} unanswered {unansweredCount === 1 ? 'question' : 'questions'}. Unanswered questions will receive 0 marks.
              </span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#27272A]">
            <button
              onClick={() => setShowSubmitModal(false)}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 border border-[#27272A] rounded-lg transition-colors"
            >
              Return to Exam
            </button>
            <button
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting & Grading...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirm Final Submission</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
