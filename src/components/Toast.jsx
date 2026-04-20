import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

/**
 * Transient toast notification (auto-hides via parent timer).
 * @param {{ toast: { message: string, type: 'success' | 'error' } | null }} props
 */
export default function Toast({ toast }) {
  if (!toast) return null;

  return (
    <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[200] animate-in fade-in slide-in-from-top-4 duration-500">
      <div className={`px-6 py-3 rounded-full border shadow-2xl flex items-center gap-3 backdrop-blur-xl ${
        toast.type === 'success'
          ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
          : 'bg-red-500/20 border-red-500/30 text-red-500'
      }`}>
        {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
        <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">{toast.message}</span>
      </div>
    </div>
  );
}
