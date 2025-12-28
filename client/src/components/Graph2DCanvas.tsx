import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import * as d3Force from 'd3-force';

export type ViewMode = 'global' | 'focused';
export type LayoutMode = 'force' | 'spiral';

interface GraphNode {
  node_id: string;
  display_name: string;
  description: string;
  node_type: string;
}

interface GraphEdge {
  source_node: string;
  target_node: string;
  relationship_type: string;
  weight?: number;
}

interface Graph2DCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNode: GraphNode | null;
  selectedNodeIds?: Set<string>;
  onNodeSelect: (node: GraphNode | null, multiSelect?: boolean | { ctrlKey?: boolean; metaKey?: boolean }) => void;
  viewMode: ViewMode;
  layoutMode?: LayoutMode;
  focusedNodes: GraphNode[];
  focusedEdges: GraphEdge[];
  onResetView: () => void;
}

const NODE_TYPE_COLORS: Record<string, string> = {
  person: '#00ffff',
  project: '#b026ff',
  default: '#ff6b35',
};

const NODE_TYPE_LABELS: Record<string, string> = {
  person: 'Person',
  project: 'Project',
  default: 'Node',
};

const RELATIONSHIP_COLORS: Record<string, string> = {
  assigned_to: '#22c55e',
  collaborates_with: '#3b82f6',
  consults_on: '#eab308',
  manages: '#f97316',
  reports_to: '#ec4899',
  custom: '#00ffff',
  default: '#00ffff',
};

function getEdgeColor(relationshipType: string): string {
  return RELATIONSHIP_COLORS[relationshipType] || RELATIONSHIP_COLORS.default;
}

interface SimNode {
  id: string;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  node: GraphNode;
}

interface SimLink {
  source: string | SimNode;
  target: string | SimNode;
  edge: GraphEdge;
}

