import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, Search, Upload, Filter, ArrowUpDown, LayoutGrid, List, X, PlayCircle, Image as ImageIcon, Video, ExternalLink } from 'lucide-react';
import dayjs from 'dayjs';

export default function MediaGalleryView({ setView }) {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // all, env, test_result, bug
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selection & Lightbox
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

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

  const filteredMedia = useMemo(() => {
    return media.filter(m => {
      // Source filter
      if (activeTab !== 'all' && m.source !== activeTab) return false;
      // Search filter
      if (searchQuery && !m.title?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [media, activeTab, searchQuery]);

  const handleNavigateToRecord = (m) => {
    if (m?.session_id) {
      setView('history');
      // Note: passing state in custom routing needs app-level support, we just go to history.
    }
  };

  const getSourceConfig = (source) => {
    switch(source) {
      case 'bug': return { label: 'Bug Reports', color: 'bg-red-500', text: 'text-red-500', bg: 'bg-red-500/10' };
      case 'test_result': return { label: 'Test Results', color: 'bg-teal-500', text: 'text-teal-500', bg: 'bg-teal-500/10' };
      case 'env': return { label: 'Environment', color: 'bg-yellow-500', text: 'text-yellow-500', bg: 'bg-yellow-500/10' };
      default: return { label: 'Media', color: 'bg-slate-500', text: 'text-slate-500', bg: 'bg-slate-500/10' };
    }
  };

  return (
    <div className="h-full bg-[#131825] text-slate-200 p-6 flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4 shrink-0">
        <button 
          onClick={() => setView('monitor')}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <div className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1">
            VELOCITY // MEDIA HUB
          </div>
          <h1 className="text-2xl font-black text-white tracking-wide uppercase">
            MEDIA HUB
          </h1>
        </div>
      </div>

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
          className={`flex items-center gap-2 text-sm font-bold transition-colors ${activeTab === 'env' ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
          Performance Tests
        </button>
        <button 
          onClick={() => setActiveTab('test_result')}
          className={`flex items-center gap-2 text-sm font-bold transition-colors ${activeTab === 'test_result' ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <div className="w-2 h-2 rounded-full bg-teal-500"></div>
          Dashboard Screens
        </button>
        <button 
          onClick={() => setActiveTab('bug')}
          className={`flex items-center gap-2 text-sm font-bold transition-colors ${activeTab === 'bug' ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          Bug Reports
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div className="relative w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search media, tags, bugs..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1e2536] border border-slate-700/50 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-[#1e2536] border border-slate-700/50 hover:bg-slate-800 text-slate-300 px-4 py-2 rounded-lg text-sm transition-colors">
            <Upload size={16} /> Upload New
          </button>
          <button className="flex items-center gap-2 bg-[#1e2536] border border-slate-700/50 hover:bg-slate-800 text-slate-300 px-4 py-2 rounded-lg text-sm transition-colors">
            <Filter size={16} /> Filter
          </button>
          <button className="flex items-center gap-2 bg-[#1e2536] border border-slate-700/50 hover:bg-slate-800 text-slate-300 px-4 py-2 rounded-lg text-sm transition-colors">
            <ArrowUpDown size={16} /> Sort
          </button>
          
          <div className="flex items-center bg-[#1e2536] border border-slate-700/50 rounded-lg p-1 ml-2">
            <button className="p-1.5 bg-slate-700 rounded text-white shadow"><LayoutGrid size={16} /></button>
            <button className="p-1.5 text-slate-500 hover:text-slate-300"><List size={16} /></button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 min-h-0 gap-6">
        
        {/* Grid Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4">
          {loading ? (
            <div className="flex justify-center items-center h-40 text-slate-500">Loading media...</div>
          ) : filteredMedia.length === 0 ? (
            <div className="flex justify-center items-center h-40 text-slate-500">No media found.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredMedia.map((m, idx) => {
                const config = getSourceConfig(m.source);
                const isSelected = selectedMedia === m;
                
                return (
                  <div 
                    key={`${m.url}-${idx}`} 
                    onClick={() => setSelectedMedia(m)}
                    onDoubleClick={() => { setSelectedMedia(m); setLightboxOpen(true); }}
                    className={`group bg-[#1e2536] rounded-xl overflow-hidden border transition-all cursor-pointer flex flex-col
                      ${isSelected ? 'border-teal-500 ring-1 ring-teal-500/50' : 'border-slate-700/50 hover:border-slate-600'}
                    `}
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-[4/3] bg-[#0f131d] flex-shrink-0 flex items-center justify-center overflow-hidden p-2">
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
                          <span className="text-sm font-semibold text-slate-200 truncate" title={m.name || m.title}>{m.name || m.title || 'media_file'}</span>
                        </div>
                        <button className="text-slate-500 hover:text-slate-300"><span className="tracking-widest">...</span></button>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-auto">
                        <span className="text-[10px] text-slate-500 font-mono">1920 × 1080</span>
                        <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${config.bg} ${config.text}`}>
                          {config.label}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          
          {!loading && <div className="text-right text-xs text-slate-500 mt-4">Showing {filteredMedia.length} assets</div>}
        </div>

        {/* Right Asset Info Panel */}
        {selectedMedia && (
          <div className="w-80 shrink-0 bg-[#151d2b] border border-teal-500/30 rounded-xl p-5 flex flex-col animate-in fade-in slide-in-from-right-4 relative overflow-hidden shadow-[0_0_20px_rgba(20,184,166,0.1)]">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-teal-300" />
            
            <h3 className="text-teal-400 font-bold text-sm tracking-wider uppercase mb-6 flex justify-between items-center">
              Asset Info
              <button onClick={() => setSelectedMedia(null)} className="text-slate-500 hover:text-slate-300"><X size={16}/></button>
            </h3>
            
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-[80px_1fr] gap-2">
                <span className="text-slate-500">Uploaded:</span>
                <span className="text-slate-200">{dayjs(selectedMedia.timestamp).format('MMM DD, YYYY')}</span>
              </div>
              <div className="grid grid-cols-[80px_1fr] gap-2">
                <span className="text-slate-500">Size:</span>
                <span className="text-slate-200">{selectedMedia.size ? (selectedMedia.size / 1024).toFixed(1) + ' KB' : 'Unknown'}</span>
              </div>
              <div className="grid grid-cols-[80px_1fr] gap-2">
                <span className="text-slate-500">Tag:</span>
                <span className="text-slate-200">{getSourceConfig(selectedMedia.source).label}</span>
              </div>
              <div className="grid grid-cols-[80px_1fr] gap-2">
                <span className="text-slate-500">Description:</span>
                <span className="text-yellow-500/90 bg-yellow-500/10 px-2 py-1 rounded text-xs border border-yellow-500/20">{selectedMedia.title}</span>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-700/50 flex flex-col gap-3">
              <button 
                onClick={() => setLightboxOpen(true)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-bold transition-colors"
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
