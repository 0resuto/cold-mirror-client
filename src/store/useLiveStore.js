import { create } from 'zustand';

export const useLiveStore = create((set) => ({
  latestTelemetry: null,
  sessionDrivers: [],
  sessionData: null,
  driverCarIdx: null,
  trackLength: null,
  setLatestTelemetry: (data) => set({ latestTelemetry: data }),
  setSessionData: (sessionInfo, drivers, carIdx, trackLength) => set({ 
    sessionData: sessionInfo, 
    sessionDrivers: drivers, 
    driverCarIdx: carIdx, 
    trackLength 
  }),
  setSessionDrivers: (drivers, carIdx, trackLength) => set({ 
    sessionDrivers: drivers, 
    driverCarIdx: carIdx, 
    trackLength 
  }),
}));
