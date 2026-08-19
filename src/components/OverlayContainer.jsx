import React, { useState, useRef, useEffect } from 'react';
import { TelemetryProvider } from 'cold-mirror-widgets';
import { useAppStore } from '../store/useAppStore';
import { useLiveStore } from '../store/useLiveStore';
import { ErrorBoundary } from './ErrorBoundary';

const ResizeHandle = React.memo(function ResizeHandle({ windowId }) {
  const [isDragging, setIsDragging] = useState(false);
  const startPos = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const rafRef = useRef(null);

  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e) => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        const deltaX = e.screenX - startPos.current.x;
        const deltaY = e.screenY - startPos.current.y;
        
        const newWidth = Math.max(100, startPos.current.w + deltaX);
        const newHeight = Math.max(100, startPos.current.h + deltaY);
        
        window.electronAPI.windowAction(windowId, 'resize', { width: newWidth, height: newHeight });
        rafRef.current = null;
      });
    };

    const onMouseUp = () => {
      setIsDragging(false);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isDragging, windowId]);

  return (
    <div 
      className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize z-50 flex items-end justify-end p-1 opacity-50 hover:opacity-100 transition-opacity pointer-events-auto"
      onMouseDown={(e) => {
        startPos.current = {
          x: e.screenX,
          y: e.screenY,
          w: window.innerWidth,
          h: window.innerHeight
        };
        setIsDragging(true);
      }}
      style={{ WebkitAppRegion: 'no-drag' }}
    >
      <div className="w-3 h-3 border-r-2 border-b-2 border-brand-60 rounded-sm"></div>
    </div>
  );
});

const TelemetryBridge = React.memo(({ children }) => {
  const latestTelemetry = useLiveStore(state => state.latestTelemetry);
  const sessionDrivers = useLiveStore(state => state.sessionDrivers);
  const trackLength = useLiveStore(state => state.trackLength);

  return (
    <TelemetryProvider telemetry={latestTelemetry} sessionDrivers={sessionDrivers} trackLength={trackLength}>
      {children}
    </TelemetryProvider>
  );
});

export function OverlayContainer({ windowId, children }) {
  const overlayId = (windowId || '').replace('overlay-', '');
  
  const settings = useAppStore(state => state.overlays[overlayId]) || {};
  
  const scale = settings.scale || 1.0;
  const widgetOpacity = settings.widgetOpacity ?? 1.0;
  const bgOpacity = settings.bgOpacity ?? 0.6;
  const inactiveOpacity = settings.inactiveOpacity;
  const isLocked = settings.clickThrough;

  // The library now expects a CSS variable to control the persistent background opacity.
  const bgColor = `rgba(30, 30, 36, ${bgOpacity})`;

  return (
    <div 
      className={`w-full h-screen overflow-hidden relative transition-colors duration-300 select-none ${
        !isLocked ? 'bg-black/40 border border-white/10 backdrop-blur-sm' : 'pointer-events-none'
      }`}
      style={{ 
        WebkitAppRegion: isLocked ? 'no-drag' : 'drag', 
        opacity: widgetOpacity,
        '--widget-bg-color': bgColor,
        ...(inactiveOpacity !== undefined && { '--inactive-opacity': inactiveOpacity })
      }}
    >
      <div className="w-full h-full relative flex flex-col items-start justify-start pointer-events-none select-none" style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <ErrorBoundary>
          <TelemetryBridge>
            {children}
          </TelemetryBridge>
        </ErrorBoundary>
      </div>
      {!isLocked && <ResizeHandle windowId={windowId} />}
    </div>
  );
}
