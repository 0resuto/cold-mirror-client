import React, { useEffect, useState, useMemo } from 'react';
import { useLiveStore } from '../../store/useLiveStore';
import { useAppStore } from '../../store/useAppStore';
import { LoadingState } from '../../components/LoadingState';

export function LiveRelative() {
  const [relativeDrivers, setRelativeDrivers] = useState([]);
  const sessionDrivers = useLiveStore(state => state.sessionDrivers);
  const driverCarIdx = useLiveStore(state => state.driverCarIdx);

  useEffect(() => {
    let lastUpdateTime = 0;

    const unsubscribe = useLiveStore.subscribe((state) => {
      const now = performance.now();
      // Throttle updates to ~15Hz (66ms) to balance CPU and smooth delta updates
      if (now - lastUpdateTime < 66) return;
      lastUpdateTime = now;

      const latestData = state.latestTelemetry;
      const grid = latestData?.grid || {};

      useAppStore.getState().setWidgetActive('relative', latestData?.Speed > 1);

      if (Object.keys(grid).length === 0 || state.sessionDrivers.length === 0 || state.driverCarIdx === null) return;

      const playerGrid = grid[state.driverCarIdx];
      if (!playerGrid) return; // Player not on track

      const playerPct = playerGrid.LapDistPct ?? 0;

      const relative = Object.keys(grid).map(carIdx => {
        const driverGrid = grid[carIdx];
        const driverInfo = state.sessionDrivers.find(d => d.CarIdx === Number(carIdx));
        if (!driverInfo) return null;

        let pctDiff = (driverGrid?.LapDistPct ?? 0) - playerPct;
        if (pctDiff > 0.5) pctDiff -= 1;
        if (pctDiff < -0.5) pctDiff += 1;

        // Roughly estimate time gap based on average speed or just use distance for now
        const estTimeGap = pctDiff * 100;

        return {
          carIdx: Number(carIdx),
          name: driverInfo.UserName,
          carNumber: driverInfo.CarNumber,
          irating: driverInfo.iRating,
          license: driverInfo.LicString,
          isPlayer: Number(carIdx) === state.driverCarIdx,
          pctDiff,
          gap: estTimeGap,
          color: driverInfo.CarClassColor ? `#${driverInfo.CarClassColor.toString(16).padStart(6, '0')}` : '#666'
        };
      }).filter(Boolean);

      relative.sort((a, b) => b.gap - a.gap);

      const playerIndex = relative.findIndex(d => d.isPlayer);
      if (playerIndex === -1) return;

      const startIndex = Math.max(0, playerIndex - 3);
      const endIndex = Math.min(relative.length, playerIndex + 4);
      setRelativeDrivers(relative.slice(startIndex, endIndex));
    });

    return () => unsubscribe();
  }, []);

  if (!sessionDrivers || sessionDrivers.length === 0) {
    return <LoadingState message="Waiting for Telemetry..." />;
  }

  if (relativeDrivers.length === 0) {
    return <LoadingState message="Player not on track" />;
  }

  return (
    <div className="flex flex-col h-full w-full font-sans bg-brand-bg/40 rounded-lg overflow-hidden">
      <div className="px-3 py-1.5 bg-brand-60/40 border-b border-brand-60/50 flex justify-between items-center">
        <span className="text-[10px] font-bold text-brand-10/70 uppercase tracking-widest">Relative</span>
        <span className="text-[10px] text-brand-10/40">Delta</span>
      </div>
      <div className="flex-1 flex flex-col p-1 gap-1">
        {relativeDrivers.map(d => (
          <div 
            key={d.carIdx} 
            className={`flex items-center justify-between px-2 py-1.5 rounded-md ${d.isPlayer ? 'bg-brand-30/20 border border-brand-30/30' : 'bg-brand-60/20'}`}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <div 
                className="w-1 h-4 rounded-full" 
                style={{ backgroundColor: d.color }}
              />
              <span className="font-mono text-xs text-brand-10/60 w-5 text-right">#{d.carNumber}</span>
              <span className="text-sm font-semibold truncate text-brand-10 drop-shadow-md">
                {d.name}
              </span>
            </div>
            
            <div className="flex items-center gap-2 pl-2">
              <span className="text-[10px] text-brand-10/40 w-8 text-right bg-brand-bg/50 rounded px-1">{d.irating}</span>
              <span className={`font-mono text-xs font-bold w-12 text-right ${d.isPlayer ? 'text-brand-30' : d.gap > 0 ? 'text-accent-red' : 'text-accent-green'}`}>
                {d.isPlayer ? '0.0' : `${d.gap > 0 ? '+' : ''}${Math.abs(d.gap).toFixed(1)}`}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
