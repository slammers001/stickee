import { app as s, BrowserWindow as c } from "electron";
import e from "path";
import { fileURLToPath as d } from "url";
import a from "fs/promises";
import { constants as p } from "fs";
const h = d(import.meta.url), n = e.dirname(h), f = !s.isPackaged;
let t = null;
const l = async () => {
  try {
    if (t = new c({
      width: 1200,
      height: 800,
      show: !1,
      // Don't show the window until it's ready
      backgroundColor: "#ffffff",
      icon: e.join(n, "../public/stickee.png"),
      // Add the icon from public folder
      webPreferences: {
        nodeIntegration: !1,
        contextIsolation: !0,
        webSecurity: !0,
        preload: e.join(n, "preload.js")
      }
    }), t.once("ready-to-show", () => {
      t && (t.show(), t.focus());
    }), t.on("closed", () => {
      t = null;
    }), f)
      console.log("Development mode - loading from Vite dev server..."), await t.loadURL("http://localhost:8080"), t.webContents.openDevTools();
    else {
      const r = [
        // For electron-builder with ASAR unpacking
        e.join(process.resourcesPath, "app.asar.unpacked/dist/index.html"),
        // For electron-builder with ASAR (packed)
        e.join(process.resourcesPath, "app.asar/dist/index.html"),
        // For electron-builder resources
        e.join(process.resourcesPath, "dist/index.html"),
        // Relative to dist-electron (most likely)
        e.join(n, "../dist/index.html"),
        // Fallback paths
        e.join(n, "../../dist/index.html"),
        e.join(process.cwd(), "dist/index.html"),
        // Try direct path to index.html in app root
        e.join(process.resourcesPath, "app.asar.unpacked/index.html"),
        e.join(process.resourcesPath, "app.asar/index.html"),
        e.join(process.resourcesPath, "index.html")
      ];
      console.log("Production mode - looking for index.html..."), console.log("Possible paths:", r);
      let i = !1;
      for (const o of r)
        try {
          console.log("Trying path:", o), await a.access(o, p.F_OK), console.log("✅ File found at:", o), await t.loadFile(o), console.log("✅ Successfully loaded from:", o), await t.webContents.executeJavaScript(`
            if (typeof window !== 'undefined') {
              window.electronAPI = window.electronAPI || {};
              window.electronAPI.isElectron = true;
            }
          `), i = !0;
          break;
        } catch {
          console.log("❌ File not found at:", o);
        }
      if (!i) {
        console.log("=== DEBUGGING FILE STRUCTURE ===");
        try {
          const o = await a.readdir(process.resourcesPath);
          console.log("Files in resources path:", o);
        } catch {
          console.log("Could not read resources directory");
        }
        try {
          const o = await a.readdir(e.join(process.resourcesPath, "app.asar.unpacked"));
          console.log("Files in app.asar.unpacked:", o);
        } catch {
          console.log("Could not read app.asar.unpacked directory");
        }
        t.loadURL(`data:text/html;charset=utf-8,
          <html>
            <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
              <h1>Stickee - Application Loading Error</h1>
              <p>Could not find index.html file in any expected location.</p>
              <p>Please check the console for detailed error information.</p>
              <hr>
              <p><strong>Debug Info:</strong></p>
              <p>__dirname: ${n}</p>
              <p>resourcesPath: ${process.resourcesPath}</p>
              <p>cwd: ${process.cwd()}</p>
              <p>Possible paths tried:</p>
              <ul style="text-align: left; max-width: 800px; margin: 20px auto; font-family: monospace;">
                ${r.map((o) => `<li>${o}</li>`).join("")}
              </ul>
            </body>
          </html>
        `);
      }
    }
  } catch (r) {
    console.error("Failed to create window:", r), s.quit();
  }
};
s.whenReady().then(() => {
  l(), s.on("activate", () => {
    c.getAllWindows().length === 0 && l();
  });
});
s.on("window-all-closed", () => {
  process.platform !== "darwin" && s.quit();
});
