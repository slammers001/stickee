// Type declarations for Electron preload script
import type { ElectronAPI } from '../electron/preload';

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

export {}; // This file needs to be a module
