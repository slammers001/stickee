// electron/main.ts
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { constants } from 'fs';

// Get the directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Handle production/development environment
const isDev = !app.isPackaged;

let mainWindow: BrowserWindow | null = null;

const createWindow = async () => {
  try {
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      show: false, // Don't show the window until it's ready
      backgroundColor: '#ffffff',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: true,
        preload: path.join(__dirname, 'preload.cjs')
      },
    });

    // Show window when content is loaded
    mainWindow.once('ready-to-show', () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    });

    // Handle window being closed
    mainWindow.on('closed', () => {
      mainWindow = null;
    });

    if (isDev) {
      // In development, load from the Vite dev server
      await mainWindow.loadURL('http://localhost:5173');
      mainWindow.webContents.openDevTools();
    } else {
      // In production, try multiple possible locations for index.html
      const possiblePaths = [
        // For development builds
        path.join(__dirname, '../dist/index.html'),
        // For packaged app (unpacked)
        path.join(process.resourcesPath, 'app.asar.unpacked/dist/index.html'),
        // For packaged app (packed)
        path.join(process.resourcesPath, 'app.asar/dist/index.html'),
        // Alternative path for some packaging scenarios
        path.join(process.resourcesPath, 'dist/index.html'),
        // Fallback to relative path
        path.join(__dirname, 'dist/index.html')
      ];

      let loadError = null;
      for (const indexPath of possiblePaths) {
        try {
          console.log('Attempting to load from:', indexPath);
          // Check if file exists before trying to load
          try {
            await fs.access(indexPath, constants.F_OK);
            console.log('File exists at:', indexPath);
            await mainWindow.loadFile(indexPath);
            console.log('Successfully loaded from:', indexPath);
            return; // Exit the function if successful
          } catch (accessError) {
            console.log('File does not exist at:', indexPath);
            continue;
          }
        } catch (error) {
          console.error(`Error accessing ${indexPath}:`, error);
          loadError = error;
        }
      }

      // If we got here, all paths failed
      const errorMsg = `All attempts to load index.html failed. Tried paths:\n${possiblePaths.join('\n')}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
  } catch (error) {
    console.error('Failed to create window:', error);
    app.quit();
  }
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});