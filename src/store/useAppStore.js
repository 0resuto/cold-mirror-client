import { create } from 'zustand';

let unsubSettings = null;

const debounceSettings = (() => {
  let timer = null;
  let pendingSettings = {};
  
  return (id, settingObj) => {
    pendingSettings[id] = { ...pendingSettings[id], ...settingObj };
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      Object.entries(pendingSettings).forEach(([overlayId, settings]) => {
        window.electronAPI.updateOverlaySetting(overlayId, settings);
      });
      pendingSettings = {};
    }, 150);
  };
})();

export const useAppStore = create((set, get) => ({
  overlays: {},
  settingsLoaded: false,

  // Initialize from electron store
  initSettings: async () => {
    if (!window.electronAPI) return;
    const settings = await window.electronAPI.getSettings();
    set({ overlays: settings.overlays || {}, settingsLoaded: true });

    // Listen for changes from main process (e.g. window resize/move or toggles)
    if (unsubSettings) unsubSettings();
    unsubSettings = window.electronAPI.onSettingsUpdated((newSettings) => {
      set({ overlays: newSettings.overlays || {} });
    });
    return unsubSettings;
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
    // Optimistic update first
    set((state) => ({
      overlays: {
        ...state.overlays,
        [id]: {
          ...state.overlays[id],
          ...settingObj
        }
      }
    }));
    // Debounced IPC send
    if (window.electronAPI) {
      debounceSettings(id, settingObj);
    }
  },

}));
