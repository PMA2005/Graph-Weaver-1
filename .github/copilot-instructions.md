# Graph Weaver - AI Coding Agent Instructions

## Project Overview
3D interactive graph visualization app with sci-fi aesthetic. Visualizes relationships between people and projects using React Three Fiber. Full-stack TypeScript with Express backend and SQLite storage. Available as web app and portable desktop executables (Electron).

## Architecture

### Monorepo Structure
- `client/` - React SPA with Vite
- `server/` - Express API server
- `shared/` - Zod schemas shared between client/server
- `electron/` - Electron desktop wrapper
- `attached_assets/` - SQLite database file (dev seed)

### Key Architectural Decisions
- **Storage Layer**: Uses `server/storage.ts` (SQLiteStorage class) as abstraction over direct database access. All CRUD operations go through this interface.
- **Database Confusion**: Despite `drizzle.config.ts` and `server/db.ts` referencing PostgreSQL, the actual runtime uses SQLite via `better-sqlite3`. The Drizzle setup appears unused. Always work with SQLiteStorage in `server/storage.ts`.
- **Path Aliases**: Three aliases configured in `vite.config.ts`:
  - `@/` → `client/src/`
  - `@shared` → `shared/`
  - `@assets` → `attached_assets/`
- **Type Safety**: Zod schemas in `shared/schema.ts` define types. Use `insertNodeSchema` and `insertEdgeSchema` for validation in routes.
- **Electron Runtime**: In production desktop builds, Electron starts Express in-process, loads from `http://127.0.0.1:<dynamic-port>`. Database lives in userData directory, not app bundle.

### Data Flow
1. Client queries via TanStack Query → `queryClient.ts` helper
2. Express routes in `server/routes.ts` validate with Zod
3. CRUD operations delegated to `storage.ts` methods
4. SQLite database:
   - Dev: `attached_assets/graph2_1765932308440.db`
   - Production Desktop: `app.getPath('userData')/graph.db`

## Development Workflow

### Starting Development (Web)
```bash
npm install
npm run dev  # Runs tsx server/index.ts, serves Vite dev server
```
Server runs on port 5000 (configurable via `PORT` env var)

**Node Version**: Project requires Node.js 20.x. Use `nvm use 20` if using nvm.

### Testing Electron Locally
```bash
# Terminal 1: Start web server
npm run dev

# Terminal 2: Launch Electron
npm run electron:dev
```

### Database Commands
```bash
# Query nodes directly
sqlite3 attached_assets/graph2_1765932308440.db "SELECT * FROM nodes;"

# Schema push (though SQLite auto-initializes)
npm run db:push
```

### Building for Production
```bash
npm run build  # Runs script/build.ts

# Desktop builds (MUST run on native platform)
npm run electron:pack:mac  # macOS only - outputs .app
npm run electron:pack:win  # Windows only - outputs .exe
```

**Build Process Flow** (via `script/build.ts`):
1. Clears `dist/` directory
2. Runs `vite build` → outputs to `dist/public/`
3. Runs `esbuild` on `server/index.ts` → outputs to `dist/index.cjs`
4. Bundles allowlisted deps, externalizes others (see `allowlist` array)
5. For Electron: runs `tsc` in `electron/` → outputs to `electron/dist/`

**Critical**: Native module `better-sqlite3` requires platform-specific builds. Platform guard script prevents cross-compilation.

## Electron Integration Patterns

### Environment Variables (Production Desktop)
- `NODE_ENV=production` - Enables production mode
- `PORT=<dynamic>` - Express binds to dynamically chosen port (5000-5010)
- `GRAPH_DB_PATH=<userData>/graph.db` - Database location

### Database Seeding
On first desktop app launch, `electron/src/serverRunner.ts`:
1. Checks if `graph.db` exists in userData
2. If not, copies seed from `attached_assets/graph2_*.db`
3. Never writes to install directory (read-only on macOS)

### Server Startup Flow (Desktop)
1. `main.ts` calls `startServer()` from `serverRunner.ts`
2. `serverRunner` finds available port via socket probing
3. Sets env vars (`PORT`, `GRAPH_DB_PATH`, `NODE_ENV`)
4. Requires built server: `server/dist/index.cjs`
5. Polls `/api/health` until server ready
6. Returns `{ port, close() }`
7. `BrowserWindow` loads `http://127.0.0.1:<port>`

### Security Model
- `contextIsolation: true` - Renderer cannot access Node APIs
- `nodeIntegration: false` - No require() in renderer
- `sandbox: true` - Additional isolation
- `preload.ts` - Minimal or empty (no APIs exposed currently)
- Client communicates via standard HTTP fetch (same as web version)

## Critical Patterns

### Adding API Endpoints
1. Add route in `server/routes.ts` following RESTful pattern
2. Validate request body with Zod schemas from `@shared/schema`
3. Call corresponding `storage.ts` method
4. Handle errors with try-catch, return appropriate status codes

Example:
```typescript
app.post("/api/nodes", (req, res) => {
  const parsed = insertNodeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid node data" });
  }
  const node = storage.createNode(parsed.data);
  res.status(201).json(node);
});
```

### UI State Management
- TanStack Query for server state (`useQuery`, `useMutation`)
- React local state for UI (modals, selected nodes)
- Query invalidation pattern: `queryClient.invalidateQueries({ queryKey: ['/api/graph'] })`
- Toast notifications via `useToast()` hook
- All mutations defined in `home.tsx` - keep CRUD logic centralized there

