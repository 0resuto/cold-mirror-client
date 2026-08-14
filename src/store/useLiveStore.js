import { create } from 'zustand';

export const useLiveStore = create((set) => ({
  latestTelemetry: null,
  sessionDrivers: [],
  driverCarIdx: null,
  trackLength: null,
  setLatestTelemetry: (data) => set({ latestTelemetry: data }),
  setSessionDrivers: (drivers, carIdx, trackLength) => set({ sessionDrivers: drivers, driverCarIdx: carIdx, trackLength }),
}));
