import React, { useEffect, useState } from 'react';
import { useLiveStore } from '../../store/useLiveStore';
import { Gamepad2 } from 'lucide-react';

export function LiveInputs() {
  const [inputs, setInputs] = useState({
    throttle: 0,
    brake: 0,
    clutch: 0,
    steering: 0,
    gear: 0,
    speed: 0
  });

  useEffect(() => {
    let lastUpdateTime = 0;

    const unsubscribe = useLiveStore.subscribe((state) => {
      const now = performance.now();
      // Inputs need to be very smooth, ~30Hz or 60Hz. We'll use 33ms (30fps).
      if (now - lastUpdateTime < 33) return;
      lastUpdateTime = now;

      const latestData = state.liveLapData[state.liveLapData.length - 1];
      if (!latestData) return;

      setInputs({
        throttle: latestData.Throttle || 0,
        brake: latestData.Brake || 0,
        clutch: latestData.Clutch || 0,
        steering: latestData.SteeringWheelAngle || 0, // rad
        gear: latestData.Gear || 0,
        speed: latestData.Speed || 0
      });
    });

    return () => unsubscribe();
  }, []);

  // Format gear
  const displayGear = inputs.gear === 0 ? 'N' : inputs.gear === -1 ? 'R' : inputs.gear.toString();

  // Steering rotation (rad to deg)
  const steerDeg = inputs.steering * (180 / Math.PI);

  return (
    <div className="flex flex-col h-full w-full font-sans bg-brand-bg/60 rounded-lg overflow-hidden border border-brand-60/40 shadow-2xl glass">
      <div className="flex-1 flex p-3 gap-3">
        
        {/* Left column: Gear & Speed & Steering */}
        <div className="flex flex-col items-center justify-between w-16 bg-brand-60/20 rounded-lg p-2 border border-brand-60/30">
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-brand-10/50 uppercase font-bold tracking-widest mb-1">Gear</span>
            <span className={`text-4xl font-mono font-black ${inputs.gear <= 0 ? 'text-brand-30' : 'text-brand-10'}`}>
              {displayGear}
            </span>
          </div>

          <div className="flex flex-col items-center my-4 relative">
            <div className="w-12 h-12 border-2 border-brand-60/50 rounded-full flex items-center justify-center">
              {/* Steering wheel visualizer */}
              <div 
                className="w-10 h-2 bg-brand-10/80 rounded-full shadow-lg"
                style={{ transform: `rotate(${steerDeg}deg)`, transition: 'transform 50ms linear' }}
              />
            </div>
            <span className="text-[9px] text-brand-10/50 font-mono mt-1">{Math.abs(Math.round(steerDeg))}°</span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-xl font-mono font-bold text-brand-10/90">{Math.round(inputs.speed)}</span>
            <span className="text-[9px] text-brand-10/40 uppercase tracking-widest">km/h</span>
          </div>
        </div>

        {/* Right column: Pedals */}
        <div className="flex-1 flex gap-2 justify-around items-end h-full pt-4 pb-2">
          
          {/* Clutch */}
          <div className="flex flex-col items-center h-full w-8 justify-end">
            <div className="w-full bg-brand-60/30 rounded-t-sm flex-1 relative overflow-hidden flex items-end">
              <div 
                className="w-full bg-accent-blue transition-all"
                style={{ height: `${inputs.clutch * 100}%`, transitionDuration: '33ms' }}
              />
            </div>
            <span className="text-[10px] font-bold text-brand-10/40 mt-1">C</span>
          </div>

          {/* Brake */}
          <div className="flex flex-col items-center h-full w-10 justify-end">
            <div className="w-full bg-brand-60/30 rounded-t-sm flex-1 relative overflow-hidden flex items-end">
              <div 
                className="w-full bg-accent-red transition-all"
                style={{ height: `${inputs.brake * 100}%`, transitionDuration: '33ms' }}
              />
            </div>
            <span className="text-[10px] font-bold text-brand-10/40 mt-1">B</span>
          </div>

          {/* Throttle */}
          <div className="flex flex-col items-center h-full w-10 justify-end">
            <div className="w-full bg-brand-60/30 rounded-t-sm flex-1 relative overflow-hidden flex items-end">
              <div 
                className="w-full bg-accent-green transition-all shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                style={{ height: `${inputs.throttle * 100}%`, transitionDuration: '33ms' }}
              />
            </div>
            <span className="text-[10px] font-bold text-brand-10/40 mt-1">T</span>
          </div>

        </div>
      </div>
    </div>
  );
}
