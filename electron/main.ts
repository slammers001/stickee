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
      icon: path.join(__dirname, '../public/stickee.png'), // Add the icon from public folder
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: true,
        preload: path.join(__dirname, 'preload.js')
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
      // In development, load from the Vite dev server (port 8080 from your config)
      console.log('Development mode - loading from Vite dev server...');
      await mainWindow.loadURL('http://localhost:8080');
      mainWindow.webContents.openDevTools();
    } else {
      // In production - check multiple possible locations
      const possiblePaths = [
        // For electron-builder with ASAR unpacking
        path.join(process.resourcesPath, 'app.asar.unpacked/dist/index.html'),
        // For electron-builder with ASAR (packed)
        path.join(process.resourcesPath, 'app.asar/dist/index.html'),
        // For electron-builder resources
        path.join(process.resourcesPath, 'dist/index.html'),
        // Relative to dist-electron (most likely)
        path.join(__dirname, '../dist/index.html'),
        // Fallback paths
        path.join(__dirname, '../../dist/index.html'),
        path.join(process.cwd(), 'dist/index.html'),
        // Try direct path to index.html in app root
        path.join(process.resourcesPath, 'app.asar.unpacked/index.html'),
        path.join(process.resourcesPath, 'app.asar/index.html'),
        path.join(process.resourcesPath, 'index.html')
      ];

      console.log('Production mode - looking for index.html...');
      console.log('Possible paths:', possiblePaths);

      let loaded = false;
      for (const indexPath of possiblePaths) {
        try {
          console.log('Trying path:', indexPath);
          await fs.access(indexPath, constants.F_OK);
          console.log('✅ File found at:', indexPath);
          await mainWindow.loadFile(indexPath);
          console.log('✅ Successfully loaded from:', indexPath);
          // Set the base URL for React Router
          await mainWindow.webContents.executeJavaScript(`
            if (typeof window !== 'undefined') {
              window.electronAPI = window.electronAPI || {};
              window.electronAPI.isElectron = true;
            }
          `);
          loaded = true;
          break;
        } catch (error) {
          console.log('❌ File not found at:', indexPath);
        }
      }

      if (!loaded) {
        // Debug what actually exists
        console.log('=== DEBUGGING FILE STRUCTURE ===');
        
        try {
          const files = await fs.readdir(process.resourcesPath);
          console.log('Files in resources path:', files);
        } catch (error) {
          console.log('Could not read resources directory');
        }

        try {
          const appFiles = await fs.readdir(path.join(process.resourcesPath, 'app.asar.unpacked'));
          console.log('Files in app.asar.unpacked:', appFiles);
        } catch (error) {
          console.log('Could not read app.asar.unpacked directory');
        }

        // Show error page with debug info
        mainWindow.loadURL(`data:text/html;charset=utf-8,
          <html>
            <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
              <h1>Stickee - Application Loading Error</h1>
              <p>Could not find index.html file in any expected location.</p>
              <p>Please check the console for detailed error information.</p>
              <hr>
              <p><strong>Debug Info:</strong></p>
              <p>__dirname: ${__dirname}</p>
              <p>resourcesPath: ${process.resourcesPath}</p>
              <p>cwd: ${process.cwd()}</p>
              <p>Possible paths tried:</p>
              <ul style="text-align: left; max-width: 800px; margin: 20px auto; font-family: monospace;">
                ${possiblePaths.map(p => `<li>${p}</li>`).join('')}
              </ul>
            </body>
          </html>
        `);
      }
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
