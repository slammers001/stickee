import { app, BrowserWindow } from "electron";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let mainWindow = null;
const createWindow = async () => {
  try {
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      show: false,
      // Don't show the window until it's ready
      backgroundColor: "#ffffff",
      // Set a background color
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        webSecurity: false,
        preload: path.join(__dirname, "preload.js")
      }
    });
    mainWindow.once("ready-to-show", () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    });
    mainWindow.on("closed", () => {
      mainWindow = null;
    });
    if (process.env.NODE_ENV === "development") {
      await mainWindow.loadURL("http://localhost:5173");
      mainWindow.webContents.openDevTools();
    } else {
      await mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
    }
  } catch (error) {
    console.error("Failed to create window:", error);
    app.quit();
  }
};
app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