function useForceSimulation2D(
  nodes: GraphNode[],
  edges: GraphEdge[],
  isActive: boolean,
  width: number,
  height: number
): Record<string, [number, number]> {
  const [positions, setPositions] = useState<Record<string, [number, number]>>({});
  const simulationRef = useRef<d3Force.Simulation<SimNode, SimLink> | null>(null);
  const nodesRef = useRef<SimNode[]>([]);
  const smoothedPositionsRef = useRef<Record<string, [number, number]>>({});
  const lastNodeIdsRef = useRef<string>('');
  const lastEdgeIdsRef = useRef<string>('');
  const lerpFactor = 0.18; // Lower = smoother but slower response

  // Memoize node/edge identity to avoid unnecessary simulation restarts
  // Include relationship_type in edge signature to detect relationship type changes
  const nodeIds = useMemo(() => nodes.map(n => n.node_id).sort().join(','), [nodes]);
  const edgeIds = useMemo(() => edges.map(e => `${e.source_node}-${e.target_node}-${e.relationship_type}`).sort().join(','), [edges]);

  useEffect(() => {
    if (!isActive || nodes.length === 0 || width === 0 || height === 0) {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
      return;
    }

    // Check if we can incrementally update instead of recreating
    const nodesChanged = nodeIds !== lastNodeIdsRef.current;
    const edgesChanged = edgeIds !== lastEdgeIdsRef.current;
    const hasExistingSimulation = simulationRef.current && nodesRef.current.length > 0;

    // If only edges changed and simulation exists, just update links
    if (hasExistingSimulation && !nodesChanged && edgesChanged) {
      const simLinks: SimLink[] = edges
        .filter(e => 
          nodesRef.current.some(n => n.id === e.source_node) && 
          nodesRef.current.some(n => n.id === e.target_node)
        )
        .map(edge => ({
          source: edge.source_node,
          target: edge.target_node,
          edge,
        }));
      
      simulationRef.current!.force('link', d3Force.forceLink(simLinks)
        .id((d: any) => d.id)
        .distance(180)
        .strength(0.12)
      );
      simulationRef.current!.alpha(0.3).restart();
      lastEdgeIdsRef.current = edgeIds;
      return;
    }

    // If nothing changed, don't recreate
    if (hasExistingSimulation && !nodesChanged && !edgesChanged) {
      return;
    }

    lastNodeIdsRef.current = nodeIds;
    lastEdgeIdsRef.current = edgeIds;

    const existingPositions = new Map<string, { x: number; y: number }>();
    nodesRef.current.forEach(n => {
      existingPositions.set(n.id, { x: n.x, y: n.y });
    });

    // Use full viewport for global layout
    const legendHeight = 80;
    const availableHeight = height - legendHeight;
    const centerX = width / 2;
    const centerY = availableHeight / 2;
    const spreadX = width * 0.4;
    const spreadY = availableHeight * 0.32;

    const simNodes: SimNode[] = nodes.map((node, i) => {
      const existing = existingPositions.get(node.node_id);
      const angle = (i / nodes.length) * Math.PI * 2;
      const isProject = node.node_type.toLowerCase() === 'project';
      const verticalOffset = isProject ? -spreadY : spreadY;
      return {
        id: node.node_id,
        x: existing?.x ?? centerX + Math.cos(angle) * spreadX + (Math.random() - 0.5) * 80,
        y: existing?.y ?? centerY + verticalOffset + (Math.random() - 0.5) * 40,
        node,
      };
    });

    const simLinks: SimLink[] = edges
      .filter(e => 
        simNodes.some(n => n.id === e.source_node) && 
        simNodes.some(n => n.id === e.target_node)
      )
      .map(edge => ({
        source: edge.source_node,
        target: edge.target_node,
        edge,
      }));

    nodesRef.current = simNodes;

    const createYForce = () => {
      let nodes: SimNode[] = [];
      const force = (alpha: number) => {
        nodes.forEach(node => {
          const isProject = node.node.node_type.toLowerCase() === 'project';
          const targetY = isProject ? centerY - spreadY : centerY + spreadY;
          node.vy = (node.vy || 0) + (targetY - node.y) * alpha * 0.25;
        });
      };
      force.initialize = (n: SimNode[]) => { nodes = n; };
      return force;
    };

    // Create gentle drift force for continuous floating motion
    const createDriftForce = () => {
      let nodes: SimNode[] = [];
      let time = 0;
      const force = (alpha: number) => {
        time += 0.02;
        nodes.forEach((node, i) => {
          // Gentle orbital drift - each node has unique phase
          const phase = (i / nodes.length) * Math.PI * 2;
          const driftStrength = 0.3;
          node.vx = (node.vx || 0) + Math.sin(time + phase) * driftStrength * alpha;
          node.vy = (node.vy || 0) + Math.cos(time + phase * 1.5) * driftStrength * 0.5 * alpha;
        });
      };
      force.initialize = (n: SimNode[]) => { nodes = n; };
      return force;
    };

    // Create bounds force - gentle nudges that increase near edges
    const createBoundsForce = () => {
      let nodes: SimNode[] = [];
      const padding = 80;
      const force = (alpha: number) => {
        const strength = 0.8;
        nodes.forEach(node => {
          // Gentle nudge back toward center when near edges
          if (node.x < padding) {
            node.vx = (node.vx || 0) + (padding - node.x) * alpha * strength;
          }
          if (node.x > width - padding) {
            node.vx = (node.vx || 0) + (width - padding - node.x) * alpha * strength;
          }
          if (node.y < padding) {
            node.vy = (node.vy || 0) + (padding - node.y) * alpha * strength;
          }
          if (node.y > availableHeight - padding) {
            node.vy = (node.vy || 0) + (availableHeight - padding - node.y) * alpha * strength;
          }
        });
      };
      force.initialize = (n: SimNode[]) => { nodes = n; };
      return force;
    };

    const simulation = d3Force.forceSimulation(simNodes)
      .force('link', d3Force.forceLink(simLinks)
        .id((d: any) => d.id)
        .distance(180)
        .strength(0.12)
      )
      .force('charge', d3Force.forceManyBody().strength(-400).distanceMax(500))
      .force('center', d3Force.forceCenter(centerX, centerY).strength(0.015))
      .force('collision', d3Force.forceCollide().radius(70).strength(0.6))
      .force('yAxis', createYForce())
      .force('bounds', createBoundsForce())
      .force('drift', createDriftForce())
      .alphaDecay(0.015)
      .velocityDecay(0.55)
      .alphaTarget(0.08); // Keep simulation running for continuous floating motion

    simulation.on('tick', () => {
      const newPositions: Record<string, [number, number]> = {};
      simNodes.forEach(node => {
        const prev = smoothedPositionsRef.current[node.id];
        if (prev) {
          // Lerp: smoothly interpolate toward target position
          const smoothedX = prev[0] + (node.x - prev[0]) * lerpFactor;
          const smoothedY = prev[1] + (node.y - prev[1]) * lerpFactor;
          newPositions[node.id] = [smoothedX, smoothedY];
        } else {
          // First frame - use exact position
          newPositions[node.id] = [node.x, node.y];
        }
      });
      smoothedPositionsRef.current = newPositions;
      setPositions(newPositions);
    });

    simulationRef.current = simulation;

    return () => {
      simulation.stop();
    };
  }, [nodes, edges, isActive, width, height]);

  return positions;
}

