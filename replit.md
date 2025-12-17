# 3D Graph Visualization

Interactive 3D network graph visualization showing people and projects from an SQLite database with a sci-fi aesthetic.

## Overview
This app reads from a SQLite database (graph2.db) containing nodes (people, projects) and edges (relationships) and displays them as an interactive 3D graph. Users can click nodes to view details, filter by type, and navigate connections.

## Tech Stack
- **Frontend**: React, React Three Fiber, Drei, Three.js, TailwindCSS
- **Backend**: Express.js, better-sqlite3
- **Database**: SQLite (graph2.db)

## Project Structure
```
├── attached_assets/
│   └── graph2_*.db         # SQLite database with nodes and edges tables
├── client/src/
│   ├── components/
│   │   ├── Graph3DCanvas.tsx      # 3D visualization with Three.js
│   │   ├── NodeDetailsSidebar.tsx # Node details panel
│   │   ├── GraphLegend.tsx        # Color legend and filters
│   │   ├── TopNavigation.tsx      # Header with controls
│   │   ├── HelpOverlay.tsx        # Help modal for new users
│   │   └── LoadingScreen.tsx      # Loading animation
│   └── pages/
│       └── home.tsx               # Main page combining all components
├── server/
│   ├── routes.ts           # API endpoints for CRUD operations
│   └── storage.ts          # SQLite database interface
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

## Visual Design
- Sci-fi theme with neon colors (cyan for people, purple for projects)
- Dark space background with star field
- Glowing 3D nodes: spheres for people, cubes for projects
- Interactive: rotate, zoom, pan the 3D view
- Click nodes to see details in sidebar
