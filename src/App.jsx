import React from 'react';
import { LiveStandings } from './components/LiveStandings';
import { useLiveTelemetryIPC } from './features/live/useLiveTelemetryIPC';

function App() {
  useLiveTelemetryIPC(true);

  return (
    <div 
      className="w-full h-screen overflow-hidden p-4" 
      style={{ WebkitAppRegion: 'drag' }}
    >
      <div 
        className="w-[400px]" 
        style={{ WebkitAppRegion: 'no-drag' }}
      >
        <div className="bg-zinc-950/80 backdrop-blur-sm border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
          <div className="bg-zinc-900/90 px-4 py-2 border-b border-zinc-800 flex justify-between items-center" style={{ WebkitAppRegion: 'drag' }}>
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Live Standings</span>
            <button 
              className="text-zinc-500 hover:text-white"
              onClick={() => window.close()}
              style={{ WebkitAppRegion: 'no-drag' }}
            >
              ×
            </button>
          </div>
          <div className="p-2">
            <LiveStandings />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
