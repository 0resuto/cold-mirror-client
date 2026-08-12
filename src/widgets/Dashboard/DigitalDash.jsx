import React, { useEffect, useState } from 'react';
import { useLiveStore } from '../../store/useLiveStore';
import { useAppStore } from '../../store/useAppStore';
import { LoadingState } from '../../components/LoadingState';

export function DigitalDash() {
  const [data, setData] = useState({
    gear: 0,
    speed: 0,
    rpm: 0,
    shiftPct: 0,
  });
  const [hasData, setHasData] = useState(false);

  const settings = useAppStore(state => state.overlays['dash'] || {});
  const units = settings.units || 'kph';

  useEffect(() => {
    let lastUpdateTime = 0;
    const unsubscribe = useLiveStore.subscribe((state) => {
      const now = performance.now();
      // Dashboards need to be very responsive, 60fps
      if (now - lastUpdateTime < 16) return; 
      lastUpdateTime = now;

      const latestData = state.latestTelemetry;
      if (!latestData) {
        setHasData(false);
        return;
      }
      setHasData(true);

      useAppStore.getState().setWidgetActive('dash', latestData.Speed > 1);

      setData({
        gear: Number(latestData.Gear) || 0,
        speed: Number(latestData.Speed || 0) * 3.6, // m/s to km/h
        rpm: Number(latestData.RPM) || 0,
        shiftPct: Math.max(0, Math.min(1.2, Number(latestData.ShiftIndicatorPct) || 0)),
      });
    });
    return () => unsubscribe();
  }, []);

  const displaySpeed = units === 'mph' ? data.speed / 1.60934 : data.speed;
  
  if (!hasData) {
    return <LoadingState message="Waiting for Dashboard" />;
  }
  
  // Format Gear
  let gearStr = data.gear.toString();
  let gearColor = 'text-white';
  if (data.gear === 0) {
    gearStr = 'N';
    gearColor = 'text-green-500';
  } else if (data.gear === -1) {
    gearStr = 'R';
    gearColor = 'text-red-500';
  }

  // Shift Lights logic (15 LEDs total)
  const isFlashing = data.shiftPct >= 0.95;
  
  const renderLeds = () => {
    const leds = [];
    const totalLeds = 15;
    
    for (let i = 0; i < totalLeds; i++) {
      const threshold = (i + 1) / totalLeds; 
      const isOn = data.shiftPct >= threshold;
      
      let colorClass = 'bg-[#1a1a1a] border-[#333] shadow-inner'; // Off state
      let glowClass = '';

      if (isOn) {
        if (isFlashing) {
          colorClass = (i % 2 === 0) ? 'bg-blue-600 border-blue-400 animate-pulse' : 'bg-red-600 border-red-400 animate-pulse';
          glowClass = 'shadow-[0_0_15px_rgba(59,130,246,0.9)]';
          if (i % 2 !== 0) glowClass = 'shadow-[0_0_15px_rgba(239,68,68,0.9)]';
        } else {
          if (i < 5) {
            colorClass = 'bg-green-500 border-green-300';
            glowClass = 'shadow-[0_0_12px_rgba(34,197,94,0.9)]';
          } else if (i < 10) {
            colorClass = 'bg-yellow-400 border-yellow-200';
            glowClass = 'shadow-[0_0_12px_rgba(250,204,21,0.9)]';
          } else {
            colorClass = 'bg-red-600 border-red-400';
            glowClass = 'shadow-[0_0_12px_rgba(239,68,68,0.9)]';
          }
        }
      }

      leds.push(
        <div 
          key={i} 
          className={`w-8 h-8 rounded-full border-2 transition-colors duration-75 ${colorClass} ${isOn ? glowClass : ''}`}
        ></div>
      );
    }
    return leds;
  };

  return (
    <div className="w-full h-full bg-[#0a0a0a] flex flex-col items-center justify-between p-2 border-[4px] border-[#222] rounded-md shadow-2xl">
      
      {/* Shift Lights Header */}
      <div className="w-full flex justify-center gap-3 bg-[#111] p-3 border-b-2 border-[#222] rounded-t-sm">
        {renderLeds()}
      </div>

      {/* Main Dash Layout */}
      <div className="w-full flex-1 flex flex-row items-center justify-between px-10">
        
        {/* Speed */}
        <div className="flex flex-col items-center w-40">
          <span className="text-[80px] font-black font-mono text-cyan-400 tracking-tighter leading-none drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
            {displaySpeed.toFixed(0)}
          </span>
          <span className="text-xl font-bold text-gray-500 uppercase tracking-widest mt-2">
            {units}
          </span>
        </div>

        {/* Gear */}
        <div className="flex flex-col items-center justify-center border-l-4 border-r-4 border-[#222] px-16 h-4/5">
          <span className={`text-[160px] font-black font-mono leading-none tracking-tighter drop-shadow-2xl ${gearColor}`}>
            {gearStr}
          </span>
        </div>

        {/* RPM */}
        <div className="flex flex-col items-center w-40">
          <span className="text-[80px] font-black font-mono text-orange-400 tracking-tighter leading-none drop-shadow-[0_0_8px_rgba(251,146,60,0.5)]">
            {data.rpm.toFixed(0)}
          </span>
          <span className="text-xl font-bold text-gray-500 uppercase tracking-widest mt-2">
            RPM
          </span>
        </div>

      </div>
      
      {/* Bottom info bar */}
      <div className="w-full h-8 bg-[#111] border-t-2 border-[#222] flex items-center justify-center rounded-b-sm">
        <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">
          Cold Mirror Digital Display
        </span>
      </div>
      
    </div>
  );
}
