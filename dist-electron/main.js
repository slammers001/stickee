import { app as r, BrowserWindow as c } from "electron";
import t from "path";
import { fileURLToPath as d } from "url";
import a from "fs/promises";
import { constants as p } from "fs";
const h = d(import.meta.url), n = t.dirname(h), f = !r.isPackaged;
let e = null;
const l = async () => {
  try {
    if (e = new c({
      width: 1200,
      height: 800,
      show: !1,
      // Don't show the window until it's ready
      backgroundColor: "#ffffff",
      webPreferences: {
        nodeIntegration: !1,
        contextIsolation: !0,
        webSecurity: !0,
        preload: t.join(n, "preload.js")
      }
    }), e.once("ready-to-show", () => {
      e && (e.show(), e.focus());
    }), e.on("closed", () => {
      e = null;
    }), f)
      console.log("Development mode - loading from Vite dev server..."), await e.loadURL("http://localhost:8080"), e.webContents.openDevTools();
    else {
      const s = [
        // For electron-builder with ASAR unpacking
        t.join(process.resourcesPath, "app.asar.unpacked/dist/index.html"),
        // For electron-builder with ASAR (packed)
        t.join(process.resourcesPath, "app.asar/dist/index.html"),
        // For electron-builder resources
        t.join(process.resourcesPath, "dist/index.html"),
        // Relative to dist-electron (most likely)
        t.join(n, "../dist/index.html"),
        // Fallback paths
        t.join(n, "../../dist/index.html"),
        t.join(process.cwd(), "dist/index.html"),
        // Try direct path to index.html in app root
        t.join(process.resourcesPath, "app.asar.unpacked/index.html"),
        t.join(process.resourcesPath, "app.asar/index.html"),
        t.join(process.resourcesPath, "index.html")
      ];
      console.log("Production mode - looking for index.html..."), console.log("Possible paths:", s);
      let i = !1;
      for (const o of s)
        try {
          console.log("Trying path:", o), await a.access(o, p.F_OK), console.log("✅ File found at:", o), await e.loadFile(o), console.log("✅ Successfully loaded from:", o), await e.webContents.executeJavaScript(`
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
          const o = await a.readdir(t.join(process.resourcesPath, "app.asar.unpacked"));
          console.log("Files in app.asar.unpacked:", o);
        } catch {
          console.log("Could not read app.asar.unpacked directory");
        }
        e.loadURL(`data:text/html;charset=utf-8,
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
                ${s.map((o) => `<li>${o}</li>`).join("")}
              </ul>
            </body>
          </html>
        `);
      }
    }
  } catch (s) {
    console.error("Failed to create window:", s), r.quit();
  }
};
r.whenReady().then(() => {
  l(), r.on("activate", () => {
    c.getAllWindows().length === 0 && l();
  });
});
r.on("window-all-closed", () => {
  process.platform !== "darwin" && r.quit();
});
