// Preload script with minimal exposure
// Security-first: contextIsolation enabled, no Node APIs exposed to renderer

import { contextBridge } from 'electron';

// Currently no APIs exposed to renderer
// The app works via standard HTTP fetch to localhost
// If needed in future, expose specific APIs here via contextBridge

contextBridge.exposeInMainWorld('electron', {
  // Placeholder for future APIs if needed
  version: process.versions.electron
});
