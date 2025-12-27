# 2D Graph Visualization

Interactive 2D network graph visualization showing people and projects from an SQLite database with a sci-fi aesthetic.

## Overview
This app reads from a SQLite database (graph2_1765932308440.db) containing nodes (people, projects) and edges (relationships) and displays them as an interactive 2D force-directed graph. Users can click nodes to view details, multi-select for focused views, and manage connections with full CRUD operations.

## Tech Stack
- **Frontend**: React, D3-Force, D3-Force-3D, Framer Motion, TailwindCSS
- **Backend**: Express.js, better-sqlite3
- **Database**: SQLite (graph2_1765932308440.db)
- **Desktop**: Electron (for standalone desktop app packaging)

## Project Structure
```
├── attached_assets/
│   └── graph2_*.db              # SQLite database with nodes and edges tables
├── client/src/
│   ├── components/
│   │   ├── Graph2DCanvas.tsx        # 2D SVG visualization with D3 force, pan/zoom, inverse scaling
│   │   ├── NodeDetailsSidebar.tsx   # Node details panel with directional connections (right side)
│   │   ├── FocusOverlay.tsx         # Multi-select chip display with reorder support (bottom)
│   │   ├── GraphLegend.tsx          # Color legend for node types and edge relationships
│   │   ├── TopNavigation.tsx        # Header with add node button and theme toggle
│   │   ├── ThemeProvider.tsx        # Dark mode toggle with localStorage persistence
│   │   ├── HelpOverlay.tsx          # Help modal for new users (opaque background)
│   │   ├── LoadingScreen.tsx        # Loading animation
│   │   ├── AddNodeModal.tsx         # Modal for creating new nodes
│   │   ├── AddEdgeModal.tsx         # Modal for creating new edges (alphabetically sorted dropdowns)
│   │   ├── EditNodeModal.tsx        # Modal for editing existing nodes
│   │   └── DeleteConfirmModal.tsx   # Confirmation dialog for deletions
│   └── pages/
│       └── home.tsx                 # Main page combining all components
├── electron/                        # Electron desktop app wrapper
│   ├── src/
│   │   ├── main.ts                 # Electron main process entry point
│   │   ├── preload.ts              # Secure preload script for context bridge
│   │   └── serverRunner.ts         # Starts Express server in production mode
│   ├── package.json                # Electron-specific dependencies
│   └── tsconfig.json               # TypeScript config for Electron
├── script/                          # Build and packaging scripts
│   ├── build.ts                    # Production build script (Vite + esbuild)
│   └── pack-guard.js               # Platform validation for native modules
├── scripts/                         # Utility scripts
│   └── migrate-data.ts             # SQLite to PostgreSQL migration script
├── server/
│   ├── index.ts             # Express server entry point
│   ├── routes.ts            # API endpoints for CRUD operations
│   ├── storage.ts           # SQLite database interface
│   ├── db.ts                # Database connection setup
│   ├── static.ts            # Static file serving for production
│   └── vite.ts              # Vite dev server integration
└── shared/
    └── schema.ts             # TypeScript types and Zod schemas
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
- DELETE /api/nodes/:nodeId - Delete node (cascades to edges)
- GET /api/edges - Get all edges
- POST /api/edges - Create edge
- DELETE /api/edges - Delete edge
- GET /api/health - Health check endpoint

## Visual Design
- Sci-fi theme with neon colors (cyan circles for people, purple rectangles for projects)
- Dark space background with grid pattern
- Color-coded edges by relationship type (green, blue, yellow, orange, pink)
- Vertical stratification: projects at top, people at bottom
- Inverse scaling: labels and edges maintain constant screen size across zoom (0.3x-4x)
- Floating "solar system" animation for organic feel
- Pulsing selection indicators

## Key Features
- **2D Force-Directed Graph**: SVG-based with D3 force simulation
- **Pan & Zoom**: Scroll to zoom, drag to pan, +/- buttons for precision
- **Inverse Scaling**: Text and edges stay readable at all zoom levels
- **Multi-Select**: Ctrl/Cmd+click to select multiple nodes
- **Focus Mode**: View only selected nodes and their connections
- **Selection Reordering**: Click chips to switch sidebar without removing from focus
- **Directional Connections**: Sidebar shows incoming vs outgoing relationships
- **Alphabetical Dropdowns**: People/projects sorted for easy finding
- **Dark Mode Toggle**: System preference detection with manual override
- **Help Overlay**: First-time user instructions

## Recent Changes
- Implemented inverse scaling for labels (fontSize / clamp(scale, 0.3, 4)) and edges (strokeWidth / clamp(scale, 0.3, 4))
- Fixed zoom buttons to work in both full view and focused view modes (wasFocusModeRef pattern)
- Added alphabetical sorting to AddEdgeModal dropdowns using localeCompare
- Updated FocusOverlay chip clicks to reorder selection (makePrimaryNode) instead of clearing focus
- Separated incoming/outgoing connections in NodeDetailsSidebar

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