// Elliptical ring layout: projects and people share one large oval band, grouped by connections
function useSpiralLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  width: number,
  height: number
): Record<string, [number, number]> {
  const [animatedPositions, setAnimatedPositions] = useState<Record<string, [number, number]>>({});
  const animationRef = useRef<number | null>(null);
  const timeRef = useRef(0);

  // Calculate base positions
  const basePositions = useMemo(() => {
    if (nodes.length === 0 || width === 0 || height === 0) return {};

    const legendHeight = 80;
    const availableHeight = height - legendHeight;
    const centerX = width / 2;
    const centerY = availableHeight / 2;

    const projects = nodes.filter(n => n.node_type.toLowerCase() === 'project');
    const persons = nodes.filter(n => n.node_type.toLowerCase() === 'person');

    const result: Record<string, [number, number]> = {};

    // Build connection map: which people connect to which projects
    const personToProjects: Record<string, string[]> = {};
    const projectToPersons: Record<string, string[]> = {};
    
    edges.forEach(edge => {
      const sourceNode = nodes.find(n => n.node_id === edge.source_node);
      const targetNode = nodes.find(n => n.node_id === edge.target_node);
      if (!sourceNode || !targetNode) return;
      
      const sourceType = sourceNode.node_type.toLowerCase();
      const targetType = targetNode.node_type.toLowerCase();
      
      if (sourceType === 'person' && targetType === 'project') {
        if (!personToProjects[edge.source_node]) personToProjects[edge.source_node] = [];
        if (!personToProjects[edge.source_node].includes(edge.target_node)) {
          personToProjects[edge.source_node].push(edge.target_node);
        }
        if (!projectToPersons[edge.target_node]) projectToPersons[edge.target_node] = [];
        if (!projectToPersons[edge.target_node].includes(edge.source_node)) {
          projectToPersons[edge.target_node].push(edge.source_node);
        }
      } else if (sourceType === 'project' && targetType === 'person') {
        if (!personToProjects[edge.target_node]) personToProjects[edge.target_node] = [];
        if (!personToProjects[edge.target_node].includes(edge.source_node)) {
          personToProjects[edge.target_node].push(edge.source_node);
        }
        if (!projectToPersons[edge.source_node]) projectToPersons[edge.source_node] = [];
        if (!projectToPersons[edge.source_node].includes(edge.target_node)) {
          projectToPersons[edge.source_node].push(edge.target_node);
        }
      }
    });

    // Ellipse radii - wide oval shape
    const radiusX = width * 0.42;  // Horizontal radius
    const radiusY = availableHeight * 0.38;  // Vertical radius (slightly smaller for oval)
    const bandThickness = 35; // Radial jitter for ring thickness

    // Group persons by their primary project connection
    const projectGroups: Record<string, GraphNode[]> = {};
    const unconnectedPersons: GraphNode[] = [];
    
    projects.forEach(p => {
      projectGroups[p.node_id] = [];
    });

    persons.forEach(person => {
      const connectedProjects = personToProjects[person.node_id] || [];
      if (connectedProjects.length > 0) {
        const primaryProject = connectedProjects[0];
        if (projectGroups[primaryProject]) {
          projectGroups[primaryProject].push(person);
        } else {
          unconnectedPersons.push(person);
        }
      } else {
        unconnectedPersons.push(person);
      }
    });

    // Calculate total nodes to place (projects + their people as groups)
    // Each project group = 1 project + N people, placed together on the ring
    const totalSlots = nodes.length; // Total nodes to distribute
    
    // Calculate weighted angular spans - projects with more people get more space
    const groupSizes: { projectId: string; size: number }[] = projects.map(p => ({
      projectId: p.node_id,
      size: 1 + projectGroups[p.node_id].length // Project itself + connected people
    }));
    const unconnectedSize = unconnectedPersons.length;
    const totalSize = groupSizes.reduce((a, g) => a + g.size, 0) + unconnectedSize;

    // Seeded random for consistent jitter
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed * 12.9898) * 43758.5453;
      return x - Math.floor(x);
    };

    let currentAngle = -Math.PI / 2; // Start from top

    // Place each project group along the ellipse
    projects.forEach((project, projectIndex) => {
      const projectPersons = projectGroups[project.node_id];
      const groupSize = 1 + projectPersons.length;
      const angularSpan = (2 * Math.PI * groupSize) / totalSize;
      
      // Project goes at the start/center of its group's span
      const projectAngle = currentAngle + angularSpan * 0.15; // Slight offset from start
      
      // Calculate position on ellipse with slight inward offset for projects
      const projRadiusX = radiusX * 0.92;
      const projRadiusY = radiusY * 0.92;
      const projectX = centerX + Math.cos(projectAngle) * projRadiusX;
      const projectY = centerY + Math.sin(projectAngle) * projRadiusY;
      result[project.node_id] = [projectX, projectY];
      
      // Place connected people spread out after the project in the same span
      if (projectPersons.length > 0) {
        const personStartAngle = currentAngle + angularSpan * 0.25;
        const personAngularRange = angularSpan * 0.7;
        
        projectPersons.forEach((person, personIndex) => {
          const personCount = projectPersons.length;
          // Distribute evenly across the angular range
          const t = personCount > 1 ? personIndex / (personCount - 1) : 0.5;
          const angle = personStartAngle + t * personAngularRange;
          
          // Add radial jitter based on person index for ring thickness
          const jitterSeed = personIndex + projectIndex * 100;
          const radialJitter = (seededRandom(jitterSeed) - 0.5) * bandThickness * 2;
          
          // Alternate between inner and outer positions for variety
          const depthOffset = (personIndex % 3 - 1) * bandThickness * 0.6;
          
          const personRadiusX = radiusX + radialJitter + depthOffset;
          const personRadiusY = radiusY + radialJitter + depthOffset;
          
          const x = centerX + Math.cos(angle) * personRadiusX;
          const y = centerY + Math.sin(angle) * personRadiusY;
          result[person.node_id] = [x, y];
        });
      }
      
      currentAngle += angularSpan;
    });

    // Place unconnected persons in remaining space
    if (unconnectedPersons.length > 0) {
      const angularSpan = (2 * Math.PI * unconnectedSize) / totalSize;
      
      unconnectedPersons.forEach((person, i) => {
        const t = unconnectedPersons.length > 1 ? i / (unconnectedPersons.length - 1) : 0.5;
        const angle = currentAngle + t * angularSpan * 0.9 + angularSpan * 0.05;
        
        const jitterSeed = i + 9999;
        const radialJitter = (seededRandom(jitterSeed) - 0.5) * bandThickness * 2;
        const depthOffset = (i % 3 - 1) * bandThickness * 0.6;
        
        const personRadiusX = radiusX + radialJitter + depthOffset;
        const personRadiusY = radiusY + radialJitter + depthOffset;
        
        const x = centerX + Math.cos(angle) * personRadiusX;
        const y = centerY + Math.sin(angle) * personRadiusY;
        result[person.node_id] = [x, y];
      });
    }

    return result;
  }, [nodes, edges, width, height]);

  // Animation loop for floating effect
  useEffect(() => {
    if (Object.keys(basePositions).length === 0) {
      setAnimatedPositions({});
      return;
    }

    // Initialize with base positions immediately
    setAnimatedPositions(basePositions);

    const animate = () => {
      timeRef.current += 0.012; // Smooth animation speed
      const time = timeRef.current;
      
      const newPositions: Record<string, [number, number]> = {};
      const nodeIds = Object.keys(basePositions);
      
      nodeIds.forEach((id, index) => {
        const [baseX, baseY] = basePositions[id];
        // Unique phase for each node based on index
        const phase = (index * 0.7) % (Math.PI * 2);
        const amplitude = 15; // Bigger amplitude for more visible movement
        
        // Smooth orbital floating motion (like force layout)
        const dx = Math.sin(time + phase) * amplitude + Math.sin(time * 0.4 + phase * 1.5) * amplitude * 0.4;
        const dy = Math.cos(time * 0.6 + phase * 1.3) * amplitude * 0.9 + Math.cos(time * 0.25 + phase) * amplitude * 0.3;
        
        newPositions[id] = [baseX + dx, baseY + dy];
      });
      
      setAnimatedPositions(newPositions);
      animationRef.current = requestAnimationFrame(animate);
    };

    // Start animation immediately
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [basePositions]);

  // Return animated positions, or base positions if animation hasn't started
  return Object.keys(animatedPositions).length > 0 ? animatedPositions : basePositions;
}

