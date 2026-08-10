import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useLiveStore } from '../../store/useLiveStore';
import { Trophy, Shield } from 'lucide-react';

// Helper to convert iRacing decimal color to hex
const intToHexColor = (colorInt) => {
  if (colorInt === undefined || colorInt === null) return '#444444'; // default gray
  const hex = colorInt.toString(16).padStart(6, '0');
  return `#${hex}`;
};

// Calculate relative luminance to determine if text should be black or white
const getContrastYIQ = (hexcolor) => {
  if (!hexcolor) return '#ffffff';
  hexcolor = hexcolor.replace('#', '');
  const r = parseInt(hexcolor.substr(0, 2), 16);
  const g = parseInt(hexcolor.substr(2, 2), 16);
  const b = parseInt(hexcolor.substr(4, 2), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#18181b' : '#ffffff'; // Dark text for bright bg, light for dark bg
};

// Premium License Colors (kapps/racelab style)
const getLicenseTheme = (licLevel, licString) => {
  const letter = licString ? licString.trim().charAt(0).toUpperCase() : '';
  
  if (letter === 'R' || licLevel === 1) return { bg: '#ef4444', text: '#ffffff' }; // Red
  if (letter === 'D' || licLevel === 2) return { bg: '#f97316', text: '#ffffff' }; // Orange
  if (letter === 'C' || licLevel === 3) return { bg: '#eab308', text: '#18181b' }; // Yellow
  if (letter === 'B' || licLevel === 4) return { bg: '#22c55e', text: '#18181b' }; // Green
  if (letter === 'A' || licLevel === 5) return { bg: '#3b82f6', text: '#ffffff' }; // Blue
  if (letter === 'P' || licLevel >= 6) return { bg: '#18181b', text: '#ffffff', border: '#3f3f46' }; // Pro Black
  
  return { bg: '#444444', text: '#ffffff' };
};

export const LiveStandings = () => {
  const [standings, setStandings] = useState([]);
  const columns = useAppStore(state => state.standingsColumns);

  useEffect(() => {
    let lastUpdateTime = 0;

    const unsubscribe = useLiveStore.subscribe((state) => {
      const now = performance.now();
      // Throttle updates to 1Hz (1000ms) to save CPU rendering
      if (now - lastUpdateTime < 1000) return;
      lastUpdateTime = now;

      const latestData = state.liveLapData[state.liveLapData.length - 1];
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
            pct: gridData.LapDistPct || 0,
            lap: gridData.Lap || 0,
            lastLapTime: gridData.LastLapTime || -1,
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
    return (
      <div className="flex-1 min-h-[200px] flex items-center justify-center border border-brand-60/40 rounded-xl bg-brand-60/10 text-brand-10/40 text-xs mt-4">
        Waiting for grid data...
      </div>
    );
  }

  return (
    <div className="flex flex-col mt-4 border border-brand-60/60 rounded-xl bg-brand-bg shadow-xl overflow-hidden min-h-[200px] max-h-[350px]">
      <div className="flex items-center gap-2 bg-brand-60/40 border-b border-brand-60 p-3 flex-none">
        <Trophy size={16} className="text-yellow-500" />
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-brand-10/90 m-0">Live Standings</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-brand-60/95 backdrop-blur-md z-10 shadow-sm">
            <tr>
              {columns.pos && <th className="py-2.5 px-4 text-[10px] font-bold text-brand-10/60 uppercase tracking-wider w-12 text-center">POS</th>}
              {columns.driver && <th className="py-2.5 px-4 text-[10px] font-bold text-brand-10/60 uppercase tracking-wider">Driver</th>}
              {columns.carName && <th className="py-2.5 px-4 text-[10px] font-bold text-brand-10/60 uppercase tracking-wider text-center">Car</th>}
              {columns.carClass && <th className="py-2.5 px-4 text-[10px] font-bold text-brand-10/60 uppercase tracking-wider text-center">Class</th>}
              {columns.srating && <th className="py-2.5 px-4 text-[10px] font-bold text-brand-10/60 uppercase tracking-wider text-center">SR</th>}
              {columns.irating && <th className="py-2.5 px-4 text-[10px] font-bold text-brand-10/60 uppercase tracking-wider text-right">iRating</th>}
              {columns.lastLap && <th className="py-2.5 px-4 text-[10px] font-bold text-brand-10/60 uppercase tracking-wider text-right">Last Lap</th>}
              {columns.trackPct && <th className="py-2.5 px-4 text-[10px] font-bold text-brand-10/60 uppercase tracking-wider text-right">Track %</th>}
            </tr>
          </thead>
          <tbody className="text-xs font-mono">
            {standings.map((driver) => {
              const classBgColor = intToHexColor(driver.CarClassColor);
              const classTextColor = getContrastYIQ(classBgColor);
              const licTheme = getLicenseTheme(driver.LicLevel, driver.LicString);
              const isPaceCar = driver.IsPaceCar || driver.IsSpectator;
              const isPlayer = driver.isPlayer;

              return (
                <tr 
                  key={driver.CarIdx} 
                  className={`border-b transition-colors ${
                    isPaceCar ? 'opacity-50 border-brand-60/20' : 
                    isPlayer ? 'bg-brand-30/5 hover:bg-brand-30/10 border-brand-60/40' : 
                    'border-brand-60/20 hover:bg-brand-60/30'
                  }`}
                >
                  {columns.pos && (
                    <td className={`py-2 px-4 text-center font-bold ${isPlayer ? 'text-brand-30 border-l-2 border-brand-30' : 'text-brand-10/90'}`}>
                      {driver.pos > 0 ? driver.pos : '-'}
                    </td>
                  )}
                  {columns.driver && (
                    <td className="py-2 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-sans truncate max-w-[150px] ${isPlayer ? 'font-black text-brand-10' : 'font-semibold text-brand-10'}`}>
                          {driver.UserName || 'Unknown'}
                        </span>
                      </div>
                    </td>
                  )}
                  {columns.carName && (
                    <td className="py-2 px-4 text-center">
                      <span className="text-[10px] text-brand-10/80 truncate max-w-[120px] inline-block" title={driver.CarScreenName || driver.CarScreenNameShort || driver.CarPath}>
                        {driver.CarScreenNameShort || driver.CarScreenName || driver.CarPath || 'Unknown'}
                      </span>
                    </td>
                  )}
                  {columns.carClass && (
                    <td className="py-2 px-4">
                      <div className="flex justify-center items-center">
                        <div 
                          className="px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider shadow-inner whitespace-nowrap min-w-[4ch] text-center"
                          style={{ 
                            backgroundColor: classBgColor, 
                            color: classTextColor,
                            boxShadow: `inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -1px 2px rgba(0,0,0,0.2)`
                          }}
                          title={driver.CarClassShortName}
                        >
                          {driver.CarClassShortName || 'CAR'}
                        </div>
                      </div>
                    </td>
                  )}
                  {columns.srating && (
                    <td className="py-2 px-4">
                      <div className="flex justify-center items-center">
                        <div 
                          className="px-2 py-0.5 rounded text-[10px] font-bold shadow-inner whitespace-nowrap min-w-[4ch] text-center"
                          style={{ 
                            backgroundColor: licTheme.bg,
                            color: licTheme.text,
                            border: licTheme.border ? `1px solid ${licTheme.border}` : '1px solid transparent',
                            boxShadow: licTheme.border ? 'none' : `inset 0 1px 2px rgba(255,255,255,0.3)`
                          }}
                        >
                          {driver.LicString || (driver.LicLevel ? `L${driver.LicLevel}` : '-')}
                        </div>
                      </div>
                    </td>
                  )}
                  {columns.irating && (
                    <td className="py-2 px-4 text-right text-brand-30 font-semibold">
                      {driver.IRating > 0 ? driver.IRating : '-'}
                    </td>
                  )}
                  {columns.lastLap && (
                    <td className="py-2 px-4 text-right text-brand-10/80 font-mono text-[10px]">
                      {driver.lastLapTime > 0 ? driver.lastLapTime.toFixed(3) : '-'}
                    </td>
                  )}
                  {columns.trackPct && (
                    <td className="py-2 px-4 text-right text-brand-10/70">
                      {driver.trackSurface === -1 ? (
                        <span className="text-brand-10/30 font-sans text-[10px]">OUT</span>
                      ) : (driver.onPitRoad === 1 || driver.trackSurface === 1 || driver.trackSurface === 2) ? (
                        <span className="text-amber-400/80 font-sans text-[10px]">PIT</span>
                      ) : (
                        <>{(driver.pct * 100).toFixed(1)}%</>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
