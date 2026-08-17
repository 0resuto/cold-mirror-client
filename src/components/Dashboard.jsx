import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Minus, Square, X } from 'lucide-react';
import { WidgetCard } from './WidgetCard';
import appIcon from '../assets/app_icon.ico';

import { widgetRegistry } from '../core/widgets/index.js';

const overlayConfigs = widgetRegistry.getAll();

export function Dashboard() {
  const settingsLoaded = useAppStore(state => state.settingsLoaded);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    let unsub;
    if (window.electronAPI?.onMaximizeStateChange) {
      unsub = window.electronAPI.onMaximizeStateChange(setIsMaximized);
    }
    return () => {
      if (unsub) unsub();
    };
  }, []);

  if (!settingsLoaded) {
    return <div className="w-full h-screen bg-brand-bg flex items-center justify-center text-brand-10">Loading...</div>;
  }
  
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
          <img src={appIcon} className="w-4 h-4 object-contain" alt="Logo" />
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
            />
          ))}
        </div>
      </div>
    </div>
  );
}
