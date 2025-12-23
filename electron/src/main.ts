import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { startServer } from './serverRunner';

let mainWindow: BrowserWindow | null = null;
let serverInstance: { port: number; close: () => Promise<void> } | null = null;

async function createWindow() {
  // Force production mode - this should be set by serverRunner but let's be explicit
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production';
  }
  
  const isDev = process.env.NODE_ENV !== 'production';
  console.log(`[main] NODE_ENV: ${process.env.NODE_ENV}, isDev: ${isDev}`);
  
  // Start server in production mode
  if (!isDev) {
    try {
      console.log('[main] Starting server...');
      serverInstance = await startServer();
      console.log(`[main] Server started on port ${serverInstance.port}`);
    } catch (error) {
      console.error('[main] Failed to start server:', error);
      app.quit();
      return;
    }
  }
  
  const port = isDev ? 5000 : serverInstance!.port;
  
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    },
    title: 'Graph Weaver',
    backgroundColor: '#0a0e27'
  });
  
  // Load the app
  const url = `http://127.0.0.1:${port}`;
  console.log(`[main] Loading app from ${url}`);
  
  // Add listener to see what actually loads
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error(`[main] Failed to load ${validatedURL}: ${errorDescription} (${errorCode})`);
  });
  
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[main] Page loaded successfully');
  });
  
  mainWindow.loadURL(url);
  
  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
  
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  // On macOS, apps typically stay active until explicitly quit
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS, re-create window when dock icon is clicked
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('before-quit', async () => {
  if (serverInstance) {
    await serverInstance.close();
  }
});
