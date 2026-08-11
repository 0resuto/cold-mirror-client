import React, { useEffect, useState } from 'react';
import { useLiveStore } from '../../store/useLiveStore';
import { useAppStore } from '../../store/useAppStore';
import { Fuel } from 'lucide-react';

export function LiveFuel() {
  const [fuelData, setFuelData] = useState({ level: 0, usage: 0, lapsRemaining: 0 });

  useEffect(() => {
    let lastUpdateTime = 0;

    const unsubscribe = useLiveStore.subscribe((state) => {
      const now = performance.now();
      // Throttle to 5Hz (200ms) - fuel doesn't need 60Hz smooth updates
      if (now - lastUpdateTime < 200) return;
      lastUpdateTime = now;

      const latestData = state.liveLapData[state.liveLapData.length - 1];
      if (!latestData) return;

      useAppStore.getState().setWidgetActive('fuel', latestData.Speed > 1);

      // FuelUsePerHour is usually L/hr or kg/hr. iRacing uses Liters.
      const level = latestData.FuelLevel || 0;
      const usage = latestData.FuelUsePerHour || 0;
      
      // Calculate laps remaining (mock estimate based on usage/speed or just arbitrary for mock)
      // Real iRacing requires tracking fuel per lap. We'll show raw liters for now and an arbitrary laps estimate.
      const lapsRemaining = usage > 0 ? (level / (usage / 60)) : 0; 

      setFuelData({
        level,
        usage,
        lapsRemaining
      });
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="flex flex-col h-full w-full font-sans overflow-hidden">
      <div className="bg-brand-60/10 px-4 py-2 border-b border-brand-60/30 flex items-center gap-2" style={{ WebkitAppRegion: 'drag' }}>
        <Fuel size={14} className="text-brand-30" />
        <span className="text-xs font-black text-brand-10/90 uppercase tracking-widest">Fuel Calc</span>
      </div>
      <div className="flex-1 flex flex-col justify-center p-4 gap-4">
        
        <div className="flex justify-between items-end">
          <span className="text-xs text-brand-10/50 uppercase font-semibold">Remaining</span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-mono font-black text-brand-10 leading-none">
              {fuelData.level.toFixed(1)}
            </span>
            <span className="text-sm font-bold text-brand-10/50">L</span>
          </div>
        </div>

        <div className="w-full h-2 bg-brand-60/30 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${fuelData.level < 5 ? 'bg-accent-red animate-pulse' : fuelData.level < 15 ? 'bg-accent-yellow' : 'bg-brand-30'}`}
            style={{ width: `${Math.min(100, (fuelData.level / 100) * 100)}%` }}
          />
        </div>

        <div className="flex justify-between items-end mt-2 pt-3 border-t border-brand-60/30">
          <span className="text-xs text-brand-10/50 uppercase font-semibold">Usage (L/hr)</span>
          <span className="text-lg font-mono font-bold text-brand-10/90">
            {fuelData.usage.toFixed(1)}
          </span>
        </div>

      </div>
    </div>
  );
}
