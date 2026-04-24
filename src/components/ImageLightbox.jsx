import React, { useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react';

/**
 * ImageLightbox — 全屏图片查看器
 *
 * Props:
 *   images   {string[]}  图片 URL 数组
 *   index    {number}    当前显示的索引
 *   onClose  {()=>void}  关闭回调
 *   onChange {(i)=>void} 切换图片回调（可选）
 *
 * Usage:
 *   const [lightbox, setLightbox] = useState(null); // null | { images, index }
 *   <img onClick={() => setLightbox({ images: [...], index: 0 })} />
 *   {lightbox && <ImageLightbox images={lightbox.images} index={lightbox.index}
 *     onClose={() => setLightbox(null)}
 *     onChange={(i) => setLightbox(prev => ({ ...prev, index: i }))} />}
 */
export default function ImageLightbox({ images, index, onClose, onChange }) {
  const total = images.length;
  const hasPrev = index > 0;
  const hasNext = index < total - 1;

  const goPrev = useCallback(() => {
    if (hasPrev && onChange) onChange(index - 1);
  }, [hasPrev, index, onChange]);

  const goNext = useCallback(() => {
    if (hasNext && onChange) onChange(index + 1);
  }, [hasNext, index, onChange]);

  // 键盘导航
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, goPrev, goNext]);

  // 锁定滚动
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const currentUrl = images[index];

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = currentUrl;
    a.download = currentUrl.split('/').pop() || 'image.jpg';
    a.target = '_blank';
    a.click();
  };

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      {/* Toolbar */}
      <div
        className="absolute top-0 left-0 right-0 flex justify-between items-center px-4 pt-4 pb-3 z-10"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Counter */}
        <span className="text-white/70 text-[12px] font-[700] font-mono">
          {index + 1} / {total}
        </span>

        <div className="flex items-center gap-2">
          {/* Download */}
          <button
            onClick={handleDownload}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            title="下载原图"
          >
            <Download size={16} className="text-white" />
          </button>
          {/* Close */}
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            title="关闭"
          >
            <X size={18} className="text-white" />
          </button>
        </div>
      </div>

      {/* Prev Button */}
      {hasPrev && (
        <button
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors"
        >
          <ChevronLeft size={24} className="text-white" />
        </button>
      )}

      {/* Image */}
      <img
        key={currentUrl}
        src={currentUrl}
        alt={`图片 ${index + 1}`}
        onClick={e => e.stopPropagation()}
        className="max-w-[92vw] max-h-[88vh] object-contain rounded-lg shadow-2xl select-none"
        style={{ animation: 'lbFadeIn 0.18s ease' }}
        draggable={false}
      />

      {/* Next Button */}
      {hasNext && (
        <button
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors"
        >
          <ChevronRight size={24} className="text-white" />
        </button>
      )}

      {/* Dot Indicators */}
      {total > 1 && (
        <div
          className="absolute bottom-5 left-0 right-0 flex justify-center gap-[6px]"
          onClick={e => e.stopPropagation()}
        >
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => onChange && onChange(i)}
              className={`rounded-full transition-all ${
                i === index
                  ? 'w-4 h-2 bg-white'
                  : 'w-2 h-2 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes lbFadeIn {
          from { opacity: 0; transform: scale(0.96); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
