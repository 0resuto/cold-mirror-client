import { create } from 'zustand';

const MAX_LIVE_POINTS = 18000; // ~5 minutes at 60Hz

export const useLiveStore = create((set) => ({
  liveLapData: [],
  sessionDrivers: [],
  isStreaming: false,
  liveTrackName: null,
  livePlayerName: null,
  liveCarName: null,
  setLiveLapData: (data) => set({ liveLapData: data }),
  setSessionDrivers: (drivers) => set({ sessionDrivers: drivers }),
  appendLiveData: (newData) => set((state) => {
    const updated = [...state.liveLapData, newData];
    return { liveLapData: updated.length > MAX_LIVE_POINTS ? updated.slice(-MAX_LIVE_POINTS) : updated };
  }),
  clearLiveData: () => set({ liveLapData: [], isStreaming: false }),
}));
