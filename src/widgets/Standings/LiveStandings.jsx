import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useLiveStore } from '../../store/useLiveStore';
import { Trophy, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { LoadingState } from '../../components/LoadingState';
import { ClassBadge, SafetyRatingBadge } from '../../components/DriverBadges';

const formatTime = (seconds) => {
  if (!seconds || seconds <= 0) return '-';
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3).padStart(6, '0');
  return mins > 0 ? `${mins}:${secs}` : secs;
};

export const LiveStandings = () => {
  const [standings, setStandings] = useState([]);
  
  const overlays = useAppStore(state => state.overlays);
  const config = overlays.standings || {};
  
  const defaultCols = { pos: true, num: true, driver: true, carName: false, carClass: true, classPos: true, srating: true, irating: true, gap: true, bestLap: false, lastLap: true, trackPct: false, laps: false };
  const columns = config.columns || defaultCols;

  useEffect(() => {
    if (!window.electronAPI) return;

    let lastUpdateTime = 0;
    const unsubscribe = useLiveStore.subscribe((state) => {
      if (!state.latestTelemetry) {
        setStandings([]);
        useAppStore.getState().setWidgetActive('standings', false);
        return;
      }
      
      const now = Date.now();
      if (now - lastUpdateTime < 250) return; // 4Hz throttle
      lastUpdateTime = now;

      const latestData = state.latestTelemetry;
      if (!latestData) return;
      
      useAppStore.getState().setWidgetActive('standings', latestData.Speed > 1);
      const grid = latestData?.grid || {};
      const sessionDrivers = state.sessionDrivers || [];
      const playerName = latestData?.player_name || '';

      if (Object.keys(grid).length === 0 || sessionDrivers.length === 0) return;

      const merged = [];
      for (const driver of sessionDrivers) {
        const idx = driver.CarIdx?.toString();
        const gridData = grid[idx];
        
        // Only show active cars in the grid
        if (gridData) {
          merged.push({
            ...driver,
            pos: gridData.Position || 0,
            classPos: gridData.ClassPosition || 0,
            num: driver.CarNumberRaw || driver.CarNumber || '0',
            pct: gridData.LapDistPct || 0,
            lap: gridData.Lap || 0,
            lastLapTime: gridData.LastLapTime || -1,
            bestLapTime: gridData.BestLapTime || -1,
            f2Time: gridData.F2Time || -1,
            trackSurface: gridData.TrackSurface,
            onPitRoad: gridData.OnPitRoad,
            isPlayer: driver.UserName === playerName
          });
        }
      }

      // Sort by position (ignoring 0 which is usually invalid/spectator)
      merged.sort((a, b) => {
        if (a.pos === 0) return 1;
        if (b.pos === 0) return -1;
        return a.pos - b.pos;
      });

      setStandings(merged);
    });

    return () => unsubscribe();
  }, []);

  if (standings.length === 0) {
    return <LoadingState message="Waiting for Standings Data" />;
  }

  const isLocked = config.clickThrough;

  return (
    <div className={`flex flex-col w-full h-full rounded-xl overflow-hidden transition-all duration-300 ${
      isLocked ? 'bg-transparent border-transparent' : 'bg-brand-bg/60 border border-brand-60/60 shadow-xl backdrop-blur-sm'
    }`}>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className={`sticky top-0 z-10 shadow-sm transition-colors ${isLocked ? 'bg-brand-60/95 backdrop-blur-md' : 'bg-brand-60/80'}`}>
            <tr>
              {columns.pos && <th className="py-1 px-3 text-[10px] font-bold text-brand-10/60 uppercase tracking-wider w-8 text-center">POS</th>}
              {columns.classPos && <th className="py-1 px-3 text-[10px] font-bold text-brand-10/60 uppercase tracking-wider w-8 text-center" title="Class Position">C.POS</th>}
              {columns.num && <th className="py-1 px-3 text-[10px] font-bold text-brand-10/60 uppercase tracking-wider w-8 text-center">#</th>}
              {columns.driver && <th className="py-1 px-3 text-[10px] font-bold text-brand-10/60 uppercase tracking-wider w-full min-w-[120px]">Driver</th>}
              {columns.carName && <th className="py-1 px-3 text-[10px] font-bold text-brand-10/60 uppercase tracking-wider w-24 text-center">Car</th>}
              {columns.carClass && <th className="py-1 px-3 text-[10px] font-bold text-brand-10/60 uppercase tracking-wider w-12 text-center">Class</th>}
              {columns.srating && <th className="py-1 px-3 text-[10px] font-bold text-brand-10/60 uppercase tracking-wider w-14 text-center">SR</th>}
              {columns.irating && <th className="py-1 px-3 text-[10px] font-bold text-brand-10/60 uppercase tracking-wider w-14 text-right">iRating</th>}
              {columns.gap && <th className="py-1 px-3 text-[10px] font-bold text-brand-10/60 uppercase tracking-wider w-12 text-right">Gap</th>}
              {columns.bestLap && <th className="py-1 px-3 text-[10px] font-bold text-brand-10/60 uppercase tracking-wider w-16 text-right">Best Lap</th>}
              {columns.lastLap && <th className="py-1 px-3 text-[10px] font-bold text-brand-10/60 uppercase tracking-wider w-16 text-right">Last Lap</th>}
              {columns.laps && <th className="py-1 px-3 text-[10px] font-bold text-brand-10/60 uppercase tracking-wider w-10 text-right">Laps</th>}
              {columns.trackPct && <th className="py-1 px-3 text-[10px] font-bold text-brand-10/60 uppercase tracking-wider w-12 text-right">Track %</th>}
            </tr>
          </thead>
          <tbody className="text-xs font-mono">
            {standings.map((driver) => {
              const isPaceCar = driver.IsPaceCar || driver.IsSpectator;
              const isPlayer = driver.isPlayer;

              return (
                <motion.tr 
                  layout
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  key={driver.CarIdx} 
                  className={`border-b transition-colors ${
                    isPaceCar ? 'opacity-50 border-brand-60/20 bg-brand-bg' : 
                    isPlayer ? 'bg-brand-bg bg-gradient-to-r from-white/20 to-white/5 border-white/30 shadow-[0_3px_8px_rgba(0,0,0,0.4),0_1px_0_#2b2d34,0_-1px_0_#2b2d34,inset_0_1px_0_rgba(255,255,255,0.15)] relative z-20' : 
                    'bg-brand-bg border-brand-60/20 hover:bg-brand-60/30'
                  }`}
                >
                  {columns.pos && (
                    <td className={`py-1 px-3 text-center font-bold border-l-4 ${isPlayer ? 'text-white border-white/40 bg-white/5' : 'text-brand-10/90 border-transparent'}`}>
                      {driver.pos > 0 ? driver.pos : '-'}
                    </td>
                  )}
                  {columns.classPos && (
                    <td className={`py-1 px-3 text-center font-semibold ${isPlayer ? 'text-white' : 'text-brand-10/70'}`}>
                      {driver.classPos > 0 ? driver.classPos : '-'}
                    </td>
                  )}
                  {columns.num && (
                    <td className={`py-1 px-3 text-center font-bold italic ${isPlayer ? 'text-white' : 'text-brand-30'}`}>
                      {driver.num}
                    </td>
                  )}
                  {columns.driver && (
                    <td className="py-1 px-3">
                      <div className="flex items-center gap-2">
                        <span className={`font-sans truncate max-w-[150px] ${isPlayer ? 'font-black text-white text-[13px] drop-shadow-md' : 'font-semibold text-brand-10'}`}>
                          {driver.UserName || 'Unknown'}
                        </span>
                      </div>
                    </td>
                  )}
                  {columns.carName && (
                    <td className="py-1 px-3 text-center">
                      <span className={`text-[10px] truncate max-w-[120px] inline-block ${isPlayer ? 'text-brand-10' : 'text-brand-10/80'}`} title={driver.CarScreenName || driver.CarScreenNameShort || driver.CarPath}>
                        {driver.CarScreenNameShort || driver.CarScreenName || driver.CarPath || 'Unknown'}
                      </span>
                    </td>
                  )}
                  {columns.carClass && (
                    <td className="py-1 px-3">
                      <ClassBadge colorInt={driver.CarClassColor} shortName={driver.CarClassShortName} />
                    </td>
                  )}
                  {columns.srating && (
                    <td className="py-1 px-3">
                      <SafetyRatingBadge licLevel={driver.LicLevel} licString={driver.LicString} />
                    </td>
                  )}
                  {columns.irating && (
                    <td className={`py-1 px-3 text-right font-semibold ${isPlayer ? 'text-brand-30' : 'text-brand-30'}`}>
                      {driver.IRating > 0 ? driver.IRating : '-'}
                    </td>
                  )}
                  {columns.gap && (
                    <td className={`py-1 px-3 text-right font-mono text-[10px] ${isPlayer ? 'text-white font-bold' : 'text-amber-400'}`}>
                      {driver.f2Time > 0 ? `+${driver.f2Time.toFixed(1)}` : '-'}
                    </td>
                  )}
                  {columns.bestLap && (
                    <td className={`py-1 px-3 text-right font-mono text-[10px] ${isPlayer ? 'text-white' : 'text-brand-10/90'}`}>
                      {formatTime(driver.bestLapTime)}
                    </td>
                  )}
                  {columns.lastLap && (
                    <td className={`py-1 px-3 text-right font-mono text-[10px] ${isPlayer ? 'text-white' : 'text-brand-10/70'}`}>
                      {formatTime(driver.lastLapTime)}
                    </td>
                  )}
                  {columns.laps && (
                    <td className={`py-1 px-3 text-right font-mono ${isPlayer ? 'text-white' : 'text-brand-10/70'}`}>
                      {driver.lap}
                    </td>
                  )}
                  {columns.trackPct && (
                    <td className={`py-1 px-3 text-right ${isPlayer ? 'text-white' : 'text-brand-10/50'}`}>
                      {driver.trackSurface === -1 ? (
                        <span className="text-brand-10/30 font-sans text-[10px]">OUT</span>
                      ) : (driver.onPitRoad === 1 || driver.trackSurface === 1 || driver.trackSurface === 2) ? (
                        <span className="text-amber-400/80 font-sans text-[10px]">PIT</span>
                      ) : (
                        <>{(driver.pct * 100).toFixed(1)}%</>
                      )}
                    </td>
                  )}
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
