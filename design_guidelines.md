# Design Guidelines: 3D Sci-Fi Graph Visualization

## Design Approach
**Reference-Based Approach**: Sci-fi movie aesthetic inspired by films like Tron, Blade Runner 2049, and The Matrix - featuring neon glows, dark space backgrounds, holographic effects, and futuristic typography.

## Core Design Principles
1. **Cinematic Immersion**: Dark, space-like environment with glowing elements
2. **Clarity Through Contrast**: Bright neon elements against deep backgrounds for readability
3. **Accessible Complexity**: Sophisticated visuals with intuitive interactions for non-technical users

## Color Palette
- **Background**: Deep space black (#0a0e27) with subtle star field or grid pattern
- **Primary Nodes**: Electric cyan (#00ffff), neon purple (#b026ff), bright magenta (#ff006e)
- **Secondary Nodes**: Teal (#00d9ff), lime green (#39ff14), orange (#ff6b35)
- **Edges/Connections**: Semi-transparent cyan (#00ffff40) with glow effects
- **UI Elements**: Transparent panels with cyan/purple borders and backdrop blur
- **Text**: White (#ffffff) and light cyan (#a0f0ff) for hierarchy
- **Accents**: Glowing highlights using box-shadow with cyan/purple

## Typography
- **Primary Font**: "Orbitron" or "Rajdhana" (Google Fonts) for headers - futuristic, geometric
- **Secondary Font**: "Space Mono" or "Share Tech Mono" for data/labels - monospaced, technical
- **Body Font**: "Inter" for descriptions - clean, readable
- **Sizes**: Large titles (32-40px), section headers (20-24px), body (14-16px), labels (12-14px)

## Layout System
**Spacing Units**: Tailwind 2, 4, 6, 8 for consistent rhythm

### Main Canvas (3D Viewport)
- Full-screen 3D canvas occupying majority of viewport
- Fixed top navigation bar (h-16) with dark background and glowing border-bottom
- Floating sidebar panel (right side, w-96) with glassmorphic effect
- Bottom legend bar (h-20) explaining node types

### Component Structure

**Navigation Bar** (Top, fixed):
- Logo/title on left with glow effect
- Center: View controls (rotate, zoom reset, layout toggle)
- Right: Export button, settings icon
- Background: rgba(10, 14, 39, 0.9) with border-b-2 border-cyan-500 glow

**3D Canvas** (Main viewport):
- Dark gradient background (#0a0e27 to #1a1e3f)
- Particle system or subtle grid for depth
- Nodes render as glowing 3D spheres/octahedrons with pulsing animation
- Edge lines with gradient transparency and subtle glow
- Camera controls: orbit, pan, zoom via mouse/touch

**Sidebar Panel** (Right, floating):
- Width: w-96, positioned absolute right-4 top-20
- Glassmorphic background: backdrop-blur-xl with rgba(20, 24, 59, 0.8)
- Border: 1px solid rgba(0, 255, 255, 0.3) with outer glow
- Padding: p-6
- Sections with glowing dividers between them

**Legend Bar** (Bottom, fixed):
- Height: h-20, bottom-0 position
- Horizontal layout with node type indicators
- Each indicator: colored circle + label in grid format
- Background: matching navigation bar style

## Component Library

### Node Representation (3D)
- **Shape Variations**: Spheres (people), cubes (projects), diamonds (milestones)
- **Size**: Scale based on importance/connections (1x to 2.5x base size)
- **Glow Effect**: Outer halo matching node color
- **Hover State**: Increase glow intensity, slight scale up (1.1x)
- **Selected State**: Bright pulsing glow, connecting edges highlight

### Edge Connections
- **Line Style**: Curved tubes with gradient transparency
- **Width**: Based on weight (1-4px equivalent in 3D)
- **Label**: Relationship type in small monospace font, billboard effect
- **Animation**: Subtle particle flow along edges (optional based on performance)

### Sidebar Content Structure
1. **Header Section** (p-4, border-b):
   - Node type badge with matching color
   - Display name in large Orbitron font
   - Close button (X) top-right

2. **Details Section** (p-4):
   - Description with Space Mono font
   - Metadata grid: 2-column layout for properties
   - Each property: label (cyan) + value (white)

3. **Connections Section** (p-4, border-t):
   - List of connected nodes
   - Each connection: icon + name + relationship type
   - Clickable to navigate to that node

4. **Actions Section** (p-4, border-t):
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
1. Click node → camera smoothly focuses on node
2. Sidebar slides in from right with node details
3. Connected edges highlight with brighter glow
4. Other nodes slightly dim (opacity: 0.4)

### Camera Controls
- Orbital rotation: drag to rotate around graph center
- Zoom: scroll wheel or pinch gesture
- Pan: right-click drag or two-finger drag
- Reset button returns to default view

### Legend Interactivity
- Click node type in legend → filter view to show only that type
- Hover legend item → highlight matching nodes in 3D view

## Animations
**Minimal but Impactful**:
- Node glow pulse: 2s ease-in-out infinite
- Sidebar enter: slide-in-right 0.3s ease-out
- Button hover: glow intensity increase 0.2s
- Camera transitions: smooth easing over 0.8s
- No distracting scroll or parallax effects

## Accessibility
- High contrast ratios (neon on dark)
- Keyboard navigation for all controls
- ARIA labels for 3D elements
- Alternative 2D view toggle for accessibility
- Clear focus indicators with cyan outline

## Non-Technical User Considerations
- Prominent legend explaining colors/shapes
- Tooltips on hover explaining controls
- "Help" overlay with visual guide on first load
- Simple language in all UI text
- Undo/redo for all edit actions
- Confirmation dialogs before destructive actions

## Images
No images required - 3D rendered graphics serve as the primary visual content. The sci-fi aesthetic is achieved entirely through WebGL/Three.js rendering, particle effects, and CSS treatments.