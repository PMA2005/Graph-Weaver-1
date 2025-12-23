# 3D Graph Visualization

Interactive 3D network graph visualization showing people and projects from an SQLite database with a sci-fi aesthetic.

## Overview
This app reads from a SQLite database (graph2.db) containing nodes (people, projects) and edges (relationships) and displays them as an interactive 3D graph. Users can click nodes to view details, filter by type, and navigate connections.

## Tech Stack
- **Frontend**: React, React Three Fiber, Drei, Three.js, TailwindCSS
- **Backend**: Express.js, better-sqlite3
- **Database**: SQLite (graph2.db)
- **Desktop**: Electron (for standalone desktop app packaging)

## Project Structure
```
├── attached_assets/
│   └── graph2_*.db         # SQLite database with nodes and edges tables
├── client/src/
│   ├── components/
│   │   ├── Graph3DCanvas.tsx      # 3D visualization with Three.js, camera persistence
│   │   ├── NodeDetailsSidebar.tsx # Node details panel (right side)
│   │   ├── FocusedGraphPanel.tsx  # Multi-select neighborhood panel (left side)
│   │   ├── GraphLegend.tsx        # Color legend and filters
│   │   ├── TopNavigation.tsx      # Header with controls
│   │   ├── ThemeProvider.tsx      # Dark mode toggle with localStorage persistence
│   │   ├── HelpOverlay.tsx        # Help modal for new users (opaque background)
│   │   ├── LoadingScreen.tsx      # Loading animation
│   │   ├── AddNodeModal.tsx       # Modal for creating new nodes
│   │   ├── AddEdgeModal.tsx       # Modal for creating new edges
│   │   ├── EditNodeModal.tsx      # Modal for editing existing nodes
│   │   └── DeleteConfirmModal.tsx # Confirmation dialog for deletions
│   └── pages/
│       └── home.tsx               # Main page combining all components
├── electron/                      # Electron desktop app wrapper
│   ├── src/
│   │   ├── main.ts               # Electron main process entry point
│   │   ├── preload.ts            # Secure preload script for context bridge
│   │   └── serverRunner.ts       # Starts Express server in production mode
│   ├── package.json              # Electron-specific dependencies
│   └── tsconfig.json             # TypeScript config for Electron
├── script/                        # Build and packaging scripts
│   ├── build.ts                  # Production build script (Vite + esbuild)
│   └── pack-guard.js             # Platform validation for native modules
├── scripts/                       # Utility scripts
│   └── migrate-data.ts           # SQLite to PostgreSQL migration script
├── server/
│   ├── index.ts           # Express server entry point
│   ├── routes.ts          # API endpoints for CRUD operations
│   ├── storage.ts         # SQLite database interface
│   ├── db.ts              # Database connection setup
│   ├── static.ts          # Static file serving for production
│   └── vite.ts            # Vite dev server integration
└── shared/
    └── schema.ts           # TypeScript types and Zod schemas
```

## Database Schema
**nodes table**: node_id, node_type, display_name, description, created_at
**edges table**: source_node, target_node, relationship_type, weight, timestamp

## API Endpoints
- GET /api/graph - Get all nodes and edges
- GET /api/nodes - Get all nodes
- GET /api/nodes/:nodeId - Get single node
- POST /api/nodes - Create node
- PATCH /api/nodes/:nodeId - Update node
- DELETE /api/nodes/:nodeId - Delete node
- GET /api/edges - Get all edges
- POST /api/edges - Create edge
- DELETE /api/edges - Delete edge
- GET /api/health - Health check endpoint

## Visual Design
- Sci-fi theme with neon colors (cyan for people, purple for projects)
- Dark space background with star field
- Glowing 3D nodes: spheres for people, cubes for projects
- Interactive: rotate, zoom, pan the 3D view
- Click nodes to see details in sidebar
- Dark mode toggle with system preference detection

## Key Features
- **Multi-Select**: Ctrl/Cmd+click to select multiple nodes
- **Focused Graph Panel**: Shows neighborhood subgraph of selected nodes (left side)
- **Node Details Sidebar**: Edit, delete, and manage connections (right side)
- **Camera Persistence**: Camera position saved and restored when clicking nodes
- **X Button Removal**: Remove individual nodes from selection without deselecting all
- **Help Overlay**: First-time user instructions with opaque background
- **Auto-rotation**: 3D view slowly rotates, pauses on interaction

## Electron Desktop App
The app can be packaged as a standalone desktop application using Electron.

### Electron Files
- **electron/src/main.ts**: Main Electron process, creates the BrowserWindow and manages app lifecycle
- **electron/src/preload.ts**: Secure context bridge (contextIsolation enabled, no Node APIs exposed to renderer)
- **electron/src/serverRunner.ts**: Starts the Express server in production mode, handles database path resolution and port finding

### Building for Desktop
The desktop build process:
1. `script/build.ts` - Bundles the client with Vite and server with esbuild
2. `script/pack-guard.js` - Validates platform for native module builds (better-sqlite3 requires per-OS builds)
3. Electron packages the bundled app for distribution

## Data Migration
The `scripts/migrate-data.ts` script migrates data from SQLite to PostgreSQL if needed for production deployment.

## Running the App
- **Development**: `npm run dev` starts both Express backend and Vite frontend
- **Production Build**: Run `script/build.ts` to create production bundles
- **Electron**: Build Electron wrapper separately for desktop distribution
