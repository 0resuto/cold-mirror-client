"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  setIgnoreMouseEvents: (ignore, options) => electron.ipcRenderer.send("set-ignore-mouse-events", ignore, options),
  onTelemetryUpdate: (callback) => {
    const handler = (_event, value) => callback(value);
    electron.ipcRenderer.on("telemetry-update", handler);
    return () => electron.ipcRenderer.removeListener("telemetry-update", handler);
  },
  onSessionInfo: (callback) => {
    const handler = (_event, value) => callback(value);
    electron.ipcRenderer.on("session-info", handler);
    return () => electron.ipcRenderer.removeListener("session-info", handler);
  },
  // Window management
  windowAction: (windowId, action, payload) => electron.ipcRenderer.send("window-action", { windowId, action, payload }),
  onMaximizeStateChange: (callback) => {
    const handler = (_event, value) => callback(value);
    electron.ipcRenderer.on("maximize-state", handler);
    return () => electron.ipcRenderer.removeListener("maximize-state", handler);
  },
  // Settings & App State
  getSettings: () => electron.ipcRenderer.invoke("get-settings"),
  updateOverlaySetting: (id, settings) => electron.ipcRenderer.send("update-overlay-setting", { id, settings }),
  toggleOverlay: (id, state) => electron.ipcRenderer.send("toggle-overlay", id, state),
  onSettingsUpdated: (callback) => {
    const handler = (_event, value) => callback(value);
    electron.ipcRenderer.on("settings-updated", handler);
    return () => electron.ipcRenderer.removeListener("settings-updated", handler);
  }
});
