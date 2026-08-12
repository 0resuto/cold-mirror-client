import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  setIgnoreMouseEvents: (ignore, options) => ipcRenderer.send('set-ignore-mouse-events', ignore, options),
  
  onTelemetryUpdate: (callback) => {
    const handler = (_event, value) => callback(value);
    ipcRenderer.on('telemetry-update', handler);
    return () => ipcRenderer.removeListener('telemetry-update', handler);
  },
  
  onSessionInfo: (callback) => {
    const handler = (_event, value) => callback(value);
    ipcRenderer.on('session-info', handler);
    return () => ipcRenderer.removeListener('session-info', handler);
  },
  
  // Window management
  windowAction: (windowId, action, payload) => ipcRenderer.send('window-action', { windowId, action, payload }),
  
  onMaximizeStateChange: (callback) => {
    const handler = (_event, value) => callback(value);
    ipcRenderer.on('maximize-state', handler);
    return () => ipcRenderer.removeListener('maximize-state', handler);
  },
  
  // Settings & App State
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateOverlaySetting: (id, settings) => ipcRenderer.send('update-overlay-setting', { id, settings }),
  toggleOverlay: (id, state) => ipcRenderer.send('toggle-overlay', id, state),
  
  onSettingsUpdated: (callback) => {
    const handler = (_event, value) => callback(value);
    ipcRenderer.on('settings-updated', handler);
    return () => ipcRenderer.removeListener('settings-updated', handler);
  }
});
