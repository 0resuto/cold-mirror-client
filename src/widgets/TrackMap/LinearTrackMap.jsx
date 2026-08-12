import React, { useEffect, useState } from 'react';
import { useLiveStore } from '../../store/useLiveStore';
import { useAppStore } from '../../store/useAppStore';
import { Wrench, Timer } from 'lucide-react';

export function LinearTrackMap() {
  const [gridData, setGridData] = useState({});
  const [playerIdx, setPlayerIdx] = useState(null);
  
  useEffect(() => {
    let lastUpdateTime = 0;
    
    const unsubscribe = useLiveStore.subscribe((state) => {
      const now = performance.now();
      // Track map updates don't need to be 60fps, 10-15fps is perfectly fine.
      if (now - lastUpdateTime < 66) return; 
      lastUpdateTime = now;
      
      const latestData = state.latestTelemetry;
      if (!latestData) return;
      
      useAppStore.getState().setWidgetActive('trackmap', latestData.Speed > 1);
      setGridData(latestData.grid || {});
      setPlayerIdx(latestData.playerCarIdx);
    });

    return () => unsubscribe();
  }, []);

  const playerCar = playerIdx != null ? gridData[playerIdx] : null;
  const playerLap = playerCar?.Lap || 0;

  return (
    <div className="w-full h-full flex flex-col justify-center px-4">
      
      {/* The main track line */}
      <div className="relative w-full h-2 bg-brand-60/30 rounded-full my-auto shadow-inner border border-black/20">
        
        {/* Start/Finish Line Mark */}
        <div className="absolute top-0 bottom-0 left-0 w-1 bg-white/40 rounded-l-full"></div>
        <div className="absolute -top-3 left-0 text-[8px] font-mono text-white/50 uppercase tracking-widest">S/F</div>

        {/* Cars */}
        {Object.entries(gridData).map(([idx, car]) => {
          const isPlayer = parseInt(idx) === playerIdx;
          const leftPos = (car.LapDistPct * 100).toFixed(2);
          
          let ringColor = 'border-white/20 border-solid';
          let coreColor = 'bg-brand-60';
          let zIndex = 10;
          let size = 'w-4 h-4';

          if (isPlayer) {
            ringColor = 'border-brand-primary border-solid';
            coreColor = 'bg-white shadow-[0_0_12px_var(--brand-primary)]';
            zIndex = 50;
            size = 'w-5 h-5';
          } else {
            // Check lap diff
            if (car.Lap < playerLap) {
              // Lap down (blue dashed)
              ringColor = 'border-blue-500 border-dashed';
            } else if (car.Lap > playerLap) {
              // Lap ahead (red dashed)
              ringColor = 'border-red-500 border-dashed';
            }
          }

          return (
            <div 
              key={idx}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none transition-all duration-75"
              style={{ 
                left: `${leftPos}%`,
                zIndex
              }}
            >
              {/* Status Icons (above the car) */}
              {(car.OnPitRoad || car.HasDamage || car.IsFastestLap) && (
                <div className="absolute bottom-full mb-1 flex gap-[2px]">
                  {car.HasDamage && <Wrench size={10} className="text-orange-500 drop-shadow-md" />}
                  {car.IsFastestLap && <Timer size={10} className="text-purple-400 drop-shadow-md" />}
                  {car.OnPitRoad && <div className="bg-yellow-500 text-black text-[7px] font-bold px-1 rounded-sm">PIT</div>}
                </div>
              )}

              {/* The Car Dot */}
              <div 
                className={`rounded-full border-[2px] flex items-center justify-center ${size} ${ringColor} bg-brand-bg/90 backdrop-blur-md`}
              >
                <div className={`w-2 h-2 rounded-full ${coreColor}`}></div>
              </div>

              {/* Position Number Label (below the car) */}
              {!isPlayer && (
                 <div className="absolute top-full mt-[2px] text-[8px] font-mono font-bold text-white/60">
                   P{car.Position}
                 </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
