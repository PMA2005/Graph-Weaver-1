import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  // In production Electron, the server runs from dist/index.cjs
  // So __dirname will be 'dist/', and we need to find 'dist/public'
  let distPath = path.resolve(__dirname, "public");
  
  console.log(`[static] Trying distPath: ${distPath}`);
  console.log(`[static] __dirname is: ${__dirname}`);
  
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  console.log(`Serving static files from: ${distPath}`);
  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
