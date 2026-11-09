import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useAuth();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map((t) => {
        const isSuccess = t.type === 'success';
        const isError = t.type === 'error';
        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border text-sm shadow-xl backdrop-blur-md transition-all duration-200 ${
              isSuccess
                ? 'bg-[#18181B]/95 border-emerald-500/30 text-emerald-300'
                : isError
                ? 'bg-[#18181B]/95 border-rose-500/30 text-rose-300'
                : 'bg-[#18181B]/95 border-[#27272A] text-zinc-200'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {isError && <AlertCircle className="w-4 h-4 text-rose-400" />}
              {!isSuccess && !isError && <Info className="w-4 h-4 text-indigo-400" />}
            </div>
            <div className="flex-1 text-xs leading-relaxed font-medium">{t.message}</div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-zinc-500 hover:text-zinc-300 transition-colors shrink-0"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