export default function Graph2DCanvas({
  nodes,
  edges,
  selectedNode,
  selectedNodeIds = new Set(),
  onNodeSelect,
  viewMode,
  layoutMode = 'force',
  focusedNodes = [],
  focusedEdges = [],
  onResetView,
}: Graph2DCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const displayNodes = nodes;
  const displayEdges = viewMode === 'focused' && focusedEdges.length > 0 ? focusedEdges : edges;

  const focusedNodeIds = useMemo(() => {
    return new Set((focusedNodes || []).map(n => n.node_id));
  }, [focusedNodes]);

  const connectedNodeIds = useMemo(() => {
    const connected = new Set<string>();
    selectedNodeIds.forEach(selectedId => {
      edges.forEach(edge => {
        if (edge.source_node === selectedId) {
          connected.add(edge.target_node);
        }
        if (edge.target_node === selectedId) {
          connected.add(edge.source_node);
        }
      });
    });
    return connected;
  }, [edges, selectedNodeIds]);

  const forcePositions = useForceSimulation2D(displayNodes, displayEdges, layoutMode === 'force', dimensions.width, dimensions.height);
  const spiralPositions = useSpiralLayout(displayNodes, displayEdges, dimensions.width, dimensions.height);
  const positions = layoutMode === 'force' ? forcePositions : spiralPositions;

  const isFocusMode = viewMode === 'focused' && focusedNodes.length > 0;
  const lastFocusedIdsRef = useRef<string>('');
  const wasFocusModeRef = useRef<boolean>(false);

  // Reset transform only when transitioning FROM focus mode TO full view
  useEffect(() => {
    if (!isFocusMode && wasFocusModeRef.current) {
      // Just transitioned from focus mode to full view
      setTransform({ x: 0, y: 0, scale: 1 });
      lastFocusedIdsRef.current = '';
    }
    wasFocusModeRef.current = isFocusMode;
  }, [isFocusMode]);

  // Auto-center and fit focused nodes in view when entering focus mode or changing focused nodes
  useEffect(() => {
    if (!isFocusMode) return;

    // Create a key for current focused nodes
    const focusedKey = focusedNodes.map(n => n.node_id).sort().join(',');

    // Only center if the focused nodes have changed
    if (focusedKey === lastFocusedIdsRef.current) return;
    if (Object.keys(positions).length === 0) return;

    // Get positions of focused nodes only
    const focusedPositions = focusedNodes
      .map(n => positions[n.node_id])
      .filter((p): p is [number, number] => !!p);

    if (focusedPositions.length === 0) return;

    // Mark that we've centered these nodes
    lastFocusedIdsRef.current = focusedKey;

    // Calculate bounding box
    const xs = focusedPositions.map(p => p[0]);
    const ys = focusedPositions.map(p => p[1]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const contentWidth = Math.max(maxX - minX + 200, 300); // Add padding, minimum size
    const contentHeight = Math.max(maxY - minY + 200, 200);
    const nodeCenterX = (minX + maxX) / 2;
    const nodeCenterY = (minY + maxY) / 2;

    // Account for sidebar (approximately 350px) and legend (80px)
    const sidebarWidth = 350;
    const legendHeight = 80;
    const availableWidth = dimensions.width - sidebarWidth;
    const availableHeight = dimensions.height - legendHeight;

    // Calculate scale to fit content with some padding
    const scaleX = (availableWidth * 0.85) / contentWidth;
    const scaleY = (availableHeight * 0.85) / contentHeight;
    const scale = Math.min(scaleX, scaleY, 1.2); // Cap at 1.2x zoom

    // Calculate translation to center the focused nodes in available space
    const viewCenterX = availableWidth / 2;
    const viewCenterY = availableHeight / 2;

    const newX = viewCenterX - nodeCenterX * scale;
    const newY = viewCenterY - nodeCenterY * scale;

    setTransform({ x: newX, y: newY, scale: Math.max(0.5, scale) });
  }, [isFocusMode, focusedNodes, dimensions.width, dimensions.height, positions]);

  const handleNodeClick = useCallback((node: GraphNode, e: React.MouseEvent) => {
    e.stopPropagation();
    onNodeSelect(node, { ctrlKey: e.ctrlKey, metaKey: e.metaKey });
  }, [onNodeSelect]);

  const handleBackgroundClick = useCallback(() => {
    if (viewMode === 'focused') {
      onResetView();
    } else {
      onNodeSelect(null, { ctrlKey: false, metaKey: false });
    }
  }, [viewMode, onResetView, onNodeSelect]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.3, Math.min(3, transform.scale * scaleFactor));
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const newX = mouseX - (mouseX - transform.x) * (newScale / transform.scale);
      const newY = mouseY - (mouseY - transform.y) * (newScale / transform.scale);
      
      setTransform({ x: newX, y: newY, scale: newScale });
    }
  }, [transform]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'svg') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    }
  }, [transform]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setTransform(prev => ({
        ...prev,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      }));
    }
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const getNodeColor = (node: GraphNode) => {
    return NODE_TYPE_COLORS[node.node_type.toLowerCase()] || NODE_TYPE_COLORS.default;
  };

  const getNodeSize = (node: GraphNode) => {
    return node.node_type.toLowerCase() === 'project' ? 28 : 22;
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden cursor-grab"
      style={{ background: 'linear-gradient(180deg, #0a0e27 0%, #1a1e3f 100%)' }}
      data-testid="canvas-2d-graph"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleBackgroundClick();
        }
      }}
    >
      <svg
        width={dimensions.width}
        height={dimensions.height}
        style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
      >
        <style>
          {`
            @keyframes pulseGlow {
              0%, 100% { opacity: 0.3; transform: scale(1); }
              50% { opacity: 0.8; transform: scale(1.1); }
            }
            .pulse-ring {
              animation: pulseGlow 1.5s ease-in-out infinite;
              transform-origin: center;
              transform-box: fill-box;
            }
          `}
        </style>
        <defs>
          {Object.entries(NODE_TYPE_COLORS).map(([type, color]) => (
            <filter key={`glow-${type}`} id={`glow-${type}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          ))}
          {Object.entries(RELATIONSHIP_COLORS).map(([type, color]) => (
            <filter key={`edge-glow-${type}`} id={`edge-glow-${type}`} x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feFlood floodColor={color} floodOpacity="0.6" result="glowColor" />
              <feComposite in="glowColor" in2="coloredBlur" operator="in" result="coloredGlow" />
              <feMerge>
                <feMergeNode in="coloredGlow" />
                <feMergeNode in="coloredGlow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          ))}
        </defs>

        <g 
          transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}
          style={{ transition: isPanning ? 'none' : 'transform 0.5s ease-out' }}
        >
          {displayEdges.map((edge, idx) => {
            const sourcePos = positions[edge.source_node];
            const targetPos = positions[edge.target_node];
            if (!sourcePos || !targetPos) return null;

            const isHighlighted = selectedNodeIds.has(edge.source_node) || selectedNodeIds.has(edge.target_node);
            const isFaded = isFocusMode && !focusedNodeIds.has(edge.source_node) && !focusedNodeIds.has(edge.target_node);
            const edgeColor = getEdgeColor(edge.relationship_type);

            const midX = (sourcePos[0] + targetPos[0]) / 2;
            const midY = (sourcePos[1] + targetPos[1]) / 2;

            const filterType = RELATIONSHIP_COLORS[edge.relationship_type] ? edge.relationship_type : 'default';

            return (
              <line
                key={`edge-${idx}`}
                x1={sourcePos[0]}
                y1={sourcePos[1]}
                x2={targetPos[0]}
                y2={targetPos[1]}
                stroke={edgeColor}
                strokeWidth={(isHighlighted ? 4 : 2.5) / Math.min(Math.max(transform.scale, 0.3), 4)}
                strokeOpacity={isFaded ? 0.2 : isHighlighted ? 1 : 0.75}
                filter={`url(#edge-glow-${filterType})`}
                style={{
                  transition: 'stroke-opacity 0.4s ease-out, stroke-width 0.3s ease-out'
                }}
              />
            );
          })}

          {displayNodes.map(node => {
            const pos = positions[node.node_id];
            if (!pos) return null;

            const isSelected = selectedNodeIds.has(node.node_id);
            const isFocused = focusedNodeIds.has(node.node_id);
            const isConnected = connectedNodeIds.has(node.node_id);
            const isFaded = isFocusMode && !isFocused && !isSelected;

            const color = getNodeColor(node);
            const size = getNodeSize(node);
            const isProject = node.node_type.toLowerCase() === 'project';

            const scale = isSelected ? 1.3 : isFocused ? 1.15 : 1;
            const opacity = isFaded ? 0.25 : 1;

            return (
              <g
                key={node.node_id}
                transform={`translate(${pos[0]}, ${pos[1]}) scale(${scale})`}
                onClick={(e) => handleNodeClick(node, e)}
                style={{ 
                  cursor: 'pointer',
                  transition: 'opacity 0.4s ease-out',
                  opacity
                }}
                data-testid={`node-${node.node_id}`}
              >
                {isProject ? (
                  <rect
                    x={-size}
                    y={-size}
                    width={size * 2}
                    height={size * 2}
                    rx={6}
                    fill={color}
                    fillOpacity={0.3}
                    stroke={color}
                    strokeWidth={isSelected ? 3 : 2}
                    filter={isSelected || isFocused ? `url(#glow-project)` : undefined}
                  />
                ) : (
                  <circle
                    r={size}
                    fill={color}
                    fillOpacity={0.3}
                    stroke={color}
                    strokeWidth={isSelected ? 3 : 2}
                    filter={isSelected || isFocused ? `url(#glow-person)` : undefined}
                  />
                )}

                {(isSelected || isFocused) && (
                  isProject ? (
                    <rect
                      x={-size - 6}
                      y={-size - 6}
                      width={(size + 6) * 2}
                      height={(size + 6) * 2}
                      rx={8}
                      fill="none"
                      stroke={color}
                      strokeWidth={isSelected ? 2 : 1}
                      strokeOpacity={isSelected ? undefined : 0.4}
                      className={isSelected ? 'pulse-ring' : undefined}
                    />
                  ) : (
                    <circle
                      r={size + 6}
                      fill="none"
                      stroke={color}
                      strokeWidth={isSelected ? 2 : 1}
                      strokeOpacity={isSelected ? undefined : 0.4}
                      className={isSelected ? 'pulse-ring' : undefined}
                    />
                  )
                )}

                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#ffffff"
                  fontSize={(isProject ? 10 : 9) / Math.min(Math.max(transform.scale, 0.3), 4)}
                  fontWeight={700}
                  style={{ 
                    textShadow: `0 0 4px rgba(0,0,0,0.8), 0 0 8px ${color}`,
                    pointerEvents: 'none'
                  }}
                >
                  {node.display_name.length > 8 ? node.display_name.slice(0, 7) + '..' : node.display_name}
                </text>
              </g>
            );
          })}
        </g>

        {/* Zoom controls and info */}
        <g data-testid="zoom-controls">
          {/* Info box */}
          <rect
            x={10}
            y={dimensions.height - 40}
            width={180}
            height={30}
            rx={4}
            fill="rgba(10, 14, 39, 0.8)"
            stroke="rgba(0, 255, 255, 0.3)"
            strokeWidth={1}
          />
          <text
            x={20}
            y={dimensions.height - 20}
            fill="rgba(0, 255, 255, 0.7)"
            fontSize={11}
            fontFamily="monospace"
          >
            Scroll: Zoom | Drag: Pan
          </text>

          {/* Zoom out button (-) */}
          <g
            onClick={() => setTransform(t => {
              const zoomFactor = 0.8;
              const newScale = Math.max(0.3, t.scale * zoomFactor);
              const centerX = dimensions.width / 2;
              const centerY = dimensions.height / 2;
              return {
                x: centerX - (centerX - t.x) * (newScale / t.scale),
                y: centerY - (centerY - t.y) * (newScale / t.scale),
                scale: newScale
              };
            })}
            style={{ cursor: 'pointer' }}
            data-testid="button-zoom-out"
          >
            <rect
              x={200}
              y={dimensions.height - 40}
              width={30}
              height={30}
              rx={4}
              fill="rgba(10, 14, 39, 0.8)"
              stroke="rgba(0, 255, 255, 0.3)"
              strokeWidth={1}
            />
            <text
              x={215}
              y={dimensions.height - 20}
              fill="rgba(0, 255, 255, 0.9)"
              fontSize={18}
              fontFamily="monospace"
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ pointerEvents: 'none' }}
            >
              -
            </text>
          </g>

          {/* Zoom in button (+) */}
          <g
            onClick={() => setTransform(t => {
              const zoomFactor = 1.25;
              const newScale = Math.min(4, t.scale * zoomFactor);
              const centerX = dimensions.width / 2;
              const centerY = dimensions.height / 2;
              return {
                x: centerX - (centerX - t.x) * (newScale / t.scale),
                y: centerY - (centerY - t.y) * (newScale / t.scale),
                scale: newScale
              };
            })}
            style={{ cursor: 'pointer' }}
            data-testid="button-zoom-in"
          >
            <rect
              x={235}
              y={dimensions.height - 40}
              width={30}
              height={30}
              rx={4}
              fill="rgba(10, 14, 39, 0.8)"
              stroke="rgba(0, 255, 255, 0.3)"
              strokeWidth={1}
            />
            <text
              x={250}
              y={dimensions.height - 20}
              fill="rgba(0, 255, 255, 0.9)"
              fontSize={18}
              fontFamily="monospace"
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ pointerEvents: 'none' }}
            >
              +
            </text>
          </g>
        </g>
      </svg>
    </div>
  );
}

export type { GraphNode, GraphEdge };
