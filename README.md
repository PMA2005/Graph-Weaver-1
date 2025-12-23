# Network Graph - 3D Interactive Visualization

A 3D interactive graph visualization web application featuring a sci-fi aesthetic with neon colors and dark space backgrounds. View and manage relationships between people and projects with full CRUD operations.

Available as both a web application and portable desktop apps for Windows and macOS.

## Features

### Core Visualization
- **3D Graph Visualization** - Interactive graph using React Three Fiber with smooth animations
- **Sci-Fi Aesthetic** - Cyan nodes for people, purple for projects, neon color-coded relationships
- **Node Labels** - Display names shown above each node in the visualization
- **Edge Labels** - Relationship types displayed on connection lines
- **Filtered Views** - View individual person activities or project team compositions

### Multi-Select & Focused Graph Panel
- **Multi-Select Support** - Hold Ctrl (Windows/Linux) or Cmd (macOS) and click to select multiple nodes
- **Remove from Selection** - Click the X button on any selected node tab to remove it from your selection
- **Focused Graph Panel** - Left panel shows neighborhood subgraph of selected node(s)
- **Single/All View Modes** - Toggle between viewing one node's neighborhood or combined neighborhoods of all selected nodes
- **Node Navigation** - Click nodes in the focused panel to navigate to their neighborhood
- **Interactive 3D Mini-Graph** - Auto-rotating 3D view with orbit controls in the focused panel

### Data Management
- **Full CRUD Operations** - Add, edit, and delete nodes and relationships
- **Cascade Delete** - Deleting a node automatically removes all its relationships
- **Custom Relationships** - Create your own relationship types
- **SQLite Database** - Persistent data storage with included sample data

### User Interface
- **Dark Mode Toggle** - Switch between light and dark themes with automatic system preference detection
- **Semi-transparent UI** - Graph remains visible behind modals and sidebar
- **Responsive Layout** - Main graph centers automatically when side panels open/close
- **Camera Persistence** - Camera position stays in place when clicking nodes (no jumping)
- **Details Sidebar** - View and edit node details, see all connections
- **Connection Management** - Add and remove relationships from the sidebar
- **Help Overlay** - First-time instructions that fully hide the graph for readability
- **Portable Desktop Apps** - Zero-install executables for Windows and macOS

## Usage Guide

### Basic Interaction
- **Click a node** - Select it and open the details sidebar
- **Drag** - Rotate the 3D view
- **Scroll** - Zoom in/out
- **Double-click background** - Deselect all nodes

### Multi-Select
- **Ctrl+Click (Windows/Linux)** or **Cmd+Click (macOS)** - Add/remove nodes from selection
- Selected nodes show in the Focused Graph Panel on the left
- **Click X button** - Remove a node from your selection without deselecting everything
- Use "Single" mode to view one node's neighborhood at a time
- Use "All" mode to see combined neighborhoods of all selected nodes

### Theme Toggle
- **Click the theme toggle** in the top navigation bar to switch between light and dark mode
- Your preference is saved to localStorage and remembered on next visit

### Managing Data
- **Add Node** - Click "+ Add Node" in the top navigation
- **Edit Node** - Select a node, then click "Edit" in the sidebar
- **Delete Node** - Select a node, then click "Delete" in the sidebar
- **Add Relationship** - Select a node, then click "+ Add" in the connections section
- **Remove Relationship** - Click the X next to any connection in the sidebar

## Quick Start

