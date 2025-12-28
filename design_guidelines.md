# Design Guidelines: 2D Sci-Fi Graph Visualization

## Design Approach
**Reference-Based Approach**: Sci-fi movie aesthetic inspired by films like Tron, Blade Runner 2049, and The Matrix - featuring neon glows, dark space backgrounds, holographic effects, and futuristic typography.

## Core Design Principles
1. **Cinematic Immersion**: Dark, space-like environment with glowing elements
2. **Clarity Through Contrast**: Bright neon elements against deep backgrounds for readability
3. **Accessible Complexity**: Sophisticated visuals with intuitive interactions for non-technical users
4. **Consistent Scaling**: Labels and edges maintain constant on-screen size across all zoom levels

## Color Palette
- **Background**: Deep space black (#0a0e27) with subtle grid pattern
- **Person Nodes**: Electric cyan (#00ffff) - circles
- **Project Nodes**: Neon purple (#b026ff) - rectangles with rounded corners
- **Edges/Connections**: Color-coded by relationship type with glow effects
- **UI Elements**: Transparent panels with cyan/purple borders and backdrop blur
- **Text**: White (#ffffff) and light cyan (#a0f0ff) for hierarchy
- **Accents**: Glowing highlights using box-shadow with cyan/purple

## Edge Color Coding
- **assigned_to**: Green (#22c55e)
- **collaborates_with**: Blue (#3b82f6)
- **consults_on**: Yellow (#eab308)
- **manages**: Orange (#f97316)
- **reports_to**: Pink (#ec4899)
- **default**: Gray (#6b7280)

## Typography
- **Primary Font**: System sans-serif for headers - clean, modern
- **Secondary Font**: Monospace for data/labels - technical feel
- **Body Font**: "Inter" for descriptions - clean, readable
- **Sizes**: Large titles (32-40px), section headers (20-24px), body (14-16px), labels (9-10px base with inverse scaling)

## Layout System
**Spacing Units**: Tailwind 2, 4, 6, 8 for consistent rhythm

### Main Canvas (2D SVG Viewport)
- Full-screen SVG canvas occupying majority of viewport
- Fixed top navigation bar with dark background and glowing border-bottom
- Floating sidebar panel (right side) with glassmorphic effect
- Bottom legend bar explaining node types and edge colors
- Focus overlay at bottom showing selected nodes when in multi-select mode

### Graph Layout
- **Vertical Stratification**: Projects positioned at top (y ~ 150), people at bottom (y ~ height - 150)
- **Dual Layout Modes**: 
  - **Force-Directed**: D3 force simulation with collision detection and centering
  - **Spiral**: Stratified layout with projects in curved rows at top, persons in arc pattern at bottom
- **Floating Animation**: Subtle "solar system" orbital motion for organic feel (both layout modes)
- **Pan & Zoom**: Scroll wheel zoom (0.3x - 4x range), drag to pan, +/- button controls

### Component Structure

**Navigation Bar** (Top, fixed):
- Logo/title on left with glow effect
- Center: Search bar with autocomplete dropdown for finding nodes by name/type
- Right: Add Node button, action buttons, Theme toggle (dark/light mode)
- Background: rgba(10, 14, 39, 0.9) with border-b-2 border-cyan-500 glow

**Search Bar**:
- Input with search icon, placeholder "Search people & projects..."
- Google-style ranking: names starting with query appear first, then names containing query
- Autocomplete dropdown showing matching nodes (both people and projects) with type icons
- Cyan styling matching sci-fi theme
- Selecting a result focuses on that node and clears any type filter

**2D Canvas** (Main viewport):
- Dark gradient background (#0a0e27 to #1a1e3f)
- Nodes render as glowing shapes with pulsing animation on selection
- Edge lines with color coding and inverse-scaled stroke width
- SVG transform for pan/zoom operations

**Sidebar Panel** (Right, floating):
- Width: w-96, positioned absolute right-4 top-20
- Glassmorphic background: backdrop-blur-xl with rgba(20, 24, 59, 0.8)
- Border: 1px solid rgba(0, 255, 255, 0.3) with outer glow
- Padding: p-6
- Sections: Node details, incoming connections, outgoing connections, actions

**Legend Bar** (Bottom, fixed):
- Height: h-20, bottom-0 position
- Horizontal layout with node type indicators and edge color samples
- Each indicator: colored shape + label
- Background: matching navigation bar style

**Focus Overlay** (Bottom, conditional):
- Appears when nodes are selected
- Shows selected node chips with X buttons for removal
- "View Focused" button to enter focused subgraph view
- Click chips to reorder selection and update sidebar

## Component Library

### Node Representation (2D SVG)
- **Person**: Cyan circles with semi-transparent fill and solid stroke
- **Project**: Purple rectangles with rounded corners (rx=6)
- **Size**: Base size 20-24px, scales with selection state (1.15x focused, 1.3x selected)
- **Glow Effect**: SVG filter with gaussian blur for neon glow
- **Hover State**: Cursor pointer, no size change to prevent layout shift
- **Selected State**: Bright pulsing ring animation, outer halo

### Edge Connections
- **Line Style**: Straight lines between node centers
- **Width**: 2.5px base (4px highlighted), inverse-scaled with zoom for constant screen size
- **Color**: Based on relationship_type with fallback to gray
- **Opacity**: 0.75 normal, 0.2 faded (non-connected in focus mode), 1.0 highlighted
- **Glow**: SVG filter matching edge color

### Label Rendering
- **Font**: White with text shadow for readability
- **Size**: 9-10px base, inverse-scaled with zoom: fontSize / clamp(scale, 0.3, 4)
- **Position**: Centered on node
- **Truncation**: Names > 8 characters truncated with ".."

### Zoom Controls
- **Info Box**: Bottom-left showing "Scroll: Zoom | Drag: Pan"
- **Buttons**: +/- buttons bottom-right for precise zoom control
- **Reset**: Zoom buttons work in both full view and focused view modes

### Sidebar Content Structure
1. **Header Section** (p-4, border-b):
   - Node type badge with matching color
   - Display name in large font
   - Close button (X) top-right

2. **Details Section** (p-4):
   - Description text
   - Metadata: node type, ID

3. **Incoming Connections Section** (p-4, border-t):
   - List of nodes that connect TO this node
   - Each connection: icon + name + relationship type + delete button
   - Clickable to navigate to that node

4. **Outgoing Connections Section** (p-4, border-t):
   - List of nodes this node connects TO
   - Each connection: icon + name + relationship type + delete button
   - Clickable to navigate to that node

5. **Actions Section** (p-4, border-t):
   - Edit button (primary: cyan glow)
   - Delete button (danger: red glow)
   - Add connection button (secondary)

### Buttons
- **Primary**: bg-cyan-500/20, border-cyan-500, text-cyan-400, hover glow increase
- **Secondary**: bg-purple-500/20, border-purple-500, text-purple-400
- **Danger**: bg-red-500/20, border-red-500, text-red-400
- **All buttons**: rounded-lg, px-6 py-3, backdrop-blur, transition-all

### Cards/Panels
- Background: rgba(20, 24, 59, 0.6)
- Border: 1px solid rgba(0, 255, 255, 0.2)
- Border-radius: 12px
- Box-shadow: 0 0 20px rgba(0, 255, 255, 0.15)
- Backdrop-filter: blur(20px)

## Interactive Elements

### Node Click Interaction
1. Click node - select it and open sidebar
2. Ctrl/Cmd+Click - add to multi-selection
3. Click in focused overlay chips - switch primary node (sidebar updates)
4. Connected edges highlight with brighter glow
5. Other nodes slightly dim in focused mode (opacity: 0.25)

### Zoom & Pan Controls
- Scroll wheel: zoom centered on cursor
- Drag background: pan view
- +/- buttons: precise zoom steps (0.8x / 1.2x)
- Zoom range: 0.3x minimum, 4x maximum
- Transform persists across view mode changes

### Legend Interactivity
- Displays all relationship types with color samples
- Shows node type indicators (cyan circle = person, purple rectangle = project)

### Focus Mode
- Enter by selecting nodes and clicking "View Focused"
- Shows only focused nodes and edges between them
- Exit by clicking "Exit Focus" or clicking background

## Animations
**Minimal but Impactful**:
- Node pulse ring: CSS animation for selected nodes
- Floating motion: Subtle orbital animation using sine waves
- Sidebar enter: slide-in-right 0.3s ease-out
- Button hover: glow intensity increase 0.2s
- Transitions: opacity and transform with 0.3-0.4s ease-out
- No distracting scroll or parallax effects

## Accessibility
- High contrast ratios (neon on dark)
- Keyboard navigation for all controls
- Clear focus indicators with cyan outline
- Inverse scaling keeps text readable at all zoom levels
- Simple language in all UI text
- Confirmation dialogs before destructive actions

## Non-Technical User Considerations
- Prominent legend explaining colors/shapes
- Tooltips on hover explaining controls
- Interactive guided tour for first-time users with step-by-step highlights
- "Help" overlay with visual guide and option to restart tour
- Simple language in all UI text
- Alphabetically sorted dropdowns for easy finding
- Directional relationship display (incoming vs outgoing)
- Confirmation dialogs before destructive actions

## Responsive Design
- **Breakpoints**: 640px (sm) for tablets, default for phones
- **Header**: Compact on mobile - icon only, smaller search, fewer buttons
- **Sidebar**: Full-screen overlay with backdrop on mobile, fixed width on desktop
- **Legend**: Single row with icon-only layout toggles on mobile
- **Modals**: Reduced padding on mobile, full-width buttons
- **Tour**: Centered tooltips on mobile for better visibility
- **Focus Overlay**: Full-width on mobile, centered on desktop

## Guided Tour Design
- **Overlay**: Dark semi-transparent backdrop (60% opacity) with pointer-events disabled for click-through
- **Spotlight**: Cyan border glow around highlighted element (shows for all steps with target elements)
- **Tooltip**: Sci-fi styled card with gradient background, cyan border, glow effect, pointer-events enabled
- **Navigation**: Progress dots, Back/Next buttons, Skip option (all 7 steps fully navigable)
- **Steps**: Welcome, Search Bar, Graph Nodes, Layout Controls, Pan & Zoom, Focus View, Tour Complete
- **Trigger**: Automatically shows for first-time users, accessible via Help overlay

## Images
No images required - SVG rendered graphics serve as the primary visual content. The sci-fi aesthetic is achieved entirely through SVG filters, glow effects, and CSS treatments.
