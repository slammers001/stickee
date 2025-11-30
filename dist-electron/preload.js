import { contextBridge as t, ipcRenderer as i } from "electron";
t.exposeInMainWorld("electron", {
  send: (e, n) => {
    ["toMain"].includes(e) && i.send(e, n);
  },
  receive: (e, n) => {
    if (["fromMain"].includes(e)) {
      const r = (d, ...o) => n(...o);
      return i.on(e, r), () => {
        i.removeListener(e, r);
      };
    }
    return () => {
    };
  }
});
