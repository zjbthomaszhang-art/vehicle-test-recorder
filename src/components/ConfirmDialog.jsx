import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Global confirm dialog overlay.
 * @param {{ dialog: { title: string, message: string, onConfirm: () => void } | null, onClose: () => void }} props
 */
export default function ConfirmDialog({ dialog, onClose }) {
  if (!dialog) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-slate-900 border border-white/10 w-full max-w-sm rounded-[2.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={32} />
          </div>
          <h3 className="text-xl font-black text-white italic tracking-tighter uppercase mb-2">{dialog.title}</h3>
          <p className="text-xs text-slate-400 leading-relaxed mb-8">{dialog.message}</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onClose}
              className="py-4 bg-slate-800 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-700 transition-colors"
            >
              取消
            </button>
            <button
              onClick={dialog.onConfirm}
              className="py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20"
            >
              确认
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
