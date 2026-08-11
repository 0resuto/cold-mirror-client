const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  setIgnoreMouseEvents: (ignore, options) => ipcRenderer.send('set-ignore-mouse-events', ignore, options),
  onTelemetryUpdate: (callback) => ipcRenderer.on('telemetry-update', (_event, value) => callback(value)),
  onSessionInfo: (callback) => ipcRenderer.on('session-info', (_event, value) => callback(value)),
  removeTelemetryListeners: () => {
    ipcRenderer.removeAllListeners('telemetry-update');
    ipcRenderer.removeAllListeners('session-info');
  },
  
  // Window management
  windowAction: (windowId, action, payload) => ipcRenderer.send('window-action', { windowId, action, payload }),
  
  // Settings & App State
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateOverlaySetting: (id, settings) => ipcRenderer.send('update-overlay-setting', { id, settings }),
  toggleOverlay: (id, state) => ipcRenderer.send('toggle-overlay', id, state),
  onSettingsUpdated: (callback) => ipcRenderer.on('settings-updated', (_event, value) => callback(value)),
  removeSettingsListeners: () => ipcRenderer.removeAllListeners('settings-updated'),
});
