// The only bridge between STOIC's windows and the main process: one function, plain messages.
// Sandboxed Electron preloads must be CommonJS, so require() is the only option here.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("stoic", {
  send: (msg) => ipcRenderer.invoke("stoic", msg),
});