**Mutation Pattern Example:**
```typescript
const addNodeMutation = useMutation({
  mutationFn: async (node) => apiRequest('POST', '/api/nodes', node),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/graph'] });
    setShowModal(false);
    toast({ title: 'Success', description: 'Node added' });
  },
  onError: () => {
    toast({ title: 'Error', variant: 'destructive' });
  },
});
```

### 3D Visualization Conventions
- Node types determine shape: `person` = sphere, `project` = box (see `Graph3DCanvas.tsx`)
- Color mapping in `NODE_TYPE_COLORS` and `RELATIONSHIP_COLORS` constants
- Node positions calculated by `calculateNodePositions()` using circular layout
- Selected nodes trigger sidebar; hover effects scale nodes 1.1x

### Design System
Follows `design_guidelines.md`:
- Sci-fi aesthetic: dark backgrounds (#0a0e27), neon cyan/purple accents
- Typography: Orbitron for headers, Space Mono for data
- UI components from `client/src/components/ui/` (shadcn/ui)
- Glassmorphic panels: `backdrop-blur-xl` with semi-transparent backgrounds

## Electron-Specific Operations

### Modifying Build Configuration
Edit `build` section in root `package.json`:
- `files`: Controls what gets packaged (ONLY include dist folders)
- `asar`: true (with `asarUnpack` for `.node` files)
- `mac.target`: `["dir"]` for portable .app (no DMG)
- `win.target`: `["portable"]` for portable .exe (no installer)

### Adding Assets to Desktop Build
1. Place file in appropriate location (e.g., `attached_assets/`)
2. Update `files` array in `package.json` build config
3. Add to `asarUnpack` if file needs filesystem access (like `.node` modules)
4. Reference via absolute paths in code using `__dirname` or `app.getPath()`

### Handling Native Modules
better-sqlite3 is already configured correctly:
- Packaged in ASAR but unpacked via `asarUnpack: ["**/*.node"]`
- Platform-specific builds enforced by `script/pack-guard.js`
- electron-builder automatically rebuilds for Electron's Node version

### Module Type Configuration (CRITICAL)
The root `package.json` has `"type": "module"` for Vite/ESM support, but Electron requires CommonJS:
- `electron-package.json` - Minimal package.json WITHOUT `"type": "module"`
- Build config copies this as root `package.json` in ASAR via:
  ```json
  {
    "from": "electron-package.json",
    "to": "package.json"
  }
  ```
- This prevents "exports is not defined in ES module scope" error
- **Never remove this mapping** - Electron will fail without it

## Common Operations

### Adding New Node Types
1. Update `NODE_TYPE_COLORS`, `NODE_TYPE_SHAPES` in `Graph3DCanvas.tsx`
2. Add to legend in `GraphLegend.tsx`
3. No backend changes needed (node_type is freeform string)

### Adding Relationship Types
1. Add color to `RELATIONSHIP_COLORS` in `Graph3DCanvas.tsx`
2. Update legend and UI selectors in modals
3. No schema changes needed

### Modifying Database Schema
1. Edit table creation in `storage.ts` `initializeTables()`
2. Update Zod schemas in `shared/schema.ts`
3. Restart server (SQLite auto-migrates on next run)
4. For desktop: Users get fresh schema on new installs; existing users need migration logic

## Important Files
- `client/src/pages/home.tsx` - Main app orchestration, all mutation logic
- `server/storage.ts` - Single source of truth for data operations
- `shared/schema.ts` - Type definitions for entire app
- `client/src/components/Graph3DCanvas.tsx` - 3D rendering logic
- `electron/src/main.ts` - Electron app entry point
- `electron/src/serverRunner.ts` - Express lifecycle management for desktop
- `electron-package.json` - Electron-specific package.json (replaces root in builds)
- `design_guidelines.md` - Visual design specifications

## Gotchas
- Database path is environment-dependent: dev uses `attached_assets/`, production uses userData
- Drizzle/PostgreSQL config exists but is NOT used at runtime
- Deleting a node cascades to its edges (handled in `storage.deleteNode()`)
- Edge deletion requires source + target + relationship_type for uniqueness
- The app uses `dark` class wrapper in `App.tsx` for Tailwind dark mode
- First-time visitors auto-show help overlay (localStorage flag)
- Desktop builds MUST be created on native platform (no cross-compilation)
- Express binds to `127.0.0.1` for security (not `0.0.0.0` except on Replit)
- Server health endpoint (`/api/health`) is required for Electron startup polling

## Troubleshooting

### Native Module Build Failures
If `better-sqlite3` fails to build during `electron:pack:*`:
- **Root cause**: Requires C++ compiler toolchain (Xcode Command Line Tools on macOS)
- **Solution**: Install via `xcode-select --install` on macOS
- **Why**: electron-builder rebuilds native modules for Electron's Node version
- **Error signs**: "fatal error: 'climits' file not found", "prebuild-install failed"
- **Alternative**: Ensure Node.js version compatibility (project uses Node 20+)

### Port Conflicts
If dev server won't start on port 5000:
- Check `PORT` env var or edit `server/index.ts`
- Electron dev mode assumes port 5000 by default

### Database Issues
- If tables don't exist: delete `.db` file and restart (auto-recreates)
- Schema changes: restart server, SQLite re-initializes via `initializeTables()`
- Electron first-run: seed copied from `attached_assets/graph2_*.db`

