# Network Graph - 3D Interactive Visualization

A 3D interactive graph visualization web application featuring a sci-fi aesthetic with neon colors and dark space backgrounds. View and manage relationships between people and projects with full CRUD operations.

## Features

- **3D Graph Visualization** - Interactive graph using React Three Fiber
- **Sci-Fi Aesthetic** - Cyan nodes for people, purple for projects, color-coded relationships
- **Full CRUD Operations** - Add, edit, and delete nodes and relationships
- **Filtered Views** - View individual person activities or project team compositions
- **Custom Relationships** - Create your own relationship types
- **Semi-transparent UI** - Graph remains visible behind modals and sidebar

## Running Locally

### Prerequisites

Install Node.js version 20 or higher from [nodejs.org](https://nodejs.org)

### macOS

1. Download or clone this project

2. Open **Terminal** and navigate to the project folder:
   ```bash
   cd /path/to/your/project
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser to:
   ```
   http://localhost:5000
   ```

### Windows

1. Download or clone this project

2. Open **Command Prompt** or **PowerShell** and navigate to the project folder:
   ```cmd
   cd C:\path\to\your\project
   ```

3. Install dependencies:
   ```cmd
   npm install
   ```

4. Start the development server:
   ```cmd
   npm run dev
   ```

5. Open your browser to:
   ```
   http://localhost:5000
   ```

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
