import React, { useEffect, useState } from 'react';
import { useLiveStore } from '../../store/useLiveStore';
import { useAppStore } from '../../store/useAppStore';
import { Fuel, Wrench, CircleDashed } from 'lucide-react';

export function PitHelper() {
  const [data, setData] = useState({
    speed: 0,
    onPitRoad: false,
    pitSvFlags: 0,
    pitSvFuel: 0,
    limitKph: 80,
  });

  // Settings for this widget
  const settings = useAppStore(state => state.overlays['pit'] || {});
  const activeOpacity = settings.activeOpacity ?? 1.0;
  const inactiveOpacity = settings.inactiveOpacity ?? 0.0; // Default to fully hidden when not on pit road
  const units = settings.units || 'kph';

  useEffect(() => {
    let lastUpdateTime = 0;
    const unsubscribe = useLiveStore.subscribe((state) => {
      const now = performance.now();
      if (now - lastUpdateTime < 33) return; // ~30fps
      lastUpdateTime = now;

      const latestData = state.liveLapData[state.liveLapData.length - 1];
      if (!latestData) return;

      const session = state.sessionData;
      let limit = 80;
      if (session?.data?.WeekendInfo?.TrackPitSpeedLimit) {
        const limitStr = session.data.WeekendInfo.TrackPitSpeedLimit;
        const parsed = parseFloat(limitStr);
        if (!isNaN(parsed)) {
          if (limitStr.includes('mph')) {
            limit = parsed * 1.60934;
          } else {
            limit = parsed;
          }
        }
      }

      setData({
        speed: latestData.Speed * 3.6, // m/s to km/h
        onPitRoad: latestData.grid[latestData.playerCarIdx]?.OnPitRoad || false,
        pitSvFlags: latestData.PitSvFlags || 0,
        pitSvFuel: latestData.PitSvFuel || 0,
        limitKph: limit,
      });
    });
    return () => unsubscribe();
  }, []);

  const opacity = data.onPitRoad ? activeOpacity : inactiveOpacity;
  const isSpeeding = data.onPitRoad && data.speed > data.limitKph;

  // Convert speeds for display
  const displaySpeed = units === 'mph' ? data.speed / 1.60934 : data.speed;
  const displayLimit = units === 'mph' ? data.limitKph / 1.60934 : data.limitKph;

  // Max scale of the bar is 120% of the limit
  const maxDisplaySpeed = displayLimit * 1.2;
  const fillPct = Math.min(100, Math.max(0, (displaySpeed / maxDisplaySpeed) * 100));
  const limitPct = Math.min(100, Math.max(0, (displayLimit / maxDisplaySpeed) * 100));

  // Bitfield for PitSvFlags: 1=LF, 2=RF, 4=LR, 8=RR, 16=Fuel, 32=WS, 64=FR
  const tires = (data.pitSvFlags & 15) > 0; // Any tire
  const fuel = (data.pitSvFlags & 16) > 0;
  const fastRepair = (data.pitSvFlags & 64) > 0;

  return (
    <div 
      className={`w-full h-full flex flex-col font-sans transition-all duration-300 overflow-hidden ${isSpeeding ? 'bg-red-600/90 shadow-[0_0_50px_rgba(220,38,38,0.8)]' : 'bg-transparent'}`} 
      style={{ opacity }}
    >
      {/* Speedometer Area */}
      <div className="flex-1 flex flex-col justify-center px-4 relative">
        <div className="flex justify-between items-end mb-2">
          <div className="flex items-baseline gap-1">
            <span className={`text-4xl font-black font-mono leading-none ${isSpeeding ? 'text-white animate-pulse' : 'text-brand-30 drop-shadow-md'}`}>
              {displaySpeed.toFixed(1)}
            </span>
            <span className="text-sm font-bold text-white/50 uppercase tracking-widest">
              {units}
            </span>
          </div>
          
          {isSpeeding && (
            <span className="text-xl font-black text-white uppercase tracking-widest animate-pulse">
              SPEEDING
            </span>
          )}
        </div>

        {/* Speed Bar */}
        <div className="w-full h-8 bg-black/60 rounded-lg relative overflow-hidden border border-white/20 shadow-inner">
          {/* Fill */}
          <div 
            className={`h-full transition-all duration-75 ${isSpeeding ? 'bg-red-500' : 'bg-brand-30'}`}
            style={{ width: `${fillPct}%` }}
          ></div>

          {/* Limit Marker */}
          <div 
            className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_rgba(255,255,255,1)] z-10"
            style={{ left: `${limitPct}%` }}
          ></div>
        </div>
      </div>

      {/* Services Area */}
      <div className={`h-12 border-t flex items-center justify-center gap-10 px-4 ${isSpeeding ? 'bg-red-950/50 border-red-400/50' : 'bg-brand-bg/80 border-brand-60/30'}`}>
        
        {/* Tires */}
        <div className={`flex items-center gap-2 transition-opacity ${tires ? 'opacity-100' : 'opacity-20'}`}>
          <CircleDashed size={20} className={tires ? 'text-orange-400' : 'text-white'} />
          <span className="text-sm font-bold text-white uppercase">Tires</span>
        </div>

        {/* Fuel */}
        <div className={`flex items-center gap-2 transition-opacity ${fuel ? 'opacity-100' : 'opacity-20'}`}>
          <Fuel size={20} className={fuel ? 'text-green-400' : 'text-white'} />
          <span className="text-sm font-bold text-white uppercase">
            {fuel && data.pitSvFuel > 0 ? `+${data.pitSvFuel.toFixed(1)}L` : 'Fuel'}
          </span>
        </div>

        {/* Fast Repair */}
        <div className={`flex items-center gap-2 transition-opacity ${fastRepair ? 'opacity-100' : 'opacity-20'}`}>
          <Wrench size={20} className={fastRepair ? 'text-cyan-400' : 'text-white'} />
          <span className="text-sm font-bold text-white uppercase">Fast Repair</span>
        </div>

      </div>
    </div>
  );
}
