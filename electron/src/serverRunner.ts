import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';

interface ServerRunnerResult {
  port: number;
  close: () => Promise<void>;
}

export async function startServer(): Promise<ServerRunnerResult> {
  const isDev = process.env.NODE_ENV !== 'production';
  
  if (isDev) {
    // In dev mode, assume server is running separately via npm run dev
    return {
      port: 5000,
      close: async () => {
        // No-op in dev mode
      }
    };
  }

  // Production mode: start Express server
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'graph.db');
  
  console.log('[serverRunner] userData:', userDataPath);
  console.log('[serverRunner] dbPath:', dbPath);
  
  // Ensure userData directory exists
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }
  
  // Seed database if it doesn't exist
  if (!fs.existsSync(dbPath)) {
    console.log('[serverRunner] Seeding database for first run...');
    const seedDbPath = path.join(__dirname, '../../attached_assets/graph2_1765932308440.db');
    
    if (fs.existsSync(seedDbPath)) {
      fs.copyFileSync(seedDbPath, dbPath);
      console.log('[serverRunner] Database seeded successfully');
    } else {
      console.warn('[serverRunner] Seed database not found, creating empty database');
      // The SQLite storage layer will initialize tables
    }
  }
  
  // Find available port
  const port = await findAvailablePort(5100, 5110);
  
  console.log('[serverRunner] Found available port:', port);
  
  // Set environment variables
  process.env.PORT = port.toString();
  process.env.GRAPH_DB_PATH = dbPath;
  process.env.NODE_ENV = 'production';
  
  // Start Express server (dynamic import to avoid bundling issues)
  const serverPath = path.join(__dirname, '../../dist/index.cjs');
  
  console.log('[serverRunner] Server path:', serverPath);
  console.log('[serverRunner] Server exists:', fs.existsSync(serverPath));
  
  if (!fs.existsSync(serverPath)) {
    throw new Error(`Server build not found at ${serverPath}. Run npm run build first.`);
  }
  
  // Load the server module
  console.log('[serverRunner] Requiring server...');
  require(serverPath);
  console.log('[serverRunner] Server module loaded');
  
  // Wait for server to be ready
  console.log('[serverRunner] Waiting for server to be ready...');
  await waitForServer(port);
  console.log('[serverRunner] Server is ready!');
  
  return {
    port,
    close: async () => {
      // Server cleanup handled by app quit events
    }
  };
}

async function findAvailablePort(startPort: number, endPort: number): Promise<number> {
  const net = require('net');
  
  for (let port = startPort; port <= endPort; port++) {
    const available = await new Promise<boolean>((resolve) => {
      const server = net.createServer();
      server.once('error', () => resolve(false));
      server.once('listening', () => {
        server.close();
        resolve(true);
      });
      server.listen(port, '127.0.0.1');
    });
    
    if (available) {
      return port;
    }
  }
  
  throw new Error(`No available ports found between ${startPort} and ${endPort}`);
}

async function waitForServer(port: number, maxAttempts = 30): Promise<void> {
  const http = require('http');
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await new Promise<void>((resolve, reject) => {
        const req = http.get(`http://127.0.0.1:${port}/api/health`, (res: any) => {
          console.log(`[serverRunner] Health check attempt ${i + 1}: status ${res.statusCode}`);
          if (res.statusCode === 200) {
            resolve();
          } else {
            reject(new Error(`Server returned ${res.statusCode}`));
          }
        });
        req.on('error', (err: any) => {
          console.log(`[serverRunner] Health check attempt ${i + 1}: error ${err.message}`);
          reject(err);
        });
        req.setTimeout(1000);
      });
      
      console.log('[serverRunner] Server is ready');
      return;
    } catch (err) {
      if (i === maxAttempts - 1) {
        throw new Error(`Server failed to start after ${maxAttempts} attempts`);
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}
