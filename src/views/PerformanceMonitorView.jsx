import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, Activity, Server, HardDrive, Terminal } from 'lucide-react';

export default function PerformanceMonitorView({ setView }) {
  // Real Data Engine State
  const [cpuData, setCpuData] = useState(Array(60).fill(0));
  const [ramData, setRamData] = useState(Array(60).fill(0));
  const [diskData, setDiskData] = useState({ total: 100, used: 0 });
  const [ramTotal, setRamTotal] = useState(8);
  const [systemInfo, setSystemInfo] = useState({ uptime: 0, loadavg: [0,0,0], type: '', release: '', arch: '' });
  
  // Polling Loop
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/metrics`);
        if (!response.ok) return;
        const data = await response.json();
        
        setCpuData(prev => {
          const next = [...prev.slice(1)];
          next.push(data.cpu || 0);
          return next;
        });

        setRamData(prev => {
          const next = [...prev.slice(1)];
          next.push(data.ram?.used || 0);
          return next;
        });

        if (data.ram?.total) setRamTotal(data.ram.total);
        if (data.disk) setDiskData(data.disk);
        if (data.system) setSystemInfo(data.system);
      } catch (err) {
        console.error("Failed to fetch metrics", err);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 1000);
    return () => clearInterval(interval);
  }, []);

  const currentCpu = cpuData[cpuData.length - 1];
  const currentRam = ramData[ramData.length - 1];

  // SVG Path Generator (Smooth Bezier Curve)
  const generateSmoothPath = useCallback((data, maxVal, width, height) => {
    if (data.length === 0) return '';
    const xStep = width / (data.length - 1);
    
    // Convert data to points
    const points = data.map((val, i) => {
      const x = i * xStep;
      const y = height - ((val / maxVal) * height);
      return { x, y };
    });

    // Create Catmull-Rom to Cubic Bezier path
    let d = `M ${points[0].x},${points[0].y}`;
    
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i !== points.length - 2 ? points[i + 2] : p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    return d;
  }, []);

  const cpuPath = useMemo(() => generateSmoothPath(cpuData, 100, 800, 160), [cpuData, generateSmoothPath]);
  const ramPath = useMemo(() => generateSmoothPath(ramData, ramTotal, 800, 160), [ramData, ramTotal, generateSmoothPath]);

  return (
    <div className="h-screen bg-[#0f1523] text-slate-200 flex flex-col font-sans overflow-hidden antialiased">
      <div className="flex-1 w-full flex flex-col px-[40px] pt-[32px] pb-[24px] gap-[24px]">
        
        {/* Header */}
        <header className="flex justify-between items-center w-full shrink-0">
          <div className="flex items-center gap-4">
            <Activity size={32} className="text-[#3b82f6]" />
            <div className="flex flex-col">
              <h1 className="text-2xl font-[900] italic tracking-tighter text-slate-100">系统性能监控</h1>
              <span className="text-[10px] font-[800] text-[#64748b] uppercase tracking-widest">Performance Monitor</span>
            </div>
          </div>
          <button 
            onClick={() => setView('home')}
            className="flex items-center gap-2 border border-[#1e293b] rounded-[8px] px-[16px] py-[10px] text-[12px] font-[800] text-[#64748b] hover:text-white transition-all bg-[#0f1523]"
          >
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 返回主页
          </button>
        </header>

        {/* Top KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[24px] shrink-0">
          {/* CPU KPI */}
          <div className="bg-[#111827]/80 backdrop-blur-xl border border-[#1e293b] rounded-[1rem] p-[20px] shadow-2xl flex flex-col justify-between h-[110px]">
            <span className="text-[11px] font-[800] text-[#64748b] uppercase tracking-widest flex items-center gap-2">
              <Server size={14} /> CPU 使用率
            </span>
            <div className="text-slate-200 flex items-baseline">
              <span className="text-4xl font-black italic tracking-tighter bg-gradient-to-r from-[#38bdf8] to-[#818cf8] bg-clip-text text-transparent leading-none pb-1 pr-1">{currentCpu.toFixed(1)}</span>
              <span className="text-lg font-bold text-[#60a5fa] ml-1 leading-none">%</span>
            </div>
          </div>

          {/* RAM KPI */}
          <div className="bg-[#111827]/80 backdrop-blur-xl border border-[#1e293b] rounded-[1rem] p-[20px] shadow-2xl flex flex-col justify-between h-[110px]">
            <span className="text-[11px] font-[800] text-[#64748b] uppercase tracking-widest flex items-center gap-2">
              <Activity size={14} /> 内存 (RAM) 使用
            </span>
            <div className="text-slate-200 flex items-baseline leading-none">
              <span className="text-4xl font-black italic tracking-tighter text-[#a855f7] leading-none">{currentRam.toFixed(1)}</span>
              <span className="text-lg font-bold text-[#c084fc] ml-1 leading-none">GB <span className="text-xs text-[#64748b]">/ {ramTotal.toFixed(1)}GB</span></span>
            </div>
          </div>

          {/* DISK KPI */}
          <div className="bg-[#111827]/80 backdrop-blur-xl border border-[#1e293b] rounded-[1rem] p-[20px] shadow-2xl flex flex-col justify-between h-[110px]">
            <span className="text-[11px] font-[800] text-[#64748b] uppercase tracking-widest flex items-center gap-2">
              <HardDrive size={14} /> 存储空间 (SSD)
            </span>
            <div className="text-slate-200 flex items-baseline leading-none">
              <span className="text-4xl font-black italic tracking-tighter text-[#f97316] leading-none">{diskData.used.toFixed(1)}</span>
              <span className="text-lg font-bold text-[#fb923c] ml-1 leading-none">GB <span className="text-xs text-[#64748b]">/ {diskData.total.toFixed(0)}GB</span></span>
            </div>
          </div>
        </div>

        {/* Main Body */}
        <div className="flex flex-1 min-h-0 flex-col lg:flex-row gap-[24px]">
          {/* Left Area - Charts */}
          <div className="flex-1 flex flex-col gap-[24px] min-w-0 h-full">
            
            {/* CPU Chart */}
            <div className="flex-1 bg-[#111827]/80 backdrop-blur-xl border border-[#1e293b] rounded-[1rem] p-[24px] shadow-2xl flex flex-col relative min-h-0">
              <h2 className="text-sm font-black italic text-slate-300 mb-4 shrink-0">实时 CPU 负载趋势</h2>
              
              <div className="flex-1 relative flex min-h-0">
                {/* Y Axis */}
                <div className="flex flex-col justify-between text-[10px] text-[#64748b] font-mono pr-4 min-w-[40px] font-bold py-2">
                  <span>100%</span>
                  <span>0%</span>
                </div>
                
                {/* Chart Area */}
                <div className="flex-1 relative">
                  <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 800 160">
                    <path
                      d={`${cpuPath} L 800 160 L 0 160 Z`}
                      fill="rgba(59, 130, 246, 0.15)"
                    />
                    <path
                      d={cpuPath}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>

              {/* X Axis */}
              <div className="flex justify-between pl-[40px] text-[10px] text-[#64748b] font-mono mt-2 shrink-0 font-bold">
                <span>-60s</span>
                <span>0s</span>
              </div>
            </div>

            {/* RAM Chart */}
            <div className="flex-1 bg-[#111827]/80 backdrop-blur-xl border border-[#1e293b] rounded-[1rem] p-[24px] shadow-2xl flex flex-col relative min-h-0">
              <h2 className="text-sm font-black italic text-slate-300 mb-4 shrink-0">实时内存 (RAM) 负载趋势</h2>
              
              <div className="flex-1 relative flex min-h-0">
                {/* Y Axis */}
                <div className="flex flex-col justify-between text-[10px] text-[#64748b] font-mono pr-4 min-w-[40px] font-bold py-2">
                  <span>{ramTotal.toFixed(1)}GB</span>
                  <span>0GB</span>
                </div>
                
                {/* Chart Area */}
                <div className="flex-1 relative">
                  <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 800 160">
                    <path
                      d={`${ramPath} L 800 160 L 0 160 Z`}
                      fill="rgba(168, 85, 247, 0.15)"
                    />
                    <path
                      d={ramPath}
                      fill="none"
                      stroke="#a855f7"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>

              {/* X Axis */}
              <div className="flex justify-between pl-[40px] text-[10px] text-[#64748b] font-mono mt-2 shrink-0 font-bold">
                <span>-60s</span>
                <span>0s</span>
              </div>
            </div>

          </div>

          {/* Right Area - Sidebar */}
          <div className="w-[450px] flex flex-col gap-[24px] shrink-0 h-full">
            {/* System Runtime Status */}
            <div className="flex-1 bg-[#111827]/80 backdrop-blur-xl border border-[#1e293b] rounded-[1rem] p-[24px] shadow-2xl flex flex-col min-h-0">
              <h2 className="text-sm font-black italic text-slate-300 mb-6 shrink-0">系统运行状态</h2>
              <div className="flex-1 flex flex-col justify-around">
                <div>
                  <div className="flex justify-between items-center text-sm font-bold text-[#64748b] mb-1">
                    <span>平均负载 (1m, 5m, 15m)</span>
                  </div>
                  <div className="text-[#cbd5e1] font-mono text-lg">
                    {systemInfo.loadavg.map(v => v.toFixed(2)).join(' / ')}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-sm font-bold text-[#64748b] mb-1">
                    <span>已运行时间 (Uptime)</span>
                  </div>
                  <div className="text-[#cbd5e1] font-mono text-lg">
                    {Math.floor(systemInfo.uptime / 86400)}天 {Math.floor((systemInfo.uptime % 86400) / 3600)}小时 {Math.floor((systemInfo.uptime % 3600) / 60)}分钟
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-sm font-bold text-[#64748b] mb-1">
                    <span>系统内核</span>
                  </div>
                  <div className="text-[#cbd5e1] font-mono text-[13px] truncate">
                    {systemInfo.type} {systemInfo.release} ({systemInfo.arch})
                  </div>
                </div>
              </div>
            </div>

            {/* Log Stream */}
            <div className="flex-1 bg-[#111827]/80 backdrop-blur-xl border border-[#1e293b] rounded-[1rem] p-[24px] shadow-2xl flex flex-col min-h-0">
              <h2 className="text-sm font-black italic text-slate-300 mb-4 flex items-center gap-2 shrink-0">
                <Terminal size={16} /> 系统日志流 (Tail)
              </h2>
              <div className="flex-1 font-mono text-[11px] font-bold text-[#34d399] bg-[#0f1523] p-[16px] rounded-[8px] border border-[#1e293b]/50 overflow-hidden relative break-words leading-[1.6]">
                <p className="mb-2">[2026-04-14 16:55:02] INFO: Session synced successfully</p>
                <p className="text-[#94a3b8] mb-2">[2026-04-14 16:55:00] INFO: API Request fast-sessions [200 OK]</p>
                <p className="text-[#fb923c] mb-2">[2026-04-14 16:54:49] WARN: Memory usage peak detected &gt; 50%</p>
                
                {/* Fake pulsing log */}
                {Math.random() > 0.5 && (
                  <p className="animate-pulse">[2026-04-14 16:55:xx] DEBUG: WS frame heartbeat req sent...</p>
                )}
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0f1523] to-transparent pointer-events-none"></div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
