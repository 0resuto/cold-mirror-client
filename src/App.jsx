import React, { useState, useRef, useEffect } from 'react';
import { LiveStandings } from './widgets/Standings/LiveStandings';
import { LiveRelative } from './widgets/Relative/LiveRelative';
import { LiveFuel } from './widgets/Fuel/LiveFuel';
import { LiveInputs } from './widgets/Inputs/LiveInputs';
import { LiveRadar } from './widgets/Radar/LiveRadar';
import { LinearTrackMap } from './widgets/TrackMap/LinearTrackMap';
import { LiveWeather } from './widgets/Weather/LiveWeather';
import { PitHelper } from './widgets/PitHelper/PitHelper';
import { DigitalDash } from './widgets/Dashboard/DigitalDash';
import { useLiveTelemetryIPC } from './features/live/useLiveTelemetryIPC';
import { useAppStore } from './store/useAppStore';
import { Power, Trophy, Settings, ChevronDown, ChevronUp, Lock, Unlock, Minus, Square, X } from 'lucide-react';

const getSliderFill = (val, min, max) => {
  const pct = ((val - min) / (max - min)) * 100;
  return `linear-gradient(to right, #e63946 ${pct}%, rgba(255,255,255,0.1) ${pct}%)`;
};

function WidgetCard({ config, overlays, toggleOverlay, updateOverlaySetting }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const state = overlays[config.id] || { enabled: false, clickThrough: false, scale: 1.0 };
  
  // Defaults based on widget type
  const isPitOrRadar = config.id === 'pit' || config.id === 'radar';
  const defaultInactive = isPitOrRadar ? 0.0 : 0.5;
  
  const scale = state.scale || 1.0;
  const activeOpacity = state.activeOpacity ?? 1.0;
  const inactiveOpacity = state.inactiveOpacity ?? defaultInactive;

  const renderSlider = (label, key, val, min, max) => (
    <div className="flex items-center gap-3">
      <span className="text-[10px] whitespace-nowrap font-bold text-brand-10/60 uppercase w-28">{label}:</span>
      <input 
        type="range" min={min} max={max} step="0.05" 
        value={val}
        onChange={(e) => updateOverlaySetting(config.id, { [key]: parseFloat(e.target.value) })}
        className="flex-1 max-w-[150px] min-w-[80px] h-1 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-brand-30 [&::-webkit-slider-thumb]:rounded-full"
        style={{ background: getSliderFill(val, min, max) }}
      />
      <span className="text-[10px] font-mono text-brand-10/40 w-8 text-right">{Math.round(val * 100)}%</span>
    </div>
  );

  return (
    <div className="bg-brand-60/10 border border-brand-60/30 rounded-xl flex flex-col transition-colors hover:border-brand-60/50 overflow-hidden">
      {/* Header (Always Visible) */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex-1 cursor-pointer select-none" onClick={() => setIsExpanded(!isExpanded)}>
          <h3 className="font-bold text-lg flex items-center gap-2">
            {config.name}
            {isExpanded ? <ChevronUp size={16} className="text-brand-60" /> : <ChevronDown size={16} className="text-brand-60" />}
          </h3>
          <p className="text-xs text-brand-10/50 mt-1">{config.description}</p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Click-Through Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              updateOverlaySetting(config.id, { clickThrough: !state.clickThrough });
            }}
            className={`p-2 rounded-full transition-colors ${
              state.clickThrough 
                ? 'bg-brand-30/20 text-brand-30' 
                : 'text-brand-10/40 hover:bg-brand-60/40 hover:text-brand-10'
            }`}
            title={state.clickThrough ? 'Locked (ignores mouse)' : 'Unlocked (interactive)'}
          >
            {state.clickThrough ? <Lock size={16} /> : <Unlock size={16} />}
          </button>

          {/* Settings Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className={`p-2 rounded-full transition-colors ${isExpanded ? 'bg-brand-60/40 text-brand-10' : 'text-brand-60 hover:bg-brand-60/20 hover:text-brand-10'}`}
          >
            <Settings size={18} />
          </button>

          {/* Power Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleOverlay(config.id);
            }}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg ml-1 ${
              state.enabled 
                ? 'bg-brand-30 text-white shadow-[0_0_15px_rgba(234,88,12,0.4)]' 
                : 'bg-brand-60/30 text-brand-10/40 hover:bg-brand-60/50 hover:text-brand-10'
            }`}
          >
            <Power size={18} />
          </button>
        </div>
      </div>

      {/* Expanded Settings */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-3 border-t border-brand-60/20 flex flex-col gap-3 bg-black/20">
          {renderSlider('Scale', 'scale', scale, 0.5, 2.0)}
          {renderSlider('Active Opacity', 'activeOpacity', activeOpacity, 0.0, 1.0)}
          {renderSlider('Inactive Opacity', 'inactiveOpacity', inactiveOpacity, 0.0, 1.0)}
        </div>
      )}
    </div>
  );
}

