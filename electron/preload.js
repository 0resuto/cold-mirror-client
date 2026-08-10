const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  setIgnoreMouseEvents: (ignore, options) => ipcRenderer.send('set-ignore-mouse-events', ignore, options),
  onTelemetryUpdate: (callback) => ipcRenderer.on('telemetry-update', (_event, value) => callback(value)),
  onSessionInfo: (callback) => ipcRenderer.on('session-info', (_event, value) => callback(value))
});
