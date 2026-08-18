import React, { useState } from 'react';
import { Power, Settings, ChevronDown, ChevronUp, Lock, Unlock } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { SliderControl } from './SliderControl';
import { ColumnToggles } from './ColumnToggles';
import { Toggle } from './Toggle';

export function WidgetCard({ config }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Localized state subscription: only updates when THIS widget's state changes
  const state = useAppStore(state => state.overlays[config.id]) || { enabled: false, clickThrough: false, scale: 1.0 };
  const toggleOverlay = useAppStore(state => state.toggleOverlay);
  const updateOverlaySetting = useAppStore(state => state.updateOverlaySetting);
  
  // Defaults based on widget type
  const isPitOrRadar = config.id === 'pit' || config.id === 'radar';
  const defaultInactive = isPitOrRadar ? 0.0 : 0.5;
  
  const scale = state.scale || 1.0;
  const widgetOpacity = state.widgetOpacity ?? 1.0;
  const bgOpacity = state.bgOpacity ?? 0.6;
  const inactiveOpacity = state.inactiveOpacity ?? defaultInactive;

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
          <SliderControl 
            label="Scale" value={scale} min={0.5} max={2.0} 
            onChange={(v) => updateOverlaySetting(config.id, { scale: v })} 
          />
          <SliderControl 
            label="Widget Opacity" value={widgetOpacity} min={0.0} max={1.0} 
            onChange={(v) => updateOverlaySetting(config.id, { widgetOpacity: v })} 
          />
          <SliderControl 
            label="Inactive Opacity" value={inactiveOpacity} min={0.0} max={1.0} 
            onChange={(v) => updateOverlaySetting(config.id, { inactiveOpacity: v })} 
          />
          <SliderControl 
            label="BG Opacity" value={bgOpacity} min={0.0} max={1.0} 
            onChange={(v) => updateOverlaySetting(config.id, { bgOpacity: v })} 
          />
          {config.id === 'inputs' && (
            <SliderControl 
              label="Trace Range" value={state.traceRange ?? 5.0} min={5.0} max={30.0} step={1.0}
              onChange={(v) => updateOverlaySetting(config.id, { traceRange: v })} 
              formatter={(v) => v.toFixed(1) + 's'}
            />
          )}
          
          {config.id === 'standings' && (
            <>
              <Toggle
                label="Group by class"
                checked={state.groupByClass}
                onChange={(v) => updateOverlaySetting(config.id, { groupByClass: v })}
              />
              <Toggle
                label="Class name"
                checked={state.showClassName}
                onChange={(v) => updateOverlaySetting(config.id, { showClassName: v })}
              />
            </>
          )}
          
          <ColumnToggles 
            configId={config.id} 
            currentColumns={state.columns} 
            onChange={(cols) => updateOverlaySetting(config.id, { columns: cols })} 
          />
        </div>
      )}
    </div>
  );
}
