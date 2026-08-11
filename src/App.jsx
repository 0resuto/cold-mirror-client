import React, { useState, useRef, useEffect } from 'react';
import { LiveStandings } from './widgets/Standings/LiveStandings';
import { useLiveTelemetryIPC } from './features/live/useLiveTelemetryIPC';
import { useAppStore } from './store/useAppStore';
import { Power, MousePointer2, Trophy } from 'lucide-react';

function Dashboard() {
  const initSettings = useAppStore(state => state.initSettings);
  const settingsLoaded = useAppStore(state => state.settingsLoaded);
  const overlays = useAppStore(state => state.overlays);
  const toggleOverlay = useAppStore(state => state.toggleOverlay);
  const updateOverlaySetting = useAppStore(state => state.updateOverlaySetting);

  useEffect(() => {
    initSettings();
  }, [initSettings]);

  if (!settingsLoaded) {
    return <div className="w-full h-screen bg-brand-bg flex items-center justify-center text-brand-10">Loading...</div>;
  }

  const overlayConfigs = [
    { id: 'standings', name: 'Live Standings', description: 'Real-time positions, gaps, and iRating.' },
    { id: 'relative', name: 'Relative', description: 'Drivers immediately ahead and behind on track.' },
  ];

  return (
    <div className="w-full h-screen bg-brand-bg text-brand-10 flex flex-col" style={{ WebkitAppRegion: 'drag' }}>
      <div className="flex justify-between items-center p-6 pb-2">
        <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-brand-30 flex items-center justify-center shadow-lg shadow-brand-30/20">
            <Trophy size={16} className="text-white" />
          </span>
          Cold Mirror
        </h1>
        <button 
          className="text-brand-60 hover:text-brand-30 transition-colors text-2xl px-2"
          onClick={() => window.electronAPI.windowAction('dashboard', 'close')}
          style={{ WebkitAppRegion: 'no-drag' }}
        >
          ×
        </button>
      </div>
      
      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar" style={{ WebkitAppRegion: 'no-drag' }}>
        <h2 className="text-sm font-bold text-brand-10/40 uppercase tracking-widest mb-4">Overlays</h2>
        
        <div className="grid gap-4">
          {overlayConfigs.map(config => {
            const state = overlays[config.id] || { enabled: false, clickThrough: false };
            
            return (
              <div key={config.id} className="bg-brand-60/10 border border-brand-60/30 rounded-xl p-4 flex items-center justify-between transition-colors hover:border-brand-60/50">
                <div>
                  <h3 className="font-bold text-lg">{config.name}</h3>
                  <p className="text-xs text-brand-10/50 mt-1">{config.description}</p>
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Click Through Toggle */}
                  <button
                    onClick={() => updateOverlaySetting(config.id, { clickThrough: !state.clickThrough })}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      state.clickThrough 
                        ? 'bg-brand-30/10 text-brand-30 border border-brand-30/30' 
                        : 'bg-brand-60/20 text-brand-10/40 border border-transparent hover:bg-brand-60/40'
                    }`}
                    title={state.clickThrough ? 'Mouse ignores overlay' : 'Overlay is clickable'}
                  >
                    <MousePointer2 size={14} className={state.clickThrough ? 'opacity-50' : ''} />
                    Click-Through
                  </button>

                  {/* Power Toggle */}
                  <button
                    onClick={() => toggleOverlay(config.id)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg ${
                      state.enabled 
                        ? 'bg-brand-30 text-white shadow-brand-30/20' 
                        : 'bg-brand-60/30 text-brand-10/40 hover:bg-brand-60/50 hover:text-brand-10'
                    }`}
                  >
                    <Power size={20} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ResizeHandle({ windowId }) {
  const [isDragging, setIsDragging] = useState(false);
  const startPos = useRef({ x: 0, y: 0, w: 0, h: 0 });

  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e) => {
      const deltaX = e.screenX - startPos.current.x;
      const deltaY = e.screenY - startPos.current.y;
      
      const newWidth = Math.max(250, startPos.current.w + deltaX);
      const newHeight = Math.max(200, startPos.current.h + deltaY);
      
      window.electronAPI.windowAction(windowId, 'resize', { width: newWidth, height: newHeight });
    };

    const onMouseUp = () => setIsDragging(false);

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging, windowId]);

  return (
    <div 
      className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize z-50 flex items-end justify-end p-1 opacity-50 hover:opacity-100 transition-opacity"
      onMouseDown={(e) => {
        startPos.current = {
          x: e.screenX,
          y: e.screenY,
          w: window.innerWidth,
          h: window.innerHeight
        };
        setIsDragging(true);
      }}
      style={{ WebkitAppRegion: 'no-drag' }}
    >
      <div className="w-3 h-3 border-r-2 border-b-2 border-brand-60 rounded-sm"></div>
    </div>
  );
}

function OverlayContainer({ title, windowId, children }) {
  return (
    <div 
      className="w-full h-screen overflow-hidden p-3 relative" 
      style={{ WebkitAppRegion: 'drag' }}
    >
      <div 
        className="w-full h-full relative" 
        style={{ WebkitAppRegion: 'no-drag' }}
      >
        <div className="glass border border-brand-60/60 rounded-xl overflow-hidden shadow-2xl h-full flex flex-col relative">
          <div className="bg-brand-bg/80 px-4 py-2 border-b border-brand-60/60 flex justify-between items-center select-none" style={{ WebkitAppRegion: 'drag' }}>
            <span className="text-[10px] font-bold text-brand-10/60 uppercase tracking-widest">{title}</span>
            <button 
              className="text-brand-60 hover:text-brand-30 transition-colors"
              onClick={() => window.electronAPI.windowAction(windowId, 'close')}
              style={{ WebkitAppRegion: 'no-drag' }}
            >
              ×
            </button>
          </div>
          <div className="p-2 flex-1 overflow-hidden">
            {children}
          </div>
        </div>
      </div>
      <ResizeHandle windowId={windowId} />
    </div>
  );
}

function App() {
  useLiveTelemetryIPC(true);

  const params = new URLSearchParams(window.location.search);
  const windowType = params.get('window') || 'dashboard';
  const overlayType = params.get('type');
  const windowId = params.get('id') || 'dashboard';

  if (windowType === 'dashboard') {
    return <Dashboard />;
  }

  if (windowType === 'overlay') {
    if (overlayType === 'standings') {
      return (
        <OverlayContainer title="Live Standings" windowId={windowId}>
          <LiveStandings />
        </OverlayContainer>
      );
    }
  }

  return <div className="text-white p-4">Unknown Window Type</div>;
}

export default App;
