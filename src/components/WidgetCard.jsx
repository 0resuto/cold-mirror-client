import React, { useState } from 'react';
import { Power, Settings, ChevronDown, ChevronUp, Lock, Unlock } from 'lucide-react';

const getSliderFill = (val, min, max) => {
  const pct = ((val - min) / (max - min)) * 100;
  return `linear-gradient(to right, #e63946 ${pct}%, rgba(255,255,255,0.1) ${pct}%)`;
};

const defaultStandingsColumns = { pos: true, num: true, driver: true, carName: false, carClass: true, classPos: true, srating: true, irating: true, gap: true, bestLap: false, lastLap: true, trackPct: false, laps: false };
const standingsColLabels = { pos: 'POS', num: '#', driver: 'Driver', carName: 'Car', carClass: 'Class', classPos: 'C.POS', srating: 'SR', irating: 'iRating', gap: 'Gap', bestLap: 'Best Lap', lastLap: 'Last Lap', trackPct: 'Track %', laps: 'Laps' };

const defaultRelativeColumns = { classBadge: true, num: true, driver: true, irating: true, srating: true };
const relativeColLabels = { classBadge: 'Class', num: '#', driver: 'Driver', irating: 'iRating', srating: 'SR' };

export function WidgetCard({ config, overlays, toggleOverlay, updateOverlaySetting }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const state = overlays[config.id] || { enabled: false, clickThrough: false, scale: 1.0 };
  
  // Defaults based on widget type
  const isPitOrRadar = config.id === 'pit' || config.id === 'radar';
  const defaultInactive = isPitOrRadar ? 0.0 : 0.5;
  
  const scale = state.scale || 1.0;
  const widgetOpacity = state.widgetOpacity ?? 1.0;
  const bgOpacity = state.bgOpacity ?? 0.6;
  const inactiveOpacity = state.inactiveOpacity ?? defaultInactive;

  const renderSlider = (label, key, val, min, max, formatter = (v) => Math.round(v * 100) + '%') => (
    <div className="flex items-center gap-3">
      <span className="text-[10px] whitespace-nowrap font-bold text-brand-10/60 uppercase w-28">{label}:</span>
      <input 
        type="range" min={min} max={max} step="0.05" 
        value={val}
        onChange={(e) => updateOverlaySetting(config.id, { [key]: parseFloat(e.target.value) })}
        className="flex-1 max-w-[150px] min-w-[80px] h-1 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-brand-30 [&::-webkit-slider-thumb]:rounded-full"
        style={{ background: getSliderFill(val, min, max) }}
      />
      <span className="text-[10px] font-mono text-brand-10/40 w-8 text-right">{formatter(val)}</span>
    </div>
  );

  return (
    <div className="bg-brand-60/10 border border-brand-60/30 rounded-xl flex flex-col transition-colors hover:border-brand-60/50 overflow-hidden">
      {/* Header (Always Visible) */}
      <div className="p-4 flex items-center justify-between">
        <div 
          className="flex-1 cursor-pointer select-none" 
          onClick={() => setIsExpanded(!isExpanded)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsExpanded(!isExpanded);
            }
          }}
        >
          <h3 className="font-bold text-lg flex items-center gap-2">
            {config.name}
            {isExpanded ? <ChevronUp size={16} className="text-brand-60" /> : <ChevronDown size={16} className="text-brand-60" />}
          </h3>
          <p className="text-xs text-brand-10/50 mt-1">{config.description}</p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Click-Through Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              updateOverlaySetting(config.id, { clickThrough: !state.clickThrough });
            }}
            className={`p-2 rounded-full transition-colors ${
              state.clickThrough 
                ? 'bg-brand-30/20 text-brand-30' 
                : 'text-brand-10/40 hover:bg-brand-60/40 hover:text-brand-10'
            }`}
            title={state.clickThrough ? 'Locked (ignores mouse)' : 'Unlocked (interactive)'}
          >
            {state.clickThrough ? <Lock size={16} /> : <Unlock size={16} />}
          </button>

          {/* Settings Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className={`p-2 rounded-full transition-colors ${isExpanded ? 'bg-brand-60/40 text-brand-10' : 'text-brand-60 hover:bg-brand-60/20 hover:text-brand-10'}`}
          >
            <Settings size={18} />
          </button>

          {/* Power Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleOverlay(config.id);
            }}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg ml-1 ${
              state.enabled 
                ? 'bg-brand-30 text-white shadow-[0_0_15px_rgba(234,88,12,0.4)]' 
                : 'bg-brand-60/30 text-brand-10/40 hover:bg-brand-60/50 hover:text-brand-10'
            }`}
          >
            <Power size={18} />
          </button>
        </div>
      </div>

      {/* Expanded Settings */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-3 border-t border-brand-60/20 flex flex-col gap-3 bg-black/20">
          {renderSlider('Scale', 'scale', scale, 0.5, 2.0)}
          {renderSlider('Widget Opacity', 'widgetOpacity', widgetOpacity, 0.0, 1.0)}
          {renderSlider('Inactive Opacity', 'inactiveOpacity', inactiveOpacity, 0.0, 1.0)}
          {renderSlider('BG Opacity', 'bgOpacity', bgOpacity, 0.0, 1.0)}
          {config.id === 'inputs' && renderSlider('Trace Range', 'traceRange', state.traceRange ?? 5.0, 5.0, 30.0, (v) => v.toFixed(1) + 's')}
          
          {(config.id === 'standings' || config.id === 'relative') && (() => {
            const defaultCols = config.id === 'standings' ? defaultStandingsColumns : defaultRelativeColumns;
            const labels = config.id === 'standings' ? standingsColLabels : relativeColLabels;
            return (
              <div className="flex flex-col gap-2 border-t border-brand-60/20 pt-3 mt-1">
                <span className="text-[10px] whitespace-nowrap font-bold text-brand-10/60 uppercase">Visible Columns:</span>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(defaultCols).map(col => {
                    const isActive = state.columns ? (state.columns[col] ?? defaultCols[col]) : defaultCols[col];
                    return (
                      <button 
                        key={col}
                        onClick={() => {
                          const currentCols = state.columns || defaultCols;
                          updateOverlaySetting(config.id, { columns: { ...currentCols, [col]: !isActive } });
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
          })()}
        </div>
      )}
    </div>
  );
}
