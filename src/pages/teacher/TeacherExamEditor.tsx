import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, NavLink } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Check,
  AlertCircle,
  HelpCircle,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { teacherAPI } from '../../services/api';
import { Exam, Question, QuestionOption } from '../../types';

export const TeacherExamEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { addToast } = useAuth();

  // Exam Meta
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [duration, setDuration] = useState<number>(30);
  const [passingPercentage, setPassingPercentage] = useState<number>(50);
  const [accessKey, setAccessKey] = useState<string>('');
  const [status, setStatus] = useState<'Draft' | 'Published'>('Draft');
  const [resultReleaseSettings, setResultReleaseSettings] = useState<'immediate' | 'manual'>('immediate');
  const [allowMultipleAttempts, setAllowMultipleAttempts] = useState(false);

  // Questions Array
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: 'q_init_1',
      questionText: '',
      options: [
        { key: 'A', text: '' },
        { key: 'B', text: '' },
        { key: 'C', text: '' },
        { key: 'D', text: '' },
      ],
      correctOption: 'A',
      explanation: '',
      marks: 5,
      order: 1,
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Load existing exam if editing
  useEffect(() => {
    if (isEditing && id) {
      setIsLoading(true);
      teacherAPI
        .getExamById(id)
        .then((exam) => {
          setTitle(exam.title);
          setDescription(exam.description);
          setSubject(exam.subject);
          setDuration(exam.duration);
          setPassingPercentage(exam.passingPercentage);
          setAccessKey(exam.accessKey || '');
          setStatus(exam.status);
          setResultReleaseSettings(exam.resultReleaseSettings || 'immediate');
          setAllowMultipleAttempts(exam.allowMultipleAttempts || false);
          if (exam.questions && exam.questions.length > 0) {
            setQuestions(exam.questions);
          }
        })
        .catch((err) => {
          console.error('Failed to load exam:', err);
          addToast('Could not load examination details.', 'error');
          navigate('/teacher/exams');
        })
        .finally(() => setIsLoading(false));
    }
  }, [id, isEditing]);

  // Question Management Handlers
  const handleAddQuestion = () => {
    const nextOrder = questions.length + 1;
    const newQ: Question = {
      id: 'q_' + Math.random().toString(36).substring(2, 9),
      questionText: '',
      options: [
        { key: 'A', text: '' },
        { key: 'B', text: '' },
        { key: 'C', text: '' },
        { key: 'D', text: '' },
      ],
      correctOption: 'A',
      explanation: '',
      marks: 5,
      order: nextOrder,
    };
    setQuestions([...questions, newQ]);
  };

  const handleDeleteQuestion = (index: number) => {
    if (questions.length <= 1) {
      addToast('An exam must contain at least one question.', 'error');
      return;
    }
    const updated = questions.filter((_, i) => i !== index).map((q, i) => ({ ...q, order: i + 1 }));
    setQuestions(updated);
  };

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === questions.length - 1)) {
      return;
    }
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...questions];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setQuestions(updated.map((q, i) => ({ ...q, order: i + 1 })));
  };

  const handleQuestionTextChange = (index: number, text: string) => {
    const updated = [...questions];
    updated[index].questionText = text;
    setQuestions(updated);
  };

  const handleOptionTextChange = (qIndex: number, optKey: 'A' | 'B' | 'C' | 'D', text: string) => {
    const updated = [...questions];
    const opt = updated[qIndex].options.find((o) => o.key === optKey);
    if (opt) {
      opt.text = text;
      setQuestions(updated);
    }
  };

  const handleAddOptionToQuestion = (qIndex: number) => {
    const q = questions[qIndex];
    if (q.options.length >= 4) return;
    const availableKeys: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];
    const currentKeys = q.options.map((o) => o.key);
    const nextKey = availableKeys.find((k) => !currentKeys.includes(k));
    if (!nextKey) return;

    const updated = [...questions];
    updated[qIndex].options.push({ key: nextKey, text: '' });
    setQuestions(updated);
  };

  const handleRemoveOptionFromQuestion = (qIndex: number, optKey: 'A' | 'B' | 'C' | 'D') => {
    const q = questions[qIndex];
    if (q.options.length <= 2) {
      addToast('At least 2 options are required per MCQ.', 'error');
      return;
    }
    const updated = [...questions];
    updated[qIndex].options = updated[qIndex].options.filter((o) => o.key !== optKey);
    // If the removed option was the selected correct option, reset to first available
    if (updated[qIndex].correctOption === optKey) {
      updated[qIndex].correctOption = updated[qIndex].options[0].key;
    }
    setQuestions(updated);
  };

  const handleSetCorrectOption = (qIndex: number, key: 'A' | 'B' | 'C' | 'D') => {
    const updated = [...questions];
    updated[qIndex].correctOption = key;
    setQuestions(updated);
  };

  const handleMarksChange = (qIndex: number, marks: number) => {
    const updated = [...questions];
    updated[qIndex].marks = Math.max(1, marks);
    setQuestions(updated);
  };

  const handleExplanationChange = (qIndex: number, text: string) => {
    const updated = [...questions];
    updated[qIndex].explanation = text;
    setQuestions(updated);
  };

  const totalCalculatedMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);

  // Validation & Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim()) {
      setFormError('Please enter an exam title.');
      return;
    }
    if (!subject.trim()) {
      setFormError('Please enter the academic subject or domain.');
      return;
    }

    // Validate Questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) {
        setFormError(`Question #${i + 1} is missing its question statement.`);
        return;
      }
      if (q.options.length < 2) {
        setFormError(`Question #${i + 1} must provide at least 2 options.`);
        return;
      }
      for (const opt of q.options) {
        if (!opt.text.trim()) {
          setFormError(`Question #${i + 1} has an empty option (${opt.key}). Please fill or delete it.`);
          return;
        }
      }
      const hasCorrect = q.options.some((o) => o.key === q.correctOption);
      if (!hasCorrect) {
        setFormError(`Question #${i + 1} does not have a valid correct answer assigned.`);
        return;
      }
    }

    setIsSaving(true);
    try {
      const payload = {
        title,
        description,
        subject,
        duration: Number(duration),
        passingPercentage: Number(passingPercentage),
        accessKey: accessKey.trim().toUpperCase(),
        status,
        resultReleaseSettings,
        allowMultipleAttempts,
        questions,
      };

      if (isEditing && id) {
        await teacherAPI.updateExam(id, payload);
        addToast('Exam updated successfully.', 'success');
      } else {
        await teacherAPI.createExam(payload);
        addToast('Exam authored and created successfully.', 'success');
      }
      navigate('/teacher/exams');
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || 'Failed to save exam.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="py-20 text-center text-xs text-zinc-400">Loading exam editor...</div>;
  }

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-5xl mx-auto pb-16 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#27272A]">
        <div>
          <NavLink
            to="/teacher/exams"
            className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Exam Catalog</span>
          </NavLink>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {isEditing ? 'Edit MCQ Examination' : 'Author New MCQ Examination'}
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Design questions with 2-4 options, set answer keys, write pedagogical explanations, and tune timer settings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/teacher/exams')}
            className="px-3.5 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 border border-[#27272A] rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : isEditing ? 'Update Exam' : 'Save & Create Exam'}</span>
          </button>
        </div>
      </div>

      {/* Form Error Banner */}
      {formError && (
        <div className="p-4 bg-rose-950/40 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{formError}</span>
        </div>
      )}

      {/* Section 1: Examination Metadata */}
      <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider text-purple-400">
          General Examination Configuration
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Exam Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Distributed Systems & Consensus Architecture Midterm"
              className="w-full bg-[#111114] border border-[#27272A] rounded-lg px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Description *</label>
            <textarea
              required
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed instructions for candidates, topics covered, and assessment rules..."
              className="w-full bg-[#111114] border border-[#27272A] rounded-lg px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Subject / Department *</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Computer Science, Algorithms, Networks"
              className="w-full bg-[#111114] border border-[#27272A] rounded-lg px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                <span className="text-purple-400 font-bold">★</span>
                <span>Unique Exam Access Key</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  const prefix = (subject.trim().substring(0, 4) || 'EXAM').toUpperCase().replace(/[^A-Z]/g, 'EXAM');
                  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
                  setAccessKey(`${prefix}-${randomSuffix}`);
                }}
                className="text-[11px] text-purple-400 hover:text-purple-300 font-medium underline"
              >
                Auto-generate key
              </button>
            </div>
            <input
              type="text"
              value={accessKey}
              onChange={(e) => setAccessKey(e.target.value.toUpperCase())}
              placeholder="e.g. CS-2026 or ALGO-KEY-99"
              className="w-full bg-[#111114] border border-purple-500/50 rounded-lg px-3.5 py-2 text-xs font-mono font-bold tracking-wider text-purple-300 placeholder-zinc-500 focus:outline-none focus:border-purple-400"
            />
            <p className="text-[10px] text-zinc-400 mt-1">
              Students can enter this unique passcode to directly unlock and attempt this exam.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Duration (Minutes) *
            </label>
            <input
              type="number"
              required
              min={1}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full bg-[#111114] border border-[#27272A] rounded-lg px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Passing Percentage (%) *
            </label>
            <input
              type="number"
              required
              min={0}
              max={100}
              value={passingPercentage}
              onChange={(e) => setPassingPercentage(Number(e.target.value))}
              className="w-full bg-[#111114] border border-[#27272A] rounded-lg px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Publication Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'Draft' | 'Published')}
              className="w-full bg-[#111114] border border-[#27272A] rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
            >
              <option value="Draft">Draft (Only visible to faculty)</option>
              <option value="Published">Published (Available for candidate attempts)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Results & Explanations Release Mode
            </label>
            <select
              value={resultReleaseSettings}
              onChange={(e) => setResultReleaseSettings(e.target.value as 'immediate' | 'manual')}
              className="w-full bg-[#111114] border border-[#27272A] rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
            >
              <option value="immediate">Immediate (Candidates view scores & explanations upon submit)</option>
              <option value="manual">Manual (Held until instructor unlocks exam results)</option>
            </select>
          </div>

          <div className="flex items-center gap-3 pt-6">
            <input
              type="checkbox"
              id="multipleAttempts"
              checked={allowMultipleAttempts}
              onChange={(e) => setAllowMultipleAttempts(e.target.checked)}
              className="w-4 h-4 rounded text-purple-600 bg-[#111114] border-[#27272A] focus:ring-purple-500"
            />
            <label htmlFor="multipleAttempts" className="text-xs text-zinc-300 cursor-pointer">
              Allow candidates multiple attempts on this exam
            </label>
          </div>
        </div>
      </div>

      {/* Section 2: MCQ Question Builder */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#27272A]">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>MCQ Questions Builder</span>
              <span className="text-xs font-mono font-normal text-purple-400">
                ({questions.length} questions · {totalCalculatedMarks} total marks)
              </span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Strictly MCQ format. Provide 2 to 4 options, click the circle to designate the single correct answer.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddQuestion}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Question</span>
          </button>
        </div>

        {/* Questions list */}
        <div className="space-y-6">
          {questions.map((q, qIndex) => (
            <div
              key={q.id || qIndex}
              className="bg-[#18181B] border border-[#27272A] rounded-xl p-5 md:p-6 transition-all"
            >
              {/* Question Header */}
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#27272A]">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-900/60 border border-purple-700/50 flex items-center justify-center text-xs font-mono font-bold text-purple-200">
                    {qIndex + 1}
                  </span>
                  <span className="text-xs font-semibold text-zinc-300">Question #{qIndex + 1}</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 mr-3">
                    <label className="text-[11px] text-zinc-400">Marks:</label>
                    <input
                      type="number"
                      min={1}
                      value={q.marks}
                      onChange={(e) => handleMarksChange(qIndex, Number(e.target.value))}
                      className="w-16 bg-[#111114] border border-[#27272A] rounded px-2 py-1 text-xs text-white font-mono text-center focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  {/* Move Up / Down */}
                  <button
                    type="button"
                    onClick={() => handleMoveQuestion(qIndex, 'up')}
                    disabled={qIndex === 0}
                    className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move question up"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveQuestion(qIndex, 'down')}
                    disabled={qIndex === questions.length - 1}
                    className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move question down"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => handleDeleteQuestion(qIndex)}
                    className="p-1 text-zinc-400 hover:text-rose-400 transition-colors ml-1"
                    title="Delete question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Question Text *
                </label>
                <textarea
                  required
                  rows={2}
                  value={q.questionText}
                  onChange={(e) => handleQuestionTextChange(qIndex, e.target.value)}
                  placeholder="Enter the question prompt or problem statement..."
                  className="w-full bg-[#111114] border border-[#27272A] rounded-lg px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Options (2 to 4) */}
              <div className="space-y-2.5 mb-4">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Multiple Choice Options (Select the radio of the correct answer)</span>
                  {q.options.length < 4 && (
                    <button
                      type="button"
                      onClick={() => handleAddOptionToQuestion(qIndex)}
                      className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Option</span>
                    </button>
                  )}
                </div>

                {q.options.map((opt) => {
                  const isCorrect = q.correctOption === opt.key;
                  return (
                    <div
                      key={opt.key}
                      className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                        isCorrect
                          ? 'bg-purple-950/20 border-purple-500/50'
                          : 'bg-[#111114] border-[#27272A]'
                      }`}
                    >
                      {/* Radio for correct answer */}
                      <button
                        type="button"
                        onClick={() => handleSetCorrectOption(qIndex, opt.key)}
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-xs transition-colors shrink-0 ${
                          isCorrect
                            ? 'bg-purple-600 text-white'
                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                        }`}
                        title="Mark as correct answer"
                      >
                        {opt.key}
                      </button>

                      <input
                        type="text"
                        required
                        value={opt.text}
                        onChange={(e) => handleOptionTextChange(qIndex, opt.key, e.target.value)}
                        placeholder={`Option ${opt.key} text...`}
                        className="flex-1 bg-transparent border-0 text-xs text-white placeholder-zinc-500 focus:outline-none"
                      />

                      {/* Correct indicator badge */}
                      {isCorrect && (
                        <span className="text-[10px] uppercase font-semibold text-purple-300 px-2 py-0.5 rounded bg-purple-900/50 shrink-0">
                          Correct Key
                        </span>
                      )}

                      {/* Remove Option if > 2 */}
                      {q.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOptionFromQuestion(qIndex, opt.key)}
                          className="text-zinc-500 hover:text-rose-400 p-1"
                          title="Remove option"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Explanation Field */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Pedagogical Explanation (Revealed to students after submission)</span>
                </label>
                <textarea
                  rows={2}
                  value={q.explanation || ''}
                  onChange={(e) => handleExplanationChange(qIndex, e.target.value)}
                  placeholder="Explain why the designated option is correct, citing algorithmic rationale or theory..."
                  className="w-full bg-[#111114] border border-[#27272A] rounded-lg px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Add Question Button */}
        <button
          type="button"
          onClick={handleAddQuestion}
          className="w-full py-3 border-2 border-dashed border-[#27272A] hover:border-purple-500/50 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white flex items-center justify-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4 text-purple-400" />
          <span>Add Another Question</span>
        </button>
      </div>
    </form>
  );
};