**Want a desktop app?** See [Portable Desktop Builds](#portable-desktop-builds) below.

**Want to develop?** Continue reading for local Node.js setup.

## Running Locally

### Prerequisites

Install Node.js version 20 or higher from [nodejs.org](https://nodejs.org)

### macOS

1. Download the project as a zip file from Replit

2. Extract the zip file (double-click it)

3. Open **Terminal** and navigate to the extracted project folder:
   ```bash
   cd ~/Downloads/Graph-Weaver-1
   ```
   
   **Note:** If you extracted to a different location, navigate there first:
   ```bash
   cd /path/to/extracted/folder
   ls                          # See what's inside
   cd Graph-Weaver-1           # Enter the project folder
   ```

4. Install dependencies:
   ```bash
   npm install
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open your browser to:
   ```
   http://localhost:5000
   ```

### Windows

1. Download the project as a zip file from Replit

2. Extract the zip file (right-click > Extract All)

3. Open **Command Prompt** or **PowerShell** and navigate to the extracted project folder:
   ```cmd
   cd C:\Users\YourName\Downloads\Graph-Weaver-1
   ```
   
   **Note:** If you extracted to a different location, navigate there first:
   ```cmd
   cd C:\path\to\extracted\folder
   dir                         # See what's inside
   cd Graph-Weaver-1           # Enter the project folder
   ```

4. Install dependencies:
   ```cmd
   npm install
   ```

5. Start the development server:
   ```cmd
   npm run dev
   ```

6. Open your browser to:
   ```
   http://localhost:5000
   ```

## Troubleshooting

### "Could not read package.json" error
You're in the wrong folder. Use `ls` (Mac) or `dir` (Windows) to see folder contents, then `cd` into the project folder.

### Server won't start
Make sure no other application is using port 5000. You can also try port 3000 by editing `server/index.ts`.

## Database

The app uses SQLite for data storage. The database file is located at:
```
attached_assets/graph2_1765932308440.db
```

### Database Structure

**nodes** table:
- `node_id` - Unique identifier
- `node_type` - "person" or "project"
- `display_name` - Name shown in the graph
- `description` - Additional details
- `created_at` - Timestamp

**edges** table:
- `source_node` - Starting node ID
- `target_node` - Ending node ID
- `relationship_type` - Type of relationship (assigned_to, collaborates_with, etc.)
- `weight` - Relationship weight
- `timestamp` - Timestamp

### Viewing Database Contents

**macOS (Terminal):**
```bash
sqlite3 attached_assets/graph2_1765932308440.db "SELECT * FROM nodes;"
sqlite3 attached_assets/graph2_1765932308440.db "SELECT * FROM edges;"
```

**Windows (Command Prompt):**

SQLite is not pre-installed on Windows. You can either:
1. Download [DB Browser for SQLite](https://sqlitebrowser.org/) and open the .db file
2. Install SQLite from [sqlite.org/download](https://www.sqlite.org/download.html) and use the same commands as macOS

## Relationship Types

- **assigned_to** (green) - Person assigned to a project
- **collaborates_with** (blue) - People working together
- **consults_on** (yellow) - Advisory relationship
- **manages** (orange) - Management relationship
- **reports_to** (pink) - Reporting structure
- **Custom** - Create your own types

## Tech Stack

- **Frontend**: React, React Three Fiber, Tailwind CSS
- **Backend**: Express.js
- **Database**: SQLite (better-sqlite3)
- **Build Tool**: Vite
- **Desktop**: Electron

## Portable Desktop Builds

Graph Weaver can be packaged as portable desktop applications with zero installation required.

### End User Experience

1. Download the appropriate file for your platform
2. Double-click to launch
3. App opens immediately with no setup

**No Node.js, no terminal, no installer needed.**

### Building Desktop Apps

Desktop builds must be created on the native platform due to SQLite native modules.

#### macOS Build (run on macOS only)

```bash
npm install
npm run electron:pack:mac
```

Output: `release/mac/Graph Weaver.app`

**First Launch on macOS:**
- Right-click the app and select "Open"
- Click "Open" on the Gatekeeper warning
- Subsequent launches work normally via double-click

#### Windows Build (run on Windows only)

```bash
npm install
npm run electron:pack:win
```

Output: `release/Graph Weaver.exe`

**Note:** The .exe is a portable executable - no installation required.

### Desktop App Data Storage

User data is stored separately from the app:

- **Windows**: `%APPDATA%/Graph Weaver/graph.db`
- **macOS**: `~/Library/Application Support/Graph Weaver/graph.db`

Data persists between app updates and is never written to the installation directory.

### Development Mode

To test Electron integration during development:

```bash
# Terminal 1: Start the web server
npm run dev

# Terminal 2: Launch Electron (loads from localhost:5000)
npm run electron:dev
```

---

## Developer Setup - Running Locally