import { create } from 'zustand';

export const useAppStore = create((set, get) => ({
  overlays: {},
  settingsLoaded: false,

  // Initialize from electron store
  initSettings: async () => {
    if (!window.electronAPI) return;
    const settings = await window.electronAPI.getSettings();
    set({ overlays: settings.overlays || {}, settingsLoaded: true });

    // Listen for changes from main process (e.g. window resize/move or toggles)
    if (window.electronAPI.removeSettingsListeners) {
      window.electronAPI.removeSettingsListeners();
    }
    window.electronAPI.onSettingsUpdated((newSettings) => {
      set({ overlays: newSettings.overlays || {} });
    });
  },

  widgetActive: {},
  setWidgetActive: (id, isActive) => set((state) => {
    if (state.widgetActive[id] === isActive) return state;
    return {
      widgetActive: {
        ...state.widgetActive,
        [id]: isActive
      }
    };
  }),

  toggleOverlay: (id, state) => {
    if (window.electronAPI) {
      window.electronAPI.toggleOverlay(id, state);
    }
  },

  updateOverlaySetting: (id, settingObj) => {
    if (window.electronAPI) {
      window.electronAPI.updateOverlaySetting(id, settingObj);
    }
    // Optimistic update
    set((state) => ({
      overlays: {
        ...state.overlays,
        [id]: {
          ...(state.overlays[id] || {}),
          ...settingObj
        }
      }
    }));
  },

  standingsColumns: {
    pos: true,
    driver: true,
    carName: false,
    carClass: true,
    srating: true,
    irating: true,
    lastLap: false,
    trackPct: true,
  },
  toggleStandingsColumn: (col) => set((state) => ({
    standingsColumns: {
      ...state.standingsColumns,
      [col]: !state.standingsColumns[col]
    }
  })),
}));
