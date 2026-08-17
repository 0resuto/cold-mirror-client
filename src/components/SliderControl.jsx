import React from 'react';

const getSliderFill = (val, min, max) => {
  const pct = ((val - min) / (max - min)) * 100;
  return `linear-gradient(to right, #e63946 ${pct}%, rgba(255,255,255,0.1) ${pct}%)`;
};

export function SliderControl({ label, value, min, max, step = 0.05, onChange, formatter = (v) => Math.round(v * 100) + '%' }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] whitespace-nowrap font-bold text-brand-10/60 uppercase w-28">{label}:</span>
      <input 
        type="range" 
        min={min} 
        max={max} 
        step={step} 
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 max-w-[150px] min-w-[80px] h-1 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-brand-30 [&::-webkit-slider-thumb]:rounded-full"
        style={{ background: getSliderFill(value, min, max) }}
      />
      <span className="text-[10px] font-mono text-brand-10/40 w-8 text-right">{formatter(value)}</span>
    </div>
  );
}
