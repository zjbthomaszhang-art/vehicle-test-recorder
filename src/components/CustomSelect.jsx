import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "",
  className = "",
  align = "right",
  textColor = ""
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  // Resolve the display label for the current value
  const selectedOpt = value
    ? options.find(o => (typeof o === 'string' ? o : o.value) === value)
    : null;
  const displayLabel = selectedOpt
    ? (typeof selectedOpt === 'string' ? selectedOpt : selectedOpt.label)
    : null;

  const isLeft = align === 'left';

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger */}
      <div
        className={`flex items-center w-full cursor-pointer h-full gap-1 ${isLeft ? 'justify-start' : 'justify-end'}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={[
          'block flex-1 min-w-0 truncate text-[12px]',
          isLeft ? 'text-left' : 'text-right',
          displayLabel
            ? (textColor || 'text-slate-900 dark:text-white font-semibold')
            : 'text-slate-500 dark:text-[#94a3b8] font-normal',
        ].join(' ')}>
          {displayLabel || placeholder}
        </span>
        <ChevronDown
          size={14}
          className={`text-slate-500 dark:text-[#94a3b8] shrink-0 pointer-events-none transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-400' : ''}`}
        />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={`absolute top-[calc(100%+8px)] ${isLeft ? 'left-0 origin-top-left' : 'right-0 origin-top-right'} w-[200px] sm:w-[240px] z-[100] bg-slate-100 dark:bg-[#1c1c1e]/95 backdrop-blur-xl border border-slate-300 dark:border-[#2c2c2e] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200`}>
          <div className="max-h-[260px] overflow-y-auto custom-scrollbar py-2">
            {options.map((opt) => {
              const optValue = typeof opt === 'string' ? opt : opt.value;
              const optLabel = typeof opt === 'string' ? opt : opt.label;
              const isSelected = value === optValue;
              return (
                <div
                  key={optValue ?? '__empty__'}
                  className={`px-4 py-3 sm:py-3.5 flex items-center justify-between cursor-pointer transition-colors ${isSelected ? 'bg-blue-600/10' : 'hover:bg-slate-200 dark:hover:bg-[#3c3c3e]'}`}
                  onClick={() => { onChange(optValue); setIsOpen(false); }}
                >
                  <span className={`text-[15px] sm:text-base ${isSelected ? 'text-blue-500 font-bold' : 'text-slate-700 dark:text-slate-200 font-medium'}`}>
                    {optLabel || placeholder}
                  </span>
                  {isSelected && optValue && <Check size={16} className="text-blue-500 shrink-0" strokeWidth={3} />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
