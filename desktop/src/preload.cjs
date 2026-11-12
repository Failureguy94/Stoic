// The only bridge between STOIC's windows and the main process: one function, plain messages.
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("stoic", {
  send: (msg) => ipcRenderer.invoke("stoic", msg),
});
