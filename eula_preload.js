const { contextBridge, ipcRenderer } = require('electron/renderer');

contextBridge.exposeInMainWorld('electronAPI', {
  onAgreeToEula: () => ipcRenderer.send('update:agreedToEula'),
  onDisagreeToEula: () => ipcRenderer.send('update:disagreedToEula')
});