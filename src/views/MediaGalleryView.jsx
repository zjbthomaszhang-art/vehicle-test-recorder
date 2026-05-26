import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, Search, Upload, Filter, ArrowUpDown, LayoutGrid, List, X, PlayCircle, Image as ImageIcon, Video, ExternalLink } from 'lucide-react';
import dayjs from 'dayjs';

export default function MediaGalleryView({ setView, setHistoryTargetId }) {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // all, env, test_result, bug
  const [searchQuery, setSearchQuery] = useState('');
  
  const [testerFilter, setTesterFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('time_desc');
  const [viewMode, setViewMode] = useState('grid');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = viewMode === 'grid' ? 8 : 10;
  
  // Selection & Lightbox
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, testerFilter, sortOrder, viewMode]);

  useEffect(() => {
    const fetchMedia = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/media');
        const data = await res.json();
        if (data.success) {
          setMedia(data.media);
        } else {
          setError(data.message || 'Failed to load media');
        }
      } catch (err) {
        console.error(err);
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };
    fetchMedia();
  }, []);

  const uniqueTesters = useMemo(() => {
    const testers = new Set(media.map(m => m.tester).filter(t => t && t !== 'Unknown'));
    return Array.from(testers);
  }, [media]);

  const filteredMedia = useMemo(() => {
    let result = media.filter(m => {
      // Source filter
      if (activeTab !== 'all' && m.source !== activeTab) return false;
      // Search filter
      if (searchQuery && !m.title?.toLowerCase().includes(searchQuery.toLowerCase()) && !m.tester?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      // Tester filter
      if (testerFilter && m.tester !== testerFilter) return false;
      return true;
    });
    
    result.sort((a, b) => {
      if (sortOrder === 'time_desc') return new Date(b.timestamp) - new Date(a.timestamp);
      if (sortOrder === 'time_asc') return new Date(a.timestamp) - new Date(b.timestamp);
      if (sortOrder === 'size_desc') return (b.size || 0) - (a.size || 0);
      if (sortOrder === 'size_asc') return (a.size || 0) - (b.size || 0);
      return 0;
    });
    
    return result;
  }, [media, activeTab, searchQuery, testerFilter, sortOrder]);

  const handleNavigateToRecord = (m) => {
    if (m?.session_id) {
      if (setHistoryTargetId) setHistoryTargetId(m.session_id);
      setView('history');
    }
  };

  const getSourceConfig = (source) => {
    switch(source) {
      case 'bug': return { label: '缺陷附件', color: 'bg-red-500', text: 'text-red-500', bg: 'bg-red-500/10' };
      case 'test_result': return { label: '测试记录', color: 'bg-teal-500', text: 'text-teal-500', bg: 'bg-teal-500/10' };
      case 'env': return { label: '车况与环境', color: 'bg-yellow-500', text: 'text-yellow-500', bg: 'bg-yellow-500/10' };
      default: return { label: 'Media', color: 'bg-slate-500', text: 'text-slate-500', bg: 'bg-slate-500/10' };
    }
  };

  const totalPages = Math.ceil(filteredMedia.length / itemsPerPage);
  const currentMedia = filteredMedia.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="h-screen bg-[#131825] text-slate-200 p-6 flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="flex justify-between items-center w-full shrink-0 mb-6">
        <div className="flex items-center gap-4">
          <ImageIcon size={32} className="text-teal-500" />
          <div className="flex flex-col">
            <h1 className="text-2xl font-[900] italic tracking-tighter text-slate-900 dark:text-white">媒体资源库</h1>
            <span className="text-[10px] font-[800] text-slate-500 uppercase tracking-widest">Media Hub</span>
          </div>
        </div>
        <button 
          onClick={() => setView('monitor')}
          className="flex items-center gap-2 border border-slate-700/50 rounded-[8px] px-[16px] py-[10px] text-[12px] font-[800] text-slate-400 hover:text-white transition-all bg-[#1e2536]"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 返回监控
        </button>
      </header>

      {/* Tabs */}
      <div className="flex items-center gap-8 border-b border-slate-700/50 pb-3 mb-6 shrink-0">
        <button 
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-2 text-sm font-bold uppercase transition-colors ${activeTab === 'all' ? 'text-white border-b-2 border-white pb-3 -mb-[14px]' : 'text-slate-400 hover:text-slate-200'}`}
        >
          ALL ASSETS 
          <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded-full">{media.length}</span>
        </button>
        <button 
          onClick={() => setActiveTab('env')}
          className={`flex items-center gap-2 text-sm font-bold transition-colors ${activeTab === 'env' ? 'text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
        >
          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
          车况与环境
        </button>
        <button 
          onClick={() => setActiveTab('test_result')}
          className={`flex items-center gap-2 text-sm font-bold transition-colors ${activeTab === 'test_result' ? 'text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
        >
          <div className="w-2 h-2 rounded-full bg-teal-500"></div>
          测试记录
        </button>
        <button 
          onClick={() => setActiveTab('bug')}
          className={`flex items-center gap-2 text-sm font-bold transition-colors ${activeTab === 'bug' ? 'text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
        >
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          缺陷附件
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div className="relative w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search media, tags, testers..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1e2536] border border-slate-700/50 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
          />
        </div>
        
        <div className="flex items-center gap-3">
          {/* Tester Filter */}
          <div className="relative flex items-center bg-[#1e2536] border border-slate-700/50 rounded-lg px-3 py-1.5 transition-colors">
            <Filter size={14} className="text-slate-400 mr-2 shrink-0" />
            <select 
              value={testerFilter} 
              onChange={(e) => setTesterFilter(e.target.value)}
              className="bg-transparent text-slate-700 dark:text-slate-300 text-sm focus:outline-none appearance-none cursor-pointer w-28"
            >
              <option value="">全部测试人员</option>
              {uniqueTesters.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          
          {/* Sort Menu */}
          <div className="relative flex items-center bg-[#1e2536] border border-slate-700/50 rounded-lg px-3 py-1.5 transition-colors">
            <ArrowUpDown size={14} className="text-slate-400 mr-2 shrink-0" />
            <select 
              value={sortOrder} 
              onChange={(e) => setSortOrder(e.target.value)}
              className="bg-transparent text-slate-700 dark:text-slate-300 text-sm focus:outline-none appearance-none cursor-pointer w-[130px]"
            >
              <option value="time_desc">时间: 从新到旧</option>
              <option value="time_asc">时间: 从旧到新</option>
              <option value="size_desc">大小: 从大到小</option>
              <option value="size_asc">大小: 从小到大</option>
            </select>
          </div>
          
          {/* View Toggle */}
          <div className="flex items-center bg-[#1e2536] border border-slate-700/50 rounded-lg p-1 ml-2">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-white shadow' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'}`}
            >
              <LayoutGrid size={16} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-white shadow' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'}`}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 min-h-0 gap-6">
        
        {/* Grid Area */}
        <div className="flex-1 flex flex-col min-h-0 pr-2">
          {loading ? (
            <div className="flex justify-center items-center flex-1 text-slate-400 dark:text-slate-500">Loading media...</div>
          ) : filteredMedia.length === 0 ? (
            <div className="flex justify-center items-center flex-1 text-slate-400 dark:text-slate-500">No media found.</div>
          ) : (
            <>
              {viewMode === 'grid' ? (
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 content-start overflow-hidden">
                  {currentMedia.map((m, idx) => {
                    const config = getSourceConfig(m.source);
                    const isSelected = selectedMedia === m;
                    
                    return (
                      <div 
                        key={`${m.url}-${idx}`} 
                        onClick={() => setSelectedMedia(m)}
                        onDoubleClick={() => { setSelectedMedia(m); setLightboxOpen(true); }}
                        className={`group bg-[#1e2536] rounded-xl overflow-hidden border transition-all cursor-pointer flex flex-col
                          ${isSelected ? 'border-teal-500 ring-1 ring-teal-500/50' : 'border-slate-200 hover:border-slate-300 dark:border-slate-700/50 dark:hover:border-slate-600'}
                        `}
                      >
                        {/* Thumbnail */}
                        <div className="relative aspect-video bg-[#0f131d] flex-shrink-0 flex items-center justify-center overflow-hidden p-2">
                          {m.type === 'video' ? (
                            <>
                              <Video size={48} className="text-slate-600" />
                              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                <PlayCircle size={32} className="text-white opacity-80" />
                              </div>
                            </>
                          ) : (
                            <img src={m.url} alt={m.title} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity rounded-lg" loading="lazy" />
                          )}
                        </div>
                        
                        {/* Meta */}
                        <div className="p-3 flex flex-col flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2 truncate">
                              {m.type === 'video' ? <Video size={14} className="text-slate-400 shrink-0" /> : <ImageIcon size={14} className="text-slate-400 shrink-0" />}
                              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate" title={m.vehicle_info || m.name || m.title}>{m.vehicle_info || m.name || m.title || 'media_file'}</span>
                            </div>
                            <button className="text-slate-500 hover:text-slate-300"><span className="tracking-widest">...</span></button>
                          </div>
                          
                          <div className="flex items-center justify-between mt-auto">
                            <span className="text-[10px] text-slate-500 font-mono truncate">{m.tester || '-'}</span>
                            <div className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${config.bg} ${config.text}`}>
                              {config.label}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex-1 overflow-hidden bg-[#1e2536] rounded-xl border border-slate-700/50 flex flex-col">
                  <table className="w-full text-left text-sm text-slate-300 table-fixed">
                    <thead className="bg-[#151a26] text-slate-400 border-b border-slate-700/50 shrink-0">
                      <tr>
                        <th className="px-4 py-3 font-semibold w-5/12">文件名</th>
                        <th className="px-4 py-3 font-semibold w-2/12">分类</th>
                        <th className="px-4 py-3 font-semibold w-2/12">测试人员</th>
                        <th className="px-4 py-3 font-semibold w-1/12">大小</th>
                        <th className="px-4 py-3 font-semibold w-2/12 text-right">上传时间</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50 overflow-y-auto custom-scrollbar flex-1">
                      {currentMedia.map((m, idx) => {
                        const config = getSourceConfig(m.source);
                        const isSelected = selectedMedia === m;
                        return (
                          <tr 
                            key={`${m.url}-${idx}`}
                            onClick={() => setSelectedMedia(m)}
                            onDoubleClick={() => { setSelectedMedia(m); setLightboxOpen(true); }}
                            className={`cursor-pointer transition-colors block md:table-row ${isSelected ? 'bg-teal-50 dark:bg-teal-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                          >
                            <td className="px-4 py-3 flex items-center gap-3">
                              <div className="w-8 h-8 rounded overflow-hidden bg-[#0f131d] flex-shrink-0 flex items-center justify-center">
                                {m.type === 'video' ? <Video size={16} className="text-slate-600"/> : <img src={m.url} className="w-full h-full object-cover" />}
                              </div>
                              <span className="truncate" title={m.vehicle_info || m.name || m.title}>{m.vehicle_info || m.name || m.title || 'media_file'}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${config.bg} ${config.text}`}>
                                {config.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 truncate" title={m.tester}>{m.tester || '-'}</td>
                            <td className="px-4 py-3 font-mono text-xs">{m.size ? (m.size / 1024).toFixed(1) + ' KB' : '-'}</td>
                            <td className="px-4 py-3 text-slate-400 text-right">{dayjs(m.timestamp).format('YYYY-MM-DD HH:mm')}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200 dark:border-slate-700/50 shrink-0 pb-2">
                  <span className="text-xs text-slate-500">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredMedia.length)} of {filteredMedia.length} assets
                  </span>
                  <div className="flex items-center gap-2">
                    <button 
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className="px-3 py-1.5 bg-white dark:bg-[#1e2536] border border-slate-200 dark:border-slate-700/50 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white transition-colors shadow-sm dark:shadow-none"
                    >
                      Prev
                    </button>
                    <span className="text-sm text-slate-400 px-3 font-mono">
                      {currentPage} / {totalPages}
                    </span>
                    <button 
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      className="px-3 py-1.5 bg-white dark:bg-[#1e2536] border border-slate-200 dark:border-slate-700/50 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white transition-colors shadow-sm dark:shadow-none"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Asset Info Panel */}
        {selectedMedia && (
          <div className="w-80 shrink-0 bg-white dark:bg-[#151d2b] border border-teal-500/30 rounded-xl p-5 flex flex-col animate-in fade-in slide-in-from-right-4 relative overflow-hidden shadow-[0_0_20px_rgba(20,184,166,0.15)] dark:shadow-[0_0_20px_rgba(20,184,166,0.1)]">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-teal-300" />
            
            <h3 className="text-teal-400 font-bold text-sm tracking-wider uppercase mb-6 flex justify-between items-center">
              Asset Info
              <button onClick={() => setSelectedMedia(null)} className="text-slate-500 hover:text-slate-300"><X size={16}/></button>
            </h3>
            
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-[80px_1fr] gap-2">
                <span className="text-slate-500">Uploaded:</span>
                <span className="text-slate-800 dark:text-slate-200">{dayjs(selectedMedia.timestamp).format('MMM DD, YYYY')}</span>
              </div>
              <div className="grid grid-cols-[80px_1fr] gap-2">
                <span className="text-slate-500">Size:</span>
                <span className="text-slate-800 dark:text-slate-200">{selectedMedia.size ? (selectedMedia.size / 1024).toFixed(1) + ' KB' : 'Unknown'}</span>
              </div>
              <div className="grid grid-cols-[80px_1fr] gap-2">
                <span className="text-slate-500">Tag:</span>
                <span className="text-slate-800 dark:text-slate-200">{getSourceConfig(selectedMedia.source).label}</span>
              </div>
              <div className="grid grid-cols-[80px_1fr] gap-2">
                <span className="text-slate-500">Description:</span>
                <span className="text-yellow-500/90 bg-yellow-500/10 px-2 py-1 rounded text-xs border border-yellow-500/20">{selectedMedia.title}</span>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700/50 flex flex-col gap-3">
              <button 
                onClick={() => setLightboxOpen(true)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-lg text-sm font-bold transition-colors"
              >
                BROWSE MEDIA
              </button>
              
              <button 
                onClick={() => handleNavigateToRecord(selectedMedia)}
                className="w-full py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-900 rounded-lg text-sm font-bold transition-colors flex justify-center items-center gap-2 shadow-[0_0_15px_rgba(20,184,166,0.3)]"
              >
                VIEW RECORD
              </button>
              
              <button onClick={() => setSelectedMedia(null)} className="w-full py-2 text-slate-500 hover:text-slate-300 text-sm mt-2 transition-colors">
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox / Fullscreen Viewer */}
      {lightboxOpen && selectedMedia && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in">
          <button 
            onClick={() => setLightboxOpen(false)}
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-50"
          >
            <X size={24} />
          </button>
          
          <div className="absolute top-6 left-6 text-white z-50">
            <h2 className="text-lg font-bold">{selectedMedia.title}</h2>
            <p className="text-sm text-slate-400">{dayjs(selectedMedia.timestamp).format('YYYY-MM-DD HH:mm:ss')}</p>
          </div>
          
          <div className="w-full h-full flex items-center justify-center">
            {selectedMedia.type === 'video' ? (
              <video 
                src={selectedMedia.url} 
                controls 
                autoPlay 
                className="max-w-full max-h-full rounded-lg shadow-2xl"
              />
            ) : (
              <img 
                src={selectedMedia.url} 
                alt={selectedMedia.title}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
