import React, { useEffect, useState } from 'react';
import { useLiveStore } from '../../store/useLiveStore';

const RADAR_RANGE_METERS = 12.5; // Zoomed in to show cars within 12.5 meters ahead/behind

export function LiveRadar() {
  const [radarState, setRadarState] = useState({
    carLeftRight: 0,
    nearbyCars: []
  });

  useEffect(() => {
    let lastUpdateTime = 0;
    
    const unsubscribe = useLiveStore.subscribe((state) => {
      const now = performance.now();
      if (now - lastUpdateTime < 33) return; // ~30Hz update rate
      lastUpdateTime = now;

      const latestData = state.liveLapData[state.liveLapData.length - 1];
      if (!latestData) return;

      const driverCarIdx = state.driverCarIdx;
      const trackLengthStr = state.trackLength || "4.00 km";
      // Extract number from "4.00 km" or "4000 m"
      let trackLengthMeters = 4000;
      if (trackLengthStr.includes('km')) {
        trackLengthMeters = parseFloat(trackLengthStr) * 1000;
      } else {
        trackLengthMeters = parseFloat(trackLengthStr);
      }

      const grid = latestData.grid || {};
      const player = grid[driverCarIdx];
      
      const nearbyCars = [];

      if (player) {
        Object.keys(grid).forEach(idx => {
          if (parseInt(idx) === driverCarIdx) return;
          
          const car = grid[idx];
          if (!car.LapDistPct && car.LapDistPct !== 0) return;

          let delta = car.LapDistPct - player.LapDistPct;
          
          // Handle start/finish line wrap-around
          if (delta > 0.5) delta -= 1;
          if (delta < -0.5) delta += 1;

          const distanceMeters = delta * trackLengthMeters;

          if (Math.abs(distanceMeters) <= RADAR_RANGE_METERS) {
            nearbyCars.push({
              id: idx,
              distance: distanceMeters,
              position: car.Position
            });
          }
        });
      }

      setRadarState({
        carLeftRight: latestData.CarLeftRight || 0,
        nearbyCars
      });
    });

    return () => unsubscribe();
  }, []);

  const { carLeftRight, nearbyCars } = radarState;

  const isLeft = carLeftRight === 2 || carLeftRight === 4 || carLeftRight === 5;
  const isRight = carLeftRight === 3 || carLeftRight === 4 || carLeftRight === 6;

  // Convert distance in meters to a Y percentage (-50% to 50%)
  const getYPos = (distanceMeters) => {
    const normalized = distanceMeters / RADAR_RANGE_METERS; // -1 to 1
    return 50 - (normalized * 50); // 0% to 100%
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden p-2">
      
      {/* Track Background Line */}
      <div className="absolute top-0 bottom-0 w-20 bg-brand-60/10 rounded-full"></div>
      
      {/* Distance Markers (just visual flair) */}
      <div className="absolute top-[25%] w-16 border-b border-brand-60/20"></div>
      <div className="absolute top-[75%] w-16 border-b border-brand-60/20"></div>

      {/* Central car indicator (Player) */}
      <div 
        className="w-10 bg-brand-30 rounded-md shadow-[0_0_15px_rgba(var(--brand-30-rgb),0.5)] border border-white/20 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-20"
        style={{ height: '20%' }} // 20% of 25m range = 5 meters exact
      >
        <span className="text-[9px] text-white font-black tracking-widest">YOU</span>
      </div>

      {/* Nearby Cars */}
      {nearbyCars.map(car => {
        const topPct = getYPos(car.distance);
        
        // Pseudo-logic for lateral position:
        let leftOffset = '50%';
        let translateX = '-50%';
        let isDanger = false;

        // Since cars are 20% height (5m), they visually touch at exactly 5m center-to-center
        if (Math.abs(car.distance) < 5) {
          if (isLeft) {
            leftOffset = '20%';
            isDanger = true;
          } else if (isRight) {
            leftOffset = '80%';
            isDanger = true;
          }
        } else {
          // Add a tiny random offset so cars don't perfectly overlap
          const hash = parseInt(car.id) % 3;
          if (hash === 1) leftOffset = '40%';
          if (hash === 2) leftOffset = '60%';
        }

        return (
          <div 
            key={car.id}
            className={`absolute w-9 rounded-md border flex items-center justify-center transition-all duration-75 z-10 ${
              isDanger 
                ? 'bg-red-500/80 border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.8)]' 
                : 'bg-white/20 border-white/30 backdrop-blur-sm'
            }`}
            style={{ 
              height: '20%', // 5 meters exact
              top: `${topPct}%`, 
              left: leftOffset,
              transform: `translate(${translateX}, -50%)`,
              opacity: 1 - Math.abs(car.distance) / (RADAR_RANGE_METERS * 1.2) // Fade out at edges
            }}
          >
            <span className="text-[10px] text-white font-bold opacity-80 pb-6">{car.position}</span>
          </div>
        );
      })}

      {/* Left Danger Zone Glow */}
      <div 
        className={`absolute left-0 top-0 bottom-0 w-12 transition-all duration-300 pointer-events-none ${
          isLeft ? 'bg-gradient-to-r from-red-500/40 to-transparent opacity-100' : 'opacity-0'
        }`}
      ></div>

      {/* Right Danger Zone Glow */}
      <div 
        className={`absolute right-0 top-0 bottom-0 w-12 transition-all duration-300 pointer-events-none ${
          isRight ? 'bg-gradient-to-l from-red-500/40 to-transparent opacity-100' : 'opacity-0'
        }`}
      ></div>
      
      {/* Header/Status */}
      <div className="absolute top-3 left-0 w-full flex justify-center z-30">
        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg transition-colors ${
          (isLeft || isRight) ? 'bg-red-500 text-white' : 'bg-brand-bg/80 text-brand-10/50 border border-brand-60/50'
        }`}>
          {(isLeft || isRight) ? 'BLIND SPOT' : 'CLEAR'}
        </span>
      </div>
    </div>
  );
}

