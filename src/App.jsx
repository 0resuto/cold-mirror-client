import React, { useEffect } from 'react';
import { LiveStandings, LiveRelative, LiveFuel, LiveInputs, LiveRadar, LinearTrackMap, LiveWeather, PitHelper, DigitalDash } from 'cold-mirror-widgets';
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

  // Only initialize telemetry IPC for overlay windows, not the dashboard
  const isOverlay = windowType === 'overlay';
  useLiveTelemetryIPC(isOverlay);

  // Fetch settings for the overlay
  const overlayId = (windowId || '').replace('overlay-', '');
  const settings = useAppStore(state => state.overlays[overlayId]) || {};
  const isLocked = settings.clickThrough ?? false;
  const columns = settings.columns;
  const traceRange = settings.traceRange;

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
    let content = null;
    
    if (overlayType === 'standings') {
      content = <LiveStandings isLocked={isLocked} columns={columns} />;
    } else if (overlayType === 'relative') {
      content = <LiveRelative isLocked={isLocked} columns={columns} />;
    } else if (overlayType === 'fuel') {
      content = <LiveFuel isLocked={isLocked} />;
    } else if (overlayType === 'inputs') {
      content = <LiveInputs isLocked={isLocked} timeRange={traceRange} />;
    } else if (overlayType === 'radar') {
      content = <LiveRadar isLocked={isLocked} />;
    } else if (overlayType === 'trackmap') {
      content = <LinearTrackMap isLocked={isLocked} />;
    } else if (overlayType === 'weather') {
      content = <LiveWeather isLocked={isLocked} />;
    } else if (overlayType === 'pit') {
      content = <PitHelper isLocked={isLocked} />;
    } else if (overlayType === 'dash') {
      content = <DigitalDash isLocked={isLocked} />;
    } else {
      content = <div className="text-white p-4">Unknown overlay type</div>;
    }

    return (
      <OverlayContainer windowId={windowId}>
        {content}
      </OverlayContainer>
    );
  }

  // Default to dashboard
  return <Dashboard />;
}

export default App;
