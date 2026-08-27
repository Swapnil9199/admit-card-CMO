import React from 'react';
import { CheckCircle2, AlertCircle, X, Mail } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const isSuccess = toast.type === 'success';

  return (
    <div className="fixed top-5 right-5 z-50 max-w-md animate-fadeIn transition-all">
      <div
        className={`p-4 rounded-2xl border shadow-2xl flex items-start gap-3 backdrop-blur-xl ${
          isSuccess
            ? 'bg-slate-900/95 border-emerald-500/50 text-emerald-300 shadow-emerald-950/40'
            : 'bg-slate-900/95 border-amber-500/50 text-amber-300 shadow-amber-950/40'
        }`}
      >
        <div className={`p-2 rounded-xl shrink-0 ${isSuccess ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
          {isSuccess ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
        </div>

        <div className="flex-1 pr-2">
          <div className="flex items-center gap-1.5 font-bold text-sm text-white">
            <Mail className="w-3.5 h-3.5" />
            {isSuccess ? 'Email Dispatch Successful' : 'Email Dispatch Notice'}
          </div>
          <p className="text-xs mt-1 text-slate-200 leading-relaxed font-medium">
            {toast.message}
          </p>
          {toast.recipient && (
            <p className="text-[11px] font-mono text-slate-400 mt-1 truncate">
              To: {toast.recipient}
            </p>
          )}
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
