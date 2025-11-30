// This file is compiled to CommonJS format by Vite
const { contextBridge, ipcRenderer } = require('electron');

// Type declarations for TypeScript
type IpcRendererEvent = Event & {
  sender: any;
  senderId: number;
};

// Expose protected methods to the renderer process
const electronAPI = {
  send: (channel: string, data: unknown): void => {
    // Whitelist channels
    const validChannels = ['toMain'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel: string, func: (...args: unknown[]) => void): (() => void) => {
    const validChannels = ['fromMain'];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender`
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) => func(...args);
      ipcRenderer.on(channel, subscription);
      
      // Return cleanup function
      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    }
    return () => {}; // Return empty cleanup function if channel is not valid
  }
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electron', electronAPI);

// Export the API type for TypeScript
export type ElectronAPI = typeof electronAPI;
