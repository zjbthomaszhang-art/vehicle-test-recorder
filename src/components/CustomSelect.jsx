import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = "",
  className = "",
  align = "auto",  // "left" | "right" | "auto"
  textColor = ""
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, bottom: 'auto', left: 0, minWidth: 160, maxHeight: 260 });
  const containerRef = useRef(null);

  // Estimate dropdown width from longest label text
  const estimateWidth = useCallback(() => {
    const allLabels = [
      placeholder || '',
      ...options.map(o => typeof o === 'string' ? o : (o.label || ''))
    ];
    const maxLen = Math.max(...allLabels.map(l => [...l].length)); // CJK-safe
    // ~14px per char + 48px padding (covers checkmark and side padding)
    return Math.min(Math.max(maxLen * 14 + 48, 80), 320);
  }, [options, placeholder]);

  const computePos = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const minW = estimateWidth(); // Strictly follow text width, ignore trigger width

    // Auto-detect horizontal position
    const triggerCenterX = (rect.left + rect.right) / 2;
    let left = triggerCenterX > vw / 2
      ? rect.right - minW
      : rect.left;

    // Clamp horizontally to screen
    left = Math.max(8, Math.min(left, vw - minW - 8));

    // Vertical positioning
    let top = rect.bottom + 8;
    let bottom = 'auto';
    let maxH = 260; // Default max height

    // Check bottom overflow
    if (top + maxH > vh - 16) {
      const spaceAbove = rect.top - 16;
      const spaceBelow = vh - rect.bottom - 16;

      if (spaceAbove > spaceBelow) {
        // Place above trigger
        top = 'auto';
        bottom = vh - rect.top + 8;
        maxH = Math.min(260, spaceAbove - 8);
      } else {
        // Place below but shrink max height
        maxH = Math.min(260, spaceBelow - 8);
      }
    }

    setPos({ top, bottom, left, minWidth: minW, maxHeight: maxH });
  }, [estimateWidth]);

  useEffect(() => {
    if (isOpen) computePos();
  }, [isOpen, computePos]);

  // Close on outside click / scroll / resize
  useEffect(() => {
    if (!isOpen) return;
    const close = () => setIsOpen(false);
    const handleOutside = (e) => {
      // Check if click is inside trigger
      if (containerRef.current && containerRef.current.contains(e.target)) return;
      // Check if click is inside portal
      if (e.target.closest('.portal-dropdown')) return;
      close();
    };
    
    // Add event listener to capture phase so we get it before React stops propagation
    document.addEventListener('mousedown', handleOutside, true);
    document.addEventListener('touchstart', handleOutside, true);
    
    const handleScroll = (e) => {
      if (!e.target.closest('.portal-dropdown')) {
        close();
      }
    };
    
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', close);
    
    return () => {
      document.removeEventListener('mousedown', handleOutside, true);
      document.removeEventListener('touchstart', handleOutside, true);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', close);
    };
  }, [isOpen]);

  const selectedOpt = options.find(o => (typeof o === 'string' ? o : o.value) === value) || null;
  const displayLabel = selectedOpt
    ? (typeof selectedOpt === 'string' ? selectedOpt : selectedOpt.label)
    : null;

  const isLeft = align === 'left';
  const isBetween = align === 'between';

  return (
    <>
      <div className={`relative ${className}`} ref={containerRef}>
        <div
          className={`flex items-center w-full cursor-pointer h-full gap-1 ${isLeft ? 'justify-start' : isBetween ? 'justify-between' : 'justify-end'}`}
          onClick={() => setIsOpen(o => !o)}
        >
          <span className={[
            (isLeft || isBetween) ? 'text-left' : 'text-right',
            "block truncate transition-colors",
            (!displayLabel || value === '') ? "text-slate-400 dark:text-slate-600 font-normal text-[12px]" : "font-semibold",
            (displayLabel && value !== '') ? (textColor ? textColor : "text-slate-900 dark:text-white text-[16px]") : ""
          ].filter(Boolean).join(" ")}>
            {displayLabel || placeholder}
          </span>
          <ChevronDown
            size={14}
            className={`text-slate-500 dark:text-[#94a3b8] shrink-0 pointer-events-none transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-400' : ''}`}
          />
        </div>

        {isOpen && createPortal(
          <div
            style={{
              position: 'fixed',
              top: pos.top,
              bottom: pos.bottom,
              left: pos.left,
              minWidth: pos.minWidth,
              zIndex: 99999,
            }}
            className="portal-dropdown bg-slate-100 dark:bg-[#1c1c1e] border border-slate-300 dark:border-[#2c2c2e] rounded-2xl shadow-2xl overflow-hidden"
          >
            <div 
              style={{ maxHeight: pos.maxHeight }} 
              className="overflow-y-auto py-2 custom-scrollbar"
            >
              {options.map((opt) => {
                const optValue = typeof opt === 'string' ? opt : opt.value;
                const optLabel = typeof opt === 'string' ? opt : opt.label;
                const isRealOption = optValue != null && optValue !== '';
                const isSelected = value === optValue && isRealOption;
                
                return (
                  <div
                    key={optValue ?? '__empty__'}
                    className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-colors whitespace-nowrap ${isSelected ? 'bg-blue-600/10' : 'hover:bg-slate-200 dark:hover:bg-[#3c3c3e]'}`}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange(optValue); setIsOpen(false); }}
                  >
                    <span className={`text-[16px] ${isSelected ? 'text-blue-500 font-bold' : (!isRealOption ? 'text-slate-400 dark:text-[#94a3b8] font-normal italic' : 'text-slate-700 dark:text-slate-200 font-medium')}`}>
                      {optLabel || placeholder}
                    </span>
                    {isSelected && (
                      <Check size={16} className="text-blue-500 shrink-0 ml-3" strokeWidth={3} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>,
          document.body
        )}
      </div>
    </>
  );
}
