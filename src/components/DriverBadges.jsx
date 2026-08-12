import React from 'react';
import { intToHexColor, getContrastYIQ, getLicenseTheme } from '../utils/colorUtils';

export function ClassBadge({ colorInt, shortName }) {
  const classBgColor = intToHexColor(colorInt);
  
  return (
    <div className="flex justify-center items-center">
      <div 
        className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider whitespace-nowrap min-w-[4ch] bg-[#1e1e24] border border-brand-60/40 shadow-sm"
        title={shortName}
      >
        <div 
          className="w-2 h-2 rounded-full" 
          style={{ 
            backgroundColor: classBgColor,
            boxShadow: `0 0 5px ${classBgColor}`
          }} 
        />
        <span className="text-white drop-shadow-sm">{shortName || 'CAR'}</span>
      </div>
    </div>
  );
}

export function SafetyRatingBadge({ licLevel, licString }) {
  const licTheme = getLicenseTheme(licLevel, licString);
  const str = licString || (licLevel ? `L${licLevel}` : '-');
  const parts = str.split(' ');
  const letter = parts[0];
  let num = parts.slice(1).join(' ');
  
  if (num && !isNaN(parseFloat(num))) {
    num = parseFloat(num).toFixed(1);
  }
  
  return (
    <div className="flex justify-center items-center">
      <div 
        className="flex rounded overflow-hidden shadow-sm"
        style={{ 
          backgroundColor: licTheme.bg,
          color: licTheme.text
        }}
      >
        <div 
          className={`pl-1.5 ${num ? 'pr-4' : 'pr-1.5'} py-0.5 text-[10px] font-black relative z-0`}
          style={{
            backgroundColor: 'rgba(0,0,0,0.15)',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)'
          }}
        >
          {letter}
        </div>
        {num && (
          <div style={{ filter: 'drop-shadow(-2px 0px 1.5px rgba(0,0,0,0.4))' }} className="z-10 -ml-3">
            <div 
              className="pr-1.5 pl-2 py-0.5 text-[10px] font-bold h-full" 
              style={{ 
                backgroundColor: licTheme.bg,
                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.2)',
                clipPath: 'polygon(5px 0, 100% 0, 100% 100%, 0 100%)'
              }}
            >
              {num}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
