import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FileCheck2,
  Plus,
  Clock,
  Award,
  Users,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  Share2,
  Unlock,
  Lock,
  Key,
  Copy,
  Check,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import { teacherAPI } from '../../services/api';
import { Exam } from '../../types';

export const TeacherExams: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    addToast(`Exam Key "${key}" copied to clipboard!`, 'info');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const loadExams = async () => {
    setIsLoading(true);
    try {
      const data = await teacherAPI.getExams();
      setExams(data);
    } catch (err) {
      console.error('Failed to load exams:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  const handleTogglePublish = async (exam: Exam) => {
    try {
      const updated = await teacherAPI.togglePublish(exam._id);
      setExams((prev) => prev.map((e) => (e._id === updated._id ? updated : e)));
      addToast(`Exam status set to ${updated.status}.`, 'success');
    } catch (err) {
      addToast('Failed to update status.', 'error');
    }
  };

  const handleToggleResultRelease = async (exam: Exam) => {
    try {
      const updated = await teacherAPI.toggleResultRelease(exam._id);
      setExams((prev) => prev.map((e) => (e._id === updated._id ? updated : e)));
      addToast(`Results release mode set to ${updated.resultReleaseSettings}.`, 'success');
    } catch (err) {
      addToast('Failed to update result release mode.', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!examToDelete) return;
    setIsDeleting(true);
    try {
      await teacherAPI.deleteExam(examToDelete._id);
      setExams((prev) => prev.filter((e) => e._id !== examToDelete._id));
      addToast('Exam deleted successfully.', 'success');
      setExamToDelete(null);
    } catch (err) {
      addToast('Failed to delete exam.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#27272A]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Examination Catalog</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Author and orchestrate MCQ assessments, distribute unique student access keys, and manage schedules.
          </p>
        </div>
        <NavLink
          to="/teacher/exams/new"
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Exam</span>
        </NavLink>
      </div>

      {/* ALL UNIQUE EXAM KEYS OVERVIEW (Teacher requested: 'the teacher should be able to see all unique keys for exams') */}
      {exams.length > 0 && (
        <div className="bg-[#18181B] border border-purple-500/30 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
              <Key className="w-4 h-4 text-purple-400" />
              <span>All Unique Exam Access Keys</span>
            </div>
            <span className="text-[11px] text-zinc-400 font-mono">
              Share these codes with students to unlock exams
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {exams.map((e) => {
              const keyVal = e.accessKey || 'NO-KEY';
              const isCopied = copiedKey === keyVal;
              return (
                <div
                  key={e._id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-[#111114] border border-[#27272A] text-xs hover:border-zinc-700 transition-colors"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-white font-semibold truncate text-[11px]">{e.title}</p>
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider">{e.subject}</span>
                  </div>
                  <button
                    onClick={() => handleCopyKey(keyVal)}
                    className="flex items-center gap-1.5 px-2 py-1 rounded bg-purple-950/70 border border-purple-600/60 text-purple-200 font-mono font-bold text-xs hover:bg-purple-900 transition-colors shrink-0"
                    title="Click to copy student access key"
                  >
                    <span>{keyVal}</span>
                    {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-purple-400" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Exam Grid */}
      {isLoading ? (
        <div className="py-20 text-center text-xs text-zinc-400">Loading exams...</div>
      ) : exams.length === 0 ? (
        <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-12 text-center">
          <FileCheck2 className="w-10 h-10 text-zinc-500 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-white">No examinations created yet</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            Get started by authoring your first MCQ-based assessment with multiple-choice questions.
          </p>
          <NavLink
            to="/teacher/exams/new"
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Exam</span>
          </NavLink>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exams.map((exam) => {
            const isPublished = exam.status === 'Published';
            const isImmediate = exam.resultReleaseSettings === 'immediate';
            const keyVal = exam.accessKey || 'UNSET';
            const isCopied = copiedKey === keyVal;

            return (
              <div
                key={exam._id}
                className="bg-[#18181B] border border-[#27272A] hover:border-zinc-700/80 rounded-xl p-5 flex flex-col justify-between transition-all"
              >
                <div>
                  {/* Meta Bar */}
                  <div className="flex items-center justify-between gap-2 text-xs text-zinc-400 mb-2">
                    <span className="text-purple-400 font-medium truncate">{exam.subject}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase ${
                          isPublished
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                        }`}
                      >
                        {exam.status}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase ${
                          isImmediate
                            ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-700/60'
                            : 'bg-amber-950/80 text-amber-300 border border-amber-700/60'
                        }`}
                      >
                        {isImmediate ? 'Instant Results' : 'Manual Release'}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white line-clamp-1">{exam.title}</h3>
                  <p className="mt-1.5 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {exam.description}
                  </p>

                  {/* Highlighted Unique Access Key for each exam */}
                  <div className="mt-3.5 p-2 rounded-lg bg-[#111114] border border-purple-500/40 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-300">
                      <Key className="w-3.5 h-3.5 text-purple-400" />
                      <span className="text-zinc-400">Student Entry Key:</span>
                      <span className="font-mono font-bold text-purple-300 tracking-wider text-xs">
                        {keyVal}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyKey(keyVal)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-medium transition-colors"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-zinc-400" />
                          <span>Copy Key</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Quantitative specs */}
                  <div className="mt-4 pt-3 border-t border-[#27272A] grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-[11px] text-zinc-400">Duration</p>
                      <p className="font-mono tabular-nums text-zinc-200 font-semibold mt-0.5">
                        {exam.duration} mins
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-zinc-400">Questions</p>
                      <p className="font-mono tabular-nums text-zinc-200 font-semibold mt-0.5">
                        {exam.questions.length} MCQs
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-zinc-400">Total Marks</p>
                      <p className="font-mono tabular-nums text-purple-400 font-semibold mt-0.5">
                        {exam.totalMarks} pts ({exam.passingPercentage}% pass)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="mt-5 pt-3 border-t border-[#27272A] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Toggle Publish */}
                    <button
                      onClick={() => handleTogglePublish(exam)}
                      className={`px-2.5 py-1.5 rounded-md text-xs font-medium border flex items-center gap-1 transition-colors ${
                        isPublished
                          ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                          : 'border-emerald-600/50 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50'
                      }`}
                      title={isPublished ? 'Unpublish exam' : 'Publish exam'}
                    >
                      {isPublished ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{isPublished ? 'Unpublish' : 'Publish'}</span>
                    </button>

                    {/* Toggle Result Release */}
                    <button
                      onClick={() => handleToggleResultRelease(exam)}
                      className="px-2.5 py-1.5 rounded-md text-xs font-medium border border-zinc-700 text-zinc-300 hover:bg-zinc-800 flex items-center gap-1 transition-colors"
                      title={isImmediate ? 'Change to manual release' : 'Change to instant release'}
                    >
                      {isImmediate ? <Lock className="w-3.5 h-3.5 text-zinc-400" /> : <Unlock className="w-3.5 h-3.5 text-amber-400" />}
                      <span>{isImmediate ? 'Make Manual' : 'Release Instantly'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* View Attempts */}
                    <NavLink
                      to={`/teacher/exams/${exam._id}/attempts`}
                      className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
                      title="View Student Submissions"
                    >
                      <Users className="w-4 h-4" />
                    </NavLink>

                    {/* Edit */}
                    <NavLink
                      to={`/teacher/exams/${exam._id}/edit`}
                      className="p-1.5 text-zinc-400 hover:text-purple-300 hover:bg-zinc-800 rounded-md transition-colors"
                      title="Edit Exam & Questions"
                    >
                      <Edit className="w-4 h-4" />
                    </NavLink>

                    {/* Delete */}
                    <button
                      onClick={() => setExamToDelete(exam)}
                      className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-md transition-colors"
                      title="Delete Exam"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!examToDelete}
        onClose={() => setExamToDelete(null)}
        title="Confirm Exam Deletion"
      >
        <div>
          <p className="text-zinc-300 leading-relaxed">
            Are you sure you want to permanently delete{' '}
            <strong className="text-white font-semibold">"{examToDelete?.title}"</strong>?
          </p>
          <p className="text-xs text-rose-400 mt-2">
            This will also delete all candidate attempt records and answer evaluations associated with this exam. This action cannot be undone.
          </p>
          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              onClick={() => setExamToDelete(null)}
              disabled={isDeleting}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-zinc-300 hover:bg-zinc-800 border border-[#27272A] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 shadow-sm transition-colors"
            >
              {isDeleting ? 'Deleting...' : 'Delete Exam & Records'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
