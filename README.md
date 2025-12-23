# Network Graph - 3D Interactive Visualization

A 3D interactive graph visualization web application featuring a sci-fi aesthetic with neon colors and dark space backgrounds. View and manage relationships between people and projects with full CRUD operations.

Available as both a web application and portable desktop apps for Windows and macOS.

## Features

- **3D Graph Visualization** - Interactive graph using React Three Fiber
- **Sci-Fi Aesthetic** - Cyan nodes for people, purple for projects, color-coded relationships
- **Full CRUD Operations** - Add, edit, and delete nodes and relationships
- **Filtered Views** - View individual person activities or project team compositions
- **Custom Relationships** - Create your own relationship types
- **Semi-transparent UI** - Graph remains visible behind modals and sidebar
- **Portable Desktop Apps** - Zero-install executables for Windows and macOS

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