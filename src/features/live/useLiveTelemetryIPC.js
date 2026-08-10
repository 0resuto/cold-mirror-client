import { useEffect, useState } from 'react';
import { useLiveStore } from '../../store/useLiveStore';
import toast from 'react-hot-toast';

export function useLiveTelemetryIPC(enabled = true) {
  const setLiveLapData = useLiveStore((state) => state.setLiveLapData);
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

    window.electronAPI.onTelemetryUpdate((data) => {
      setLiveLapData([data]); 
    });

    window.electronAPI.onSessionInfo((sessionInfo) => {
      if (sessionInfo?.data?.DriverInfo?.Drivers) {
         setSessionDrivers(sessionInfo.data.DriverInfo.Drivers);
      }
    });

    return () => {
    };
  }, [enabled, setLiveLapData, setSessionDrivers]);

  return { isConnected };
}
