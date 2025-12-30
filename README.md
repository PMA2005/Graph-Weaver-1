# Network Graph - 2D Interactive Visualization

A 2D interactive graph visualization web application featuring a sci-fi aesthetic with neon colors and dark space backgrounds. View and manage relationships between people and projects with full CRUD operations.

Available as both a web application and portable desktop apps for Windows and macOS.

## Features

### Core Visualization
- **2D Force-Directed Graph** - Interactive SVG-based graph using D3 force simulation with smooth animations
- **Sci-Fi Aesthetic** - Cyan circles for people, purple rectangles for projects, neon color-coded relationships
- **Vertical Stratification** - Projects positioned at top of graph, people at bottom for clear visual hierarchy
- **Inverse Scaling Labels** - Node labels and edge widths maintain constant screen size across all zoom levels (0.3x to 4x)
- **Floating Animation** - Smooth "solar system" style floating motion for organic, living graph feel
- **Pulsing Selection** - Selected nodes display animated pulsing ring indicators

### Pan, Zoom & Navigation
- **Scroll to Zoom** - Mouse wheel zooms in/out centered on cursor position
- **Drag to Pan** - Click and drag background to pan the view
- **Zoom Buttons** - +/- controls for precise zoom adjustments
- **Zoom Range** - Full zoom range from 0.3x (overview) to 4x (detail)
- **Camera Persistence** - View position maintained when interacting with nodes

### Multi-Select & Focused View
- **Multi-Select Support** - Hold Ctrl (Windows/Linux) or Cmd (macOS) and click to select multiple nodes
- **Focused View Mode** - Click "View Focused" to see only selected nodes and their connections
- **Selection Reordering** - Click focused node chips to switch sidebar display without removing nodes from focus
- **Remove from Selection** - Click X button on any selected node chip to remove it from selection
- **Filtered Edges** - Focused view shows only edges between focused nodes

### Data Management
- **Full CRUD Operations** - Add, edit, and delete nodes and relationships
- **Cascade Delete** - Deleting a node automatically removes all its relationships
- **Custom Relationships** - Create your own relationship types
- **Alphabetical Sorting** - People and projects sorted alphabetically in dropdown menus
- **SQLite Database** - Persistent data storage with included sample data

### User Interface
- **Search Bar** - Find people and projects with Google-style ranking (names starting with query first, then containing matches)
- **Dark Mode Toggle** - Switch between light and dark themes with automatic system preference detection
- **Dual Layout Modes** - Force-directed (dynamic) and Spiral (stratified) layouts with toggle in legend
- **Semi-transparent UI** - Graph remains visible behind modals and sidebar
- **Comprehensive Legend** - Color-coded relationship types with edge color samples
- **Details Sidebar** - View and edit node details with directional relationship information (incoming/outgoing)
- **Connection Management** - Add and remove relationships from the sidebar
- **Smart Relationship Updates** - Adding a relationship between already-connected nodes updates the existing connection
- **Guided Tour** - Interactive 7-step walkthrough with spotlights highlighting key UI elements for new users
- **Help Overlay** - Quick reference for navigation controls with option to restart guided tour
- **Portable Desktop Apps** - Zero-install executables for Windows and macOS

## Usage Guide

### Basic Interaction
- **Click a node** - Select it and open the details sidebar
- **Search bar** - Type to find people/projects, click result to focus on that node
- **Scroll** - Zoom in/out (centered on cursor position)
- **Drag background** - Pan the view
- **+/- buttons** - Precise zoom control
- **Click background** - Deselect all nodes
- **Layout toggle** - Click Force/Spiral in legend to switch layout modes

### Multi-Select
- **Ctrl+Click (Windows/Linux)** or **Cmd+Click (macOS)** - Add nodes to selection
- Selected nodes show in the Focus Overlay at bottom of screen
- **Click "View Focused"** - Enter focused view showing only selected nodes
- **Click node chip** - Switch sidebar to show that node's details (keeps all nodes focused)
- **Click X button** - Remove a node from focus

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

Method 1: Use “Open Anyway” (Recommended)

Immediately after seeing the warning:

Click Cancel or Done
(do not repeatedly try to reopen the app)

Open System Settings (or System Preferences on older macOS).

Go to Privacy & Security and scroll to the bottom.

Look for a message saying “Graph Weaver was blocked from use”, then click Open Anyway.

⚠️ This option only appears for about one hour after the block occurs.

Unlock the padlock if prompted and enter your administrator password.

When the final warning appears, click Open.

After this, macOS will remember your choice and the app will open normally in the future.

Method 2: Terminal Fallback (If “Open Anyway” Does Not Appear)

⚠️ Only use this method if you trust the source of the application.

Open Terminal:

Applications → Utilities → Terminal


Type the following command (do not press Enter yet):

sudo xattr -cr 


Drag Graph Weaver.app into the Terminal window to auto-fill the file path.

Press Return, then enter your administrator password
(no characters will appear while typing — this is normal).

Close Terminal and open Graph Weaver again.

The app should now launch without being blocked.

Development Setup

Open Terminal and navigate to the extracted project folder:

cd /path/to/extracted/folder
ls
cd Graph-Weaver-1


Install dependencies:

npm install


Start the development server:

npm run dev


Open your browser and go to:

http://localhost:5000

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

- **Frontend**: React, D3-Force, Tailwind CSS, Framer Motion
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
