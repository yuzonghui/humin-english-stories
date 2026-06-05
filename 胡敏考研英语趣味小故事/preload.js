const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  loadUserData: () => ipcRenderer.invoke('load-user-data'),
  saveUserData: (data) => ipcRenderer.invoke('save-user-data', data),
  loadStories: () => ipcRenderer.invoke('load-stories')
});
