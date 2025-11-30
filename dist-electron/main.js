import { app as e, BrowserWindow as i } from "electron";
import n from "path";
import { fileURLToPath as r } from "url";
const l = r(import.meta.url), s = n.dirname(l), c = !e.isPackaged;
let o = null;
const a = async () => {
  try {
    if (o = new i({
      width: 1200,
      height: 800,
      show: !1,
      // Don't show the window until it's ready
      backgroundColor: "#ffffff",
      webPreferences: {
        nodeIntegration: !1,
        contextIsolation: !0,
        webSecurity: !0,
        preload: n.join(s, "preload.cjs")
      }
    }), o.once("ready-to-show", () => {
      o && (o.show(), o.focus());
    }), o.on("closed", () => {
      o = null;
    }), c)
      await o.loadURL("http://localhost:5173"), o.webContents.openDevTools();
    else {
      const t = n.join(process.resourcesPath, "app.asar/dist/index.html");
      console.log("Loading index.html from:", t), await o.loadFile(t);
    }
  } catch (t) {
    console.error("Failed to create window:", t), e.quit();
  }
};
e.whenReady().then(() => {
  a(), e.on("activate", () => {
    i.getAllWindows().length === 0 && a();
  });
});
e.on("window-all-closed", () => {
  process.platform !== "darwin" && e.quit();
});