function Dashboard() {
  const initSettings = useAppStore(state => state.initSettings);
  const settingsLoaded = useAppStore(state => state.settingsLoaded);
  const overlays = useAppStore(state => state.overlays);
  const toggleOverlay = useAppStore(state => state.toggleOverlay);
  const updateOverlaySetting = useAppStore(state => state.updateOverlaySetting);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    initSettings();
    if (window.electronAPI?.onMaximizeStateChange) {
      window.electronAPI.onMaximizeStateChange(setIsMaximized);
    }
  }, [initSettings]);

  if (!settingsLoaded) {
    return <div className="w-full h-screen bg-brand-bg flex items-center justify-center text-brand-10">Loading...</div>;
  }

  const overlayConfigs = [
    { id: 'standings', name: 'Live Standings', description: 'Real-time positions, gaps, and iRating.' },
    { id: 'relative', name: 'Relative', description: 'Drivers immediately ahead and behind on track.' },
    { id: 'fuel', name: 'Fuel Calculator', description: 'Live fuel usage and remaining laps.' },
    { id: 'inputs', name: 'Input Trace', description: 'Steering wheel, pedals, gear and speed.' },
    { id: 'radar', name: 'Proximity Radar', description: 'Visual indicator for cars in your blind spots.' },
    { id: 'trackmap', name: 'Live Track Map', description: 'Linear track map showing all cars.' },
    { id: 'weather', name: 'Weather', description: 'Air/track temp and wind direction.' },
    { id: 'pit', name: 'Pit Helper', description: 'Pit speed limiter and service status.' },
    { id: 'dash', name: 'Digital Dashboard', description: 'RPM, Gear, Speed, and Shift Lights.' },
  ];
  
  return (
    <div className={`w-full h-screen bg-brand-bg text-brand-10 flex flex-col relative overflow-hidden transition-all duration-200 ${isMaximized ? '' : 'rounded-lg border border-brand-60/30'}`} style={{ WebkitAppRegion: 'drag' }}>
      {/* Windows Window Controls */}
      <div className="absolute top-0 right-0 flex items-center z-50" style={{ WebkitAppRegion: 'no-drag' }}>
        <button 
          className="w-12 h-8 flex items-center justify-center text-brand-10/50 hover:bg-white/10 hover:text-white transition-colors"
          onClick={() => window.electronAPI.windowAction('dashboard', 'minimize')}
        >
          <Minus size={16} />
        </button>
        <button 
          className="w-12 h-8 flex items-center justify-center text-brand-10/50 hover:bg-white/10 hover:text-white transition-colors"
          onClick={() => window.electronAPI.windowAction('dashboard', 'maximize')}
        >
          <Square size={12} />
        </button>
        <button 
          className="w-12 h-8 flex items-center justify-center text-brand-10/50 hover:bg-red-500 hover:text-white transition-colors"
          onClick={() => window.electronAPI.windowAction('dashboard', 'close')}
        >
          <X size={16} />
        </button>
      </div>

      {/* Titlebar */}
      <div className="flex justify-between items-center pl-3 h-8 select-none">
        <h1 className="text-sm font-semibold tracking-wide flex items-center gap-2 text-brand-10/90 pt-1">
          <img src="/app_icon.ico" className="w-4 h-4 object-contain" alt="Logo" />
          Cold Mirror
        </h1>
      </div>
      
      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar" style={{ WebkitAppRegion: 'no-drag' }}>
        <h2 className="text-sm font-bold text-brand-10/40 uppercase tracking-widest mb-4">Overlays</h2>
        
        <div className="grid gap-4">
          {overlayConfigs.map(config => (
            <WidgetCard 
              key={config.id} 
              config={config} 
              overlays={overlays} 
              toggleOverlay={toggleOverlay} 
              updateOverlaySetting={updateOverlaySetting} 
            />
          ))}
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
      
      const newWidth = Math.max(100, startPos.current.w + deltaX);
      const newHeight = Math.max(100, startPos.current.h + deltaY);
      
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

function OverlayContainer({ title, windowId, hideHeader = false, raw = false, children }) {
  const overlayId = windowId.replace('overlay-', '');
  const settings = useAppStore(state => state.overlays[overlayId]) || {};
  const isActive = useAppStore(state => state.widgetActive[overlayId]) ?? true; // default true if widget doesn't report

  const isPitOrRadar = overlayId === 'pit' || overlayId === 'radar';
  const defaultInactive = isPitOrRadar ? 0.0 : 0.5;

  const scale = settings.scale || 1.0;
  const activeOpacity = settings.activeOpacity ?? 1.0;
  const inactiveOpacity = settings.inactiveOpacity ?? defaultInactive;

  const currentOpacity = isActive ? activeOpacity : inactiveOpacity;
  const containerStyle = { WebkitAppRegion: 'drag', opacity: currentOpacity, transition: 'opacity 0.5s ease-in-out' };

  if (raw) {
    return (
      <div className="w-full h-screen overflow-hidden relative bg-black" style={containerStyle}>
        <div className="w-full h-full relative flex flex-col" style={{ zoom: scale }}>
          {children}
        </div>
        <ResizeHandle windowId={windowId} />
      </div>
    );
  }

  return (
    <div 
      className="w-full h-screen overflow-hidden relative" 
      style={containerStyle}
    >
      <div className="w-full h-full relative" style={{ zoom: scale }}>
        <div className={`glass border border-brand-60/60 rounded-xl overflow-hidden h-full flex flex-col relative`}>
          {!hideHeader && (
            <div className="bg-brand-bg/80 px-4 py-2 border-b border-brand-60/60 flex justify-between items-center select-none" style={{ WebkitAppRegion: 'drag' }}>
              <span className="font-bold text-sm tracking-wide text-brand-30">{title}</span>
              <div className="flex gap-2">
                <button 
                  className="text-brand-10 hover:text-white transition-colors"
                  onClick={() => window.electronAPI.windowAction(windowId, 'close')}
                  style={{ WebkitAppRegion: 'no-drag' }}
                >
                  <Power size={14} />
                </button>
              </div>
            </div>
          )}
          <div className="flex-1 relative overflow-hidden">
            {children}
          </div>
        </div>
      </div>
      <ResizeHandle windowId={windowId} />
    </div>
  );
}

function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const windowType = urlParams.get('window'); // 'dashboard' or 'overlay'
  const overlayType = urlParams.get('type');
  const windowId = urlParams.get('id');

  // Initialize telemetry IPC connection
  useLiveTelemetryIPC();

  if (windowType === 'overlay') {
    let content = null;
    let title = 'Overlay';
    let hideHeader = false;
    let raw = false;
    
    if (overlayType === 'standings') {
      content = <LiveStandings />;
      title = 'Live Standings';
    } else if (overlayType === 'relative') {
      content = <LiveRelative />;
      title = 'Relative';
    } else if (overlayType === 'fuel') {
      content = <LiveFuel />;
      title = 'Fuel Calculator';
      hideHeader = true; // LiveFuel renders its own header
    } else if (overlayType === 'inputs') {
      content = <LiveInputs />;
      title = 'Input Trace';
      hideHeader = true; // LiveInputs renders without header for sleek look
    } else if (overlayType === 'radar') {
      content = <LiveRadar />;
      title = 'Proximity Radar';
      hideHeader = true; // Radar renders its own UI without standard header
    } else if (overlayType === 'trackmap') {
      content = <LinearTrackMap />;
      title = 'Live Track Map';
      hideHeader = true; // Linear map has its own minimal UI
    } else if (overlayType === 'weather') {
      content = <LiveWeather />;
      title = 'Weather';
      hideHeader = true; // Minimal UI
    } else if (overlayType === 'pit') {
      content = <PitHelper />;
      title = 'Pit Helper';
      hideHeader = true;
    } else if (overlayType === 'dash') {
      content = <DigitalDash />;
      title = 'Digital Dashboard';
      hideHeader = true;
      raw = true; // Digital Dash uses raw container for solid background
    } else {
      content = <div className="text-white p-4">Unknown overlay type</div>;
    }

    return (
      <OverlayContainer title={title} windowId={windowId} hideHeader={hideHeader} raw={raw}>
        {content}
      </OverlayContainer>
    );
  }

  // Default to dashboard
  return <Dashboard />;
}

export default App;
