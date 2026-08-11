import React, { useEffect, useState } from 'react';
import { useLiveStore } from '../../store/useLiveStore';
import { useAppStore } from '../../store/useAppStore';
import { Thermometer, Wind, Navigation, Cloud } from 'lucide-react';

export function LiveWeather() {
  const [weather, setWeather] = useState({ AirTemp: 0, TrackTemp: 0, WindVel: 0, WindDir: 0, Yaw: 0 });
  
  useEffect(() => {
    let lastUpdateTime = 0;
    const unsubscribe = useLiveStore.subscribe((state) => {
      const now = performance.now();
      // Weather doesn't change fast, 4fps is more than enough
      if (now - lastUpdateTime < 250) return; 
      lastUpdateTime = now;
      
      const latestData = state.liveLapData[state.liveLapData.length - 1];
      if (!latestData) return;
      
      useAppStore.getState().setWidgetActive('weather', latestData.Speed > 1);

      setWeather({
        AirTemp: latestData.AirTemp || 0,
        TrackTemp: latestData.TrackTemp || 0,
        WindVel: latestData.WindVel || 0,
        WindDir: latestData.WindDir || 0,
        Yaw: latestData.Yaw || 0
      });
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="w-full h-full flex flex-row items-center justify-center gap-4 px-2">
      
      {/* Air Temperature */}
      <div className="flex items-center gap-2 shrink-0">
        <Cloud size={24} className="text-white/80" />
        <span className="text-2xl font-bold font-mono text-white drop-shadow-md">
          {weather.AirTemp.toFixed(1)}°
        </span>
      </div>

      {/* Track Temperature */}
      <div className="flex items-center gap-2 shrink-0">
        <Thermometer size={24} className="text-orange-500" />
        <span className="text-2xl font-bold font-mono text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.5)] whitespace-nowrap">
          {weather.TrackTemp.toFixed(1)}°
        </span>
      </div>

      <div className="w-px h-10 bg-brand-60/30 shrink-0"></div>

      {/* Wind */}
      <div className="flex items-center gap-3 shrink-0">
        <Wind size={24} className="text-cyan-400 shrink-0" />
        <div className="flex flex-col items-center gap-1 shrink-0">
          <span className="text-2xl font-bold font-mono text-white leading-none">
            {weather.WindVel.toFixed(1)}
          </span>
          <span className="text-[10px] text-brand-10/40 uppercase font-bold tracking-widest leading-none">
            m/s
          </span>
        </div>
        
        {/* Rotating Compass Arrow */}
        <div className="ml-1 relative w-10 h-10 rounded-full border border-cyan-400/30 bg-cyan-900/30 flex items-center justify-center shadow-inner overflow-hidden">
          {/* North indicator tick mark (Relative to Car) */}
          <div className="absolute top-0 w-1 h-1.5 bg-cyan-400/50 rounded-b-sm z-10"></div>
          
          <div 
            className="transition-transform duration-[250ms] ease-linear absolute w-full h-full"
            style={{ transform: `rotate(${weather.WindDir - weather.Yaw}rad)` }}
          >
            {/* Arrow on the radius pointing to the center, sunken and clipped */}
            <div className="absolute top-[-3px] left-1/2 -translate-x-1/2 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.8)] z-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <polygon points="12,22 4,2 12,6 20,2" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
