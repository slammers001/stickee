import { app as o, BrowserWindow as i } from "electron";
import n from "path";
let e = null;
const t = async () => {
  e = new i({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: !0,
      contextIsolation: !1,
      webSecurity: !1,
      preload: n.join(__dirname, "preload.js")
    }
  }), process.env.NODE_ENV === "development" ? (await e.loadURL("http://localhost:5173"), e.webContents.openDevTools()) : await e.loadFile(n.join(__dirname, "../dist/index.html"));
};
o.whenReady().then(() => {
  t(), o.on("activate", () => {
    i.getAllWindows().length === 0 && t();
  });
});
o.on("window-all-closed", () => {
  process.platform !== "darwin" && o.quit();
});
