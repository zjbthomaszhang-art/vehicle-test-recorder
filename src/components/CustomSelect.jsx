import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "",
  className = ""
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Click outside to close
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

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* 触发区域 (Trigger) */}
      <div 
        className="flex items-center justify-end w-full cursor-pointer h-full gap-1"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={`block flex-1 min-w-0 truncate text-right text-[13px] sm:text-[14px] ${value ? 'text-slate-200 font-semibold' : 'text-slate-600 font-normal'}`}>
          {value || placeholder}
        </span>
        <ChevronDown size={14} className={`text-[#64748b] shrink-0 pointer-events-none transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-400' : ''}`} />
      </div>

      {/* 弹窗菜单 (Dropdown Menu) */}
      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] right-0 w-[200px] sm:w-[240px] z-[100] bg-[#1c1c1e]/95 backdrop-blur-xl border border-[#2c2c2e] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
          <div className="max-h-[260px] overflow-y-auto custom-scrollbar py-2">
            {options.map((opt) => {
              const optValue = typeof opt === 'string' ? opt : opt.value;
              const optLabel = typeof opt === 'string' ? opt : opt.label;
              const isSelected = value === optValue;
              
              return (
                <div
                  key={optValue}
                  className={`px-4 py-3 sm:py-3.5 flex items-center justify-between cursor-pointer transition-colors active:bg-[#2c2c2e] ${isSelected ? 'bg-blue-600/10' : 'hover:bg-[#2c2c2e]/50'}`}
                  onClick={() => {
                    onChange(optValue);
                    setIsOpen(false);
                  }}
                >
                  <span className={`text-[15px] sm:text-base ${isSelected ? 'text-blue-500 font-bold' : 'text-slate-200 font-medium'}`}>
                    {optLabel}
                  </span>
                  {isSelected && <Check size={16} className="text-blue-500 shrink-0" strokeWidth={3} />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
