import React, { useEffect, useState, useRef } from 'react';
import { useLiveStore } from '../../store/useLiveStore';
import { useAppStore } from '../../store/useAppStore';
import { LoadingState } from '../../components/LoadingState';
import { Gamepad2 } from 'lucide-react';

const MAX_HISTORY = 90; // 3 seconds at 30Hz

export function LiveInputs() {
  const [inputs, setInputs] = useState({
    throttle: 0,
    brake: 0,
    clutch: 0,
    steering: 0,
    gear: 0,
    speed: 0
  });

  const historyRef = useRef([]);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    let lastUpdateTime = 0;

    const unsubscribe = useLiveStore.subscribe((state) => {
      const now = performance.now();
      // Inputs need to be very smooth, ~30Hz or 60Hz. We'll use 33ms (30fps).
      if (now - lastUpdateTime < 33) return;
      lastUpdateTime = now;

      const latestData = state.latestTelemetry;
      if (!latestData) {
        setHasData(false);
        return;
      }
      setHasData(true);

      useAppStore.getState().setWidgetActive('inputs', latestData.Speed > 1);

      const newInputs = {
        throttle: latestData.Throttle || 0,
        brake: latestData.Brake || 0,
        clutch: latestData.Clutch !== undefined ? (1 - latestData.Clutch) : 0, // iRacing clutch is inverted
        steering: latestData.SteeringWheelAngle || 0, // rad
        gear: latestData.Gear || 0,
        speed: latestData.Speed || 0
      };

      setInputs(newInputs);

      // Normalize steering for the trace (assume +/- 180 degrees is the main visible range)
      // 0 degrees = 0.5 (center)
      const steerDeg = newInputs.steering * (180 / Math.PI);
      let normalizedSteering = 0.5 + (steerDeg / 360);
      normalizedSteering = Math.max(0, Math.min(1, normalizedSteering)); // Clamp 0 to 1

      // Add to trace history
      historyRef.current.push({
        t: newInputs.throttle,
        b: newInputs.brake,
        c: newInputs.clutch,
        s: normalizedSteering
      });

      if (historyRef.current.length > MAX_HISTORY) {
        historyRef.current.shift();
      }
      
      // We clone the array so React detects the state change
      setHistory([...historyRef.current]);
    });

    return () => unsubscribe();
  }, []);

  // Format gear
  const displayGear = inputs.gear === 0 ? 'N' : inputs.gear === -1 ? 'R' : inputs.gear.toString();

  // Steering rotation (rad to deg)
  const steerDeg = inputs.steering * (180 / Math.PI);

  // Generate SVG points for polyline
  const generatePath = (key, height) => {
    if (history.length === 0) return '';
    const stepX = 100 / (MAX_HISTORY - 1);
    
    return history.map((point, index) => {
      const x = index * stepX;
      // In SVG, Y=0 is the top, so we invert it
      const y = height - (point[key] * height);
      return `${x},${y}`;
    }).join(' ');
  };

  if (!hasData) {
    return <LoadingState message="Waiting for Inputs" />;
  }

  return (
    <div className="flex flex-col h-full w-full font-sans overflow-hidden">
      <style>{`
        .adaptive-col { flex-direction: column; }
        @media (max-height: 160px) {
          .adaptive-col { flex-direction: row; gap: 1.5rem; justify-content: center; }
        }
      `}</style>
      <div className="flex-1 flex p-2 gap-2">
        
        {/* Left column: Gear & Speed */}
        <div className="adaptive-col flex items-center justify-around min-w-[64px] bg-brand-60/20 rounded-lg p-2 border border-brand-60/30 shrink-0">
          <div className="flex flex-col items-center">
            <span className={`text-5xl font-mono font-black leading-none drop-shadow-md ${inputs.gear <= 0 ? 'text-red-500' : 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]'}`}>
              {displayGear}
            </span>
          </div>

          <div className="flex flex-col items-center mt-2 lg:mt-0">
            <span className="text-lg font-mono font-bold text-brand-10/90 leading-none inline-block w-10 text-center">
              {Math.round(inputs.speed)}
            </span>
            <span className="text-[8px] text-brand-10/40 uppercase tracking-widest mt-1">km/h</span>
          </div>
        </div>

        {/* Center column: Live Pedals */}
        <div className="flex gap-[1px] h-full py-1 shrink-0 px-1">
          {/* Clutch */}
          <div className="flex flex-col items-center h-full w-2.5 justify-end">
            <div className="w-full bg-brand-60/30 rounded-t-sm flex-1 relative overflow-hidden flex items-end">
              <div 
                className="w-full bg-blue-500 transition-all shadow-[0_0_8px_rgba(59,130,246,0.6)]"
                style={{ height: `${inputs.clutch * 100}%`, transitionDuration: '33ms' }}
              />
            </div>
            <span className="text-[7px] font-bold text-blue-400/80 mt-1">C</span>
          </div>
          {/* Brake */}
          <div className="flex flex-col items-center h-full w-2.5 justify-end">
            <div className="w-full bg-brand-60/30 rounded-t-sm flex-1 relative overflow-hidden flex items-end">
              <div 
                className="w-full bg-red-500 transition-all shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                style={{ height: `${inputs.brake * 100}%`, transitionDuration: '33ms' }}
              />
            </div>
            <span className="text-[7px] font-bold text-red-400/80 mt-1">B</span>
          </div>
          {/* Throttle */}
          <div className="flex flex-col items-center h-full w-2.5 justify-end">
            <div className="w-full bg-brand-60/30 rounded-t-sm flex-1 relative overflow-hidden flex items-end">
              <div 
                className="w-full bg-green-500 transition-all shadow-[0_0_8px_rgba(34,197,94,0.6)]"
                style={{ height: `${inputs.throttle * 100}%`, transitionDuration: '33ms' }}
              />
            </div>
            <span className="text-[7px] font-bold text-green-400/80 mt-1">T</span>
          </div>
        </div>

        {/* Right column: Trace Graph */}
        <div className="flex-1 bg-black/40 rounded-lg relative overflow-hidden border border-brand-60/30 ml-1">
          {/* Background grid */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none py-3 opacity-20">
            <div className="w-full border-b border-brand-60 border-dashed"></div>
            <div className="w-full border-b border-brand-60 border-dashed"></div>
            <div className="w-full border-b border-brand-60 border-dashed"></div>
          </div>
          
          {/* Center line specifically for steering */}
          <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/10 pointer-events-none -translate-y-1/2"></div>
          
          <svg 
            className="absolute inset-0 w-full h-full overflow-visible"
            preserveAspectRatio="none"
            viewBox="0 0 100 100" 
          >
            {/* Steering Trace (Gray) */}
            <polyline
              points={generatePath('s', 100)}
              fill="none"
              stroke="rgba(156,163,175, 0.5)" /* Tailwind gray-400 */
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
            {/* Clutch Trace */}
            <polyline
              points={generatePath('c', 100)}
              fill="none"
              stroke="rgba(59,130,246, 0.4)"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
            {/* Brake Trace */}
            <polyline
              points={generatePath('b', 100)}
              fill="none"
              stroke="rgba(239,68,68, 0.8)"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
            {/* Throttle Trace */}
            <polyline
              points={generatePath('t', 100)}
              fill="none"
              stroke="rgba(34,197,94, 0.8)"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>

        {/* Far Right: Steering Wheel */}
        <div className="flex flex-col items-center justify-center w-14 bg-brand-60/20 rounded-lg p-2 border border-brand-60/30 shrink-0">
          <div className="w-10 h-10 border-2 border-brand-60/50 rounded-full flex items-center justify-center">
            {/* Steering wheel visualizer */}
            <div 
              className="w-8 h-[2px] bg-brand-10/80 rounded-full shadow-lg relative"
              style={{ transform: `rotate(${steerDeg}deg)`, transition: 'transform 50ms linear' }}
            >
               <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-[2px] h-3 bg-brand-primary rounded-sm shadow-[0_0_5px_var(--brand-primary)]"></div>
            </div>
          </div>
          <span className="text-[8px] text-brand-10/50 font-mono mt-2 text-center leading-none">{Math.abs(Math.round(steerDeg))}°</span>
        </div>

      </div>
    </div>
  );
}
