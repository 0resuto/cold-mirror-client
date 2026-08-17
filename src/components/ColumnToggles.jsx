import React from 'react';

const defaultStandingsColumns = { pos: true, num: true, driver: true, carName: false, carClass: true, classPos: true, srating: true, irating: true, gap: true, bestLap: false, lastLap: true, trackPct: false, laps: false };
const standingsColLabels = { pos: 'POS', num: '#', driver: 'Driver', carName: 'Car', carClass: 'Class', classPos: 'C.POS', srating: 'SR', irating: 'iRating', gap: 'Gap', bestLap: 'Best Lap', lastLap: 'Last Lap', trackPct: 'Track %', laps: 'Laps' };

const defaultRelativeColumns = { classBadge: true, num: true, driver: true, irating: true, srating: true };
const relativeColLabels = { classBadge: 'Class', num: '#', driver: 'Driver', irating: 'iRating', srating: 'SR' };

export function ColumnToggles({ configId, currentColumns, onChange }) {
  if (configId !== 'standings' && configId !== 'relative') return null;

  const defaultCols = configId === 'standings' ? defaultStandingsColumns : defaultRelativeColumns;
  const labels = configId === 'standings' ? standingsColLabels : relativeColLabels;

  return (
    <div className="flex flex-col gap-2 border-t border-brand-60/20 pt-3 mt-1">
      <span className="text-[10px] whitespace-nowrap font-bold text-brand-10/60 uppercase">Visible Columns:</span>
      <div className="flex flex-wrap gap-2">
        {Object.keys(defaultCols).map(col => {
          const isActive = currentColumns ? (currentColumns[col] ?? defaultCols[col]) : defaultCols[col];
          return (
            <button 
              key={col}
              onClick={() => {
                const updatedCols = currentColumns || defaultCols;
                onChange({ ...updatedCols, [col]: !isActive });
              }}
              className={`px-2 py-1 rounded text-[10px] font-semibold transition-all border ${isActive ? 'bg-brand-30/10 text-brand-30 border-brand-30/30' : 'bg-brand-60/10 text-brand-10/40 border-brand-60/20 hover:bg-brand-60/30 hover:text-brand-10/80'}`}
            >
              {labels[col] || col}
            </button>
          );
        })}
      </div>
    </div>
  );
}
