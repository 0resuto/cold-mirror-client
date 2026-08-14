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

  useEffect(() => {
    let unsub;
    initSettings().then(res => { unsub = res; });
    return () => {
      if (unsub) unsub();
    };
  }, [initSettings]);

  if (windowType === 'overlay') {
    let content = null;
    
    if (overlayType === 'standings') {
      content = <LiveStandings />;
    } else if (overlayType === 'relative') {
      content = <LiveRelative />;
    } else if (overlayType === 'fuel') {
      content = <LiveFuel />;
    } else if (overlayType === 'inputs') {
      content = <LiveInputs />;
    } else if (overlayType === 'radar') {
      content = <LiveRadar />;
    } else if (overlayType === 'trackmap') {
      content = <LinearTrackMap />;
    } else if (overlayType === 'weather') {
      content = <LiveWeather />;
    } else if (overlayType === 'pit') {
      content = <PitHelper />;
    } else if (overlayType === 'dash') {
      content = <DigitalDash />;
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
