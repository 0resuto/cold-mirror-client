import React, { useEffect } from 'react';
import { componentRegistry } from './features/widgets/index.js';
import 'cold-mirror-widgets/style.css';
import { useLiveTelemetryIPC } from './features/live/useLiveTelemetryIPC';
import { useAppStore } from './store/useAppStore';
import { Dashboard } from './components/Dashboard';
import { OverlayContainer } from './components/OverlayContainer';

function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const windowType = urlParams.get('window'); // 'dashboard' or 'overlay'
  const overlayType = urlParams.get('type');
  const windowId = urlParams.get('id');

  const initSettings = useAppStore(state => state.initSettings);
  const overlays = useAppStore(state => state.overlays);
  const overlayId = (windowId || '').replace('overlay-', '');
  
  const isLocked = overlays[overlayId]?.clickThrough || false;
  const columns = overlays[overlayId]?.columns;
  const traceRange = overlays[overlayId]?.traceRange || 5;
  const groupByClass = overlays[overlayId]?.groupByClass || false;
  const showClassName = overlays[overlayId]?.showClassName || false;

  // Only initialize telemetry IPC for overlay windows, not the dashboard
  const isOverlay = windowType === 'overlay';
  useLiveTelemetryIPC(isOverlay);

  useEffect(() => {
    let unsub;
    let mounted = true;
    initSettings().then(res => {
      if (mounted) {
        unsub = res;
      } else if (res) {
        // Component already unmounted — clean up immediately
        res();
      }
    });
    return () => {
      mounted = false;
      if (unsub) unsub();
    };
  }, [initSettings]);

  if (windowType === 'overlay') {
    const content = componentRegistry.render(overlayType, {
      isLocked,
      columns,
      timeRange: traceRange,
      groupByClass,
      showClassName
    });

    return (
      <OverlayContainer windowId={windowId}>
        {content}
      </OverlayContainer>
    );
  }

  // Default to dashboard
  return (
    <React.StrictMode>
      <Dashboard />
    </React.StrictMode>
  );
}

export default App;
