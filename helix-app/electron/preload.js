const { contextBridge, ipcRenderer } = require('electron');

// Securely expose native APIs to the frontend
contextBridge.exposeInMainWorld('helixDesktop', {
  platform: process.platform,
  isDesktop: true,
  sendAction: (action, data) => ipcRenderer.send('agent-action', { action, data }),
  onResponse: (callback) => ipcRenderer.on('agent-response', (event, ...args) => callback(...args)),
});
