import { useEffect } from 'react';
import { useLiveStore } from '../../store/useLiveStore';
import toast from 'react-hot-toast';

function normalizeTrackLength(trackLength) {
  if (typeof trackLength === 'number') return trackLength;
  if (typeof trackLength !== 'string') return null;

  const value = parseFloat(trackLength);
  if (!Number.isFinite(value)) return null;

  return trackLength.toLowerCase().includes('km') ? value * 1000 : value;
}

function normalizeCarIdx(value) {
  const carIdx = Number(value);
  return Number.isFinite(carIdx) ? carIdx : null;
}

export function useLiveTelemetryIPC(enabled = true) {
  const setLatestTelemetry = useLiveStore((state) => state.setLatestTelemetry);
  const setSessionDrivers = useLiveStore((state) => state.setSessionDrivers);

  useEffect(() => {
    if (!enabled) return;

    if (!window.electronAPI || !window.electronAPI.onTelemetryUpdate) {
      console.warn('IPC electronAPI is not available. Ensure you are running in Electron.');
      return;
    }

    const unsubTelemetry = window.electronAPI.onTelemetryUpdate((data) => {
      setLatestTelemetry(data); 
    });

    const unsubSession = window.electronAPI.onSessionInfo((sessionInfo) => {
      const sessionData = sessionInfo?.data || sessionInfo;

      if (sessionData?.DriverInfo?.Drivers) {
         const drivers = sessionData.DriverInfo.Drivers.map((driver) => ({
           ...driver,
           CarIdx: normalizeCarIdx(driver.CarIdx),
         }));
         const driverCarIdx = normalizeCarIdx(sessionData.DriverInfo.DriverCarIdx);
         const trackLength = normalizeTrackLength(sessionData.WeekendInfo?.TrackLength);
         setSessionDrivers(drivers, driverCarIdx, trackLength);
      }
    });

    return () => {
      if (unsubTelemetry) unsubTelemetry();
      if (unsubSession) unsubSession();
    };
  }, [enabled, setLatestTelemetry, setSessionDrivers]);

  return;
}
