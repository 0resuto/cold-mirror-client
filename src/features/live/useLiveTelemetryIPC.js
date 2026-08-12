import { useEffect, useState } from 'react';
import { useLiveStore } from '../../store/useLiveStore';
import toast from 'react-hot-toast';

export function useLiveTelemetryIPC(enabled = true) {
  const setLatestTelemetry = useLiveStore((state) => state.setLatestTelemetry);
  const setSessionDrivers = useLiveStore((state) => state.setSessionDrivers);
  const clearLiveData = useLiveStore((state) => state.clearLiveData);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    if (!window.electronAPI || !window.electronAPI.onTelemetryUpdate) {
      console.warn('IPC electronAPI is not available. Ensure you are running in Electron.');
      return;
    }

    setIsConnected(true);

    const unsubTelemetry = window.electronAPI.onTelemetryUpdate((data) => {
      setLatestTelemetry(data); 
    });

    const unsubSession = window.electronAPI.onSessionInfo((sessionInfo) => {
      if (sessionInfo?.data?.DriverInfo?.Drivers) {
         const drivers = sessionInfo.data.DriverInfo.Drivers;
         const driverCarIdx = sessionInfo.data.DriverInfo.DriverCarIdx;
         const trackLength = sessionInfo.data.WeekendInfo?.TrackLength;
         setSessionDrivers(drivers, driverCarIdx, trackLength);
      }
    });

    return () => {
      if (unsubTelemetry) unsubTelemetry();
      if (unsubSession) unsubSession();
    };
  }, [enabled, setLatestTelemetry, setSessionDrivers]);

  return { isConnected };
}
