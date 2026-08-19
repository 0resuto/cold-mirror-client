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
  const setSessionData = useLiveStore((state) => state.setSessionData);

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
      if (!sessionInfo) {
        setSessionData(null, [], null, null);
        return;
      }

      const rawSession = sessionInfo?.data || sessionInfo;
      const formattedSession = sessionInfo?.data ? sessionInfo : { data: sessionInfo };

      if (rawSession?.DriverInfo?.Drivers) {
         const drivers = rawSession.DriverInfo.Drivers.map((driver) => ({
           ...driver,
           CarIdx: normalizeCarIdx(driver.CarIdx),
         }));
         const driverCarIdx = normalizeCarIdx(rawSession.DriverInfo.DriverCarIdx);
         const trackLength = normalizeTrackLength(rawSession.WeekendInfo?.TrackLength);
         setSessionData(formattedSession, drivers, driverCarIdx, trackLength);
      } else if (rawSession) {
         const trackLength = normalizeTrackLength(rawSession.WeekendInfo?.TrackLength);
         setSessionData(formattedSession, [], null, trackLength);
      }
    });

    return () => {
      if (unsubTelemetry) unsubTelemetry();
      if (unsubSession) unsubSession();
    };
  }, [enabled, setLatestTelemetry, setSessionData]);

  return;
}
