import React from 'react';
import { Gauge, FolderOpen, Play, History, Bug } from 'lucide-react';

export default function MobileNavigator({ currentView, setView, onTestPress }) {
  const tabsLeft = [
    { id: 'dashboard', label: '仪表\n面板', icon: Gauge },
    { id: 'admin', label: '案例\n管理', icon: FolderOpen },
  ];
  
  const tabsRight = [
    { id: 'history', label: '历史\n记录', icon: History },
    { id: 'pdca', label: '缺陷\n管理', icon: Bug },
  ];

  return (
    <div className={`${['dashboard', 'pdca'].includes(currentView) ? 'md:hidden' : ''} fixed bottom-0 left-0 right-0 h-[88px] bg-slate-50 dark:bg-[#0f1523]/70 backdrop-blur-2xl border-t border-slate-200 dark:border-[#1e293b] flex justify-between items-end px-[10px] pb-[20px] pt-[6px] z-50`}>
      
      {tabsLeft.map(tab => {
        const Icon = tab.icon;
        const isActive = currentView === tab.id;
        return (
          <button key={tab.id} onClick={() => setView(tab.id)} className="flex flex-col items-center justify-end w-[72px] gap-[2px] transition-all group">
            <Icon size={28} className={isActive ? 'text-[#007AFF]' : 'text-slate-500 group-hover:text-slate-500 dark:text-slate-400'} strokeWidth={isActive ? 2.5 : 2} />
            <span className={`text-[9px] font-[600] leading-[1.3] whitespace-pre-line text-center ${isActive ? 'text-[#007AFF]' : 'text-slate-500'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}

      {/* Center Floating Button */}
      <div className="flex flex-col items-center justify-end w-[72px] gap-[6px]">
        <button 
          onClick={onTestPress}
          className={`w-[60px] h-[60px] rounded-[30px] flex items-center justify-center shadow-2xl transition-all active:scale-95 ${
            currentView === 'home' || currentView === 'test' 
              ? 'bg-[#007AFF] shadow-[#007AFF]/40' 
              : 'bg-white dark:bg-[#111827] shadow-sm dark:shadow-none border border-slate-200/60 dark:border-transparent border border-slate-200 dark:border-[#1e293b] text-[#007AFF] shadow-black/50 hover:bg-slate-100 dark:hover:bg-[#1e293b]'
          }`}
        >
          <Play size={32} className={currentView === 'home' || currentView === 'test' ? 'text-slate-900 dark:text-white translate-x-0.5' : 'text-[#007AFF] translate-x-0.5'} fill="currentColor" />
        </button>
        <span className={`text-[9px] font-[700] leading-[1.3] whitespace-pre-line text-center ${currentView === 'home' || currentView === 'test' ? 'text-[#007AFF]' : 'text-slate-500'}`}>
          {'执行\n测试'}
        </span>
      </div>

      {tabsRight.map(tab => {
        const Icon = tab.icon;
        const isActive = currentView === tab.id;
        return (
          <button key={tab.id} onClick={() => setView(tab.id)} className="flex flex-col items-center justify-end w-[72px] gap-[2px] transition-all group">
            <Icon size={28} className={isActive ? 'text-[#007AFF]' : 'text-slate-500 group-hover:text-slate-500 dark:text-slate-400'} strokeWidth={isActive ? 2.5 : 2} />
            <span className={`text-[9px] font-[600] leading-[1.3] whitespace-pre-line text-center ${isActive ? 'text-[#007AFF]' : 'text-slate-500'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}

    </div>
  );
}
