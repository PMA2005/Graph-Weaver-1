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
  svgRef?: React.RefObject<SVGSVGElement>;
  onEdgeClick?: (edge: GraphEdge) => void;
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
  const lerpFactor = 0.18;

  const nodeIds = useMemo(() => nodes.map(n => n.node_id).sort().join(','), [nodes]);
  const edgeIds = useMemo(() => edges.map(e => `${e.source_node}-${e.target_node}-${e.relationship_type}`).sort().join(','), [edges]);

  useEffect(() => {
    if (!isActive || nodes.length === 0 || width === 0 || height === 0) {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
      return;
    }

    const nodesChanged = nodeIds !== lastNodeIdsRef.current;
    const edgesChanged = edgeIds !== lastEdgeIdsRef.current;
    const hasExistingSimulation = simulationRef.current && nodesRef.current.length > 0;

    if (hasExistingSimulation && !nodesChanged && !edgesChanged) {
      return;
    }

    lastNodeIdsRef.current = nodeIds;
    lastEdgeIdsRef.current = edgeIds;

    const existingPositions = new Map<string, { x: number; y: number }>();
    nodesRef.current.forEach(n => {
      existingPositions.set(n.id, { x: n.x, y: n.y });
    });

    const legendHeight = 80;
    const availableHeight = height - legendHeight;
    const centerY = availableHeight / 2;

    // Separate projects and people
    const projects = nodes.filter(n => n.node_type.toLowerCase() === 'project');
    const people = nodes.filter(n => n.node_type.toLowerCase() === 'person');

    // Build adjacency: which people are connected to which projects
    const projectToPeople = new Map<string, string[]>();
    const personToProjects = new Map<string, string[]>();
    
    projects.forEach(p => projectToPeople.set(p.node_id, []));
    people.forEach(p => personToProjects.set(p.node_id, []));
    
    edges.forEach(edge => {
      const sourceNode = nodes.find(n => n.node_id === edge.source_node);
      const targetNode = nodes.find(n => n.node_id === edge.target_node);
      if (!sourceNode || !targetNode) return;
      
      if (sourceNode.node_type.toLowerCase() === 'project' && targetNode.node_type.toLowerCase() === 'person') {
        projectToPeople.get(sourceNode.node_id)?.push(targetNode.node_id);
        personToProjects.get(targetNode.node_id)?.push(sourceNode.node_id);
      } else if (targetNode.node_type.toLowerCase() === 'project' && sourceNode.node_type.toLowerCase() === 'person') {
        projectToPeople.get(targetNode.node_id)?.push(sourceNode.node_id);
        personToProjects.get(sourceNode.node_id)?.push(targetNode.node_id);
      }
    });

    // Calculate cluster radius based on number of people - smaller to prevent overlap
    const clusterRadius = (count: number) => Math.max(60, 35 + count * 18);

    // First pass: compute all cluster radii
    const projectRadii: number[] = projects.map(project => {
      const peopleCount = projectToPeople.get(project.node_id)?.length || 0;
      return clusterRadius(peopleCount);
    });

    // Calculate total width needed for all clusters with padding between them
    const clusterPadding = 40;
    const totalClusterWidth = projectRadii.reduce((sum, r) => sum + r * 2 + clusterPadding, 0) - clusterPadding;
    
    // Scale down if clusters don't fit
    const availableWidth = width - 120; // Leave margin on sides
    const scaleFactor = totalClusterWidth > availableWidth ? availableWidth / totalClusterWidth : 1;
    
    // Position projects using cumulative widths
    const projectPositions = new Map<string, { x: number; y: number; radius: number }>();
    let currentX = 60; // Start margin
    
    projects.forEach((project, i) => {
      const scaledRadius = projectRadii[i] * scaleFactor;
      const x = currentX + scaledRadius;
      projectPositions.set(project.node_id, { x, y: centerY, radius: scaledRadius });
      currentX = x + scaledRadius + clusterPadding * scaleFactor;
    });

    // Calculate angular positions for people around each project
    const personAngles = new Map<string, { projectId: string; angle: number; radius: number }>();
    
    projects.forEach(project => {
      const peopleIds = projectToPeople.get(project.node_id) || [];
      const projectPos = projectPositions.get(project.node_id)!;
      
      peopleIds.forEach((personId, i) => {
        const existingAngles = personAngles.get(personId);
        if (!existingAngles) {
          const angle = (i / peopleIds.length) * Math.PI * 2 - Math.PI / 2;
          personAngles.set(personId, { 
            projectId: project.node_id, 
            angle, 
            radius: projectPos.radius 
          });
        }
      });
    });

    // Handle orphan people (not connected to any project)
    const orphanPeople = people.filter(p => !personAngles.has(p.node_id));
    if (orphanPeople.length > 0) {
      const orphanCenterX = width / 2;
      const orphanRadius = clusterRadius(orphanPeople.length);
      orphanPeople.forEach((person, i) => {
        const angle = (i / orphanPeople.length) * Math.PI * 2;
        personAngles.set(person.node_id, {
          projectId: '__orphan__',
          angle,
          radius: orphanRadius
        });
      });
    }

    // Create simulation nodes with initial positions
    const simNodes: SimNode[] = nodes.map((node) => {
      const existing = existingPositions.get(node.node_id);
      const isProject = node.node_type.toLowerCase() === 'project';
      
      let x: number, y: number;
      
      if (isProject) {
        const pos = projectPositions.get(node.node_id);
        x = existing?.x ?? pos?.x ?? width / 2;
        y = existing?.y ?? pos?.y ?? centerY;
      } else {
        const angleData = personAngles.get(node.node_id);
        if (angleData && angleData.projectId !== '__orphan__') {
          const projectPos = projectPositions.get(angleData.projectId);
          if (projectPos) {
            x = existing?.x ?? projectPos.x + Math.cos(angleData.angle) * angleData.radius;
            y = existing?.y ?? projectPos.y + Math.sin(angleData.angle) * angleData.radius;
          } else {
            x = existing?.x ?? width / 2 + (Math.random() - 0.5) * 100;
            y = existing?.y ?? centerY + (Math.random() - 0.5) * 100;
          }
        } else {
          // Orphan person
          const angleData = personAngles.get(node.node_id);
          if (angleData) {
            x = existing?.x ?? width / 2 + Math.cos(angleData.angle) * angleData.radius;
            y = existing?.y ?? centerY + Math.sin(angleData.angle) * angleData.radius;
          } else {
            x = existing?.x ?? width / 2 + (Math.random() - 0.5) * 100;
            y = existing?.y ?? centerY + (Math.random() - 0.5) * 100;
          }
        }
      }
      
      return { id: node.node_id, x, y, node };
    });

    const simLinks: SimLink[] = edges
      .filter(e => 
        simNodes.some(n => n.id === e.source_node) && 
        simNodes.some(n => n.id === e.target_node)
      )
      .map(edge => ({ source: edge.source_node, target: edge.target_node, edge }));

    nodesRef.current = simNodes;

    // Custom force: position projects along horizontal spine
    const createProjectSpineForce = () => {
      let nodes: SimNode[] = [];
      const force = (alpha: number) => {
        nodes.forEach(node => {
          if (node.node.node_type.toLowerCase() !== 'project') return;
          const targetPos = projectPositions.get(node.id);
          if (!targetPos) return;
          
          // Strong X force to maintain spine
          node.vx = (node.vx || 0) + (targetPos.x - node.x) * alpha * 0.3;
          // Keep projects centered vertically
          node.vy = (node.vy || 0) + (centerY - node.y) * alpha * 0.15;
        });
      };
      force.initialize = (n: SimNode[]) => { nodes = n; };
      return force;
    };

    // Custom force: pull people into radial halos around their project
    const createRadialClusterForce = () => {
      let nodes: SimNode[] = [];
      const force = (alpha: number) => {
        nodes.forEach(node => {
          if (node.node.node_type.toLowerCase() !== 'person') return;
          
          const angleData = personAngles.get(node.id);
          if (!angleData || angleData.projectId === '__orphan__') return;
          
          const projectNode = nodes.find(n => n.id === angleData.projectId);
          if (!projectNode) return;
          
          // Target position: radial from project center
          const targetX = projectNode.x + Math.cos(angleData.angle) * angleData.radius;
          const targetY = projectNode.y + Math.sin(angleData.angle) * angleData.radius;
          
          // Pull toward radial position
          node.vx = (node.vx || 0) + (targetX - node.x) * alpha * 0.15;
          node.vy = (node.vy || 0) + (targetY - node.y) * alpha * 0.15;
        });
      };
      force.initialize = (n: SimNode[]) => { nodes = n; };
      return force;
    };

    // Gentle drift for floating animation
    const createDriftForce = () => {
      let nodes: SimNode[] = [];
      let time = 0;
      const force = (alpha: number) => {
        time += 0.015;
        nodes.forEach((node, i) => {
          const phase = (i / nodes.length) * Math.PI * 2;
          const driftStrength = 0.2;
          node.vx = (node.vx || 0) + Math.sin(time + phase) * driftStrength * alpha;
          node.vy = (node.vy || 0) + Math.cos(time + phase * 1.3) * driftStrength * 0.6 * alpha;
        });
      };
      force.initialize = (n: SimNode[]) => { nodes = n; };
      return force;
    };

    // Bounds force
    const createBoundsForce = () => {
      let nodes: SimNode[] = [];
      const padding = 60;
      const force = (alpha: number) => {
        nodes.forEach(node => {
          if (node.x < padding) node.vx = (node.vx || 0) + (padding - node.x) * alpha * 0.5;
          if (node.x > width - padding) node.vx = (node.vx || 0) + (width - padding - node.x) * alpha * 0.5;
          if (node.y < padding) node.vy = (node.vy || 0) + (padding - node.y) * alpha * 0.5;
          if (node.y > availableHeight - padding) node.vy = (node.vy || 0) + (availableHeight - padding - node.y) * alpha * 0.5;
        });
      };
      force.initialize = (n: SimNode[]) => { nodes = n; };
      return force;
    };

    const simulation = d3Force.forceSimulation(simNodes)
      .force('link', d3Force.forceLink(simLinks)
        .id((d: any) => d.id)
        .distance((link: any) => {
          // Shorter links between project and people for tighter clusters
          const source = nodes.find(n => n.node_id === (typeof link.source === 'string' ? link.source : link.source.id));
          const target = nodes.find(n => n.node_id === (typeof link.target === 'string' ? link.target : link.target.id));
          if (!source || !target) return 100;
          const sourceIsProject = source.node_type.toLowerCase() === 'project';
          const targetIsProject = target.node_type.toLowerCase() === 'project';
          if (sourceIsProject !== targetIsProject) return 90; // Project-person link
          if (sourceIsProject && targetIsProject) return 200; // Project-project link
          return 60; // Person-person link
        })
        .strength(0.3)
      )
      .force('charge', d3Force.forceManyBody()
        .strength((d: any) => d.node.node_type.toLowerCase() === 'project' ? -300 : -80)
        .distanceMax(400)
      )
      .force('collision', d3Force.forceCollide()
        .radius((d: any) => d.node.node_type.toLowerCase() === 'project' ? 50 : 30)
        .strength(0.8)
      )
      .force('projectSpine', createProjectSpineForce())
      .force('radialCluster', createRadialClusterForce())
      .force('bounds', createBoundsForce())
      .force('drift', createDriftForce())
      .alphaDecay(0.02)
      .velocityDecay(0.4)
      .alphaTarget(0.05);

    simulation.on('tick', () => {
      const newPositions: Record<string, [number, number]> = {};
      simNodes.forEach(node => {
        const prev = smoothedPositionsRef.current[node.id];
        if (prev) {
          const smoothedX = prev[0] + (node.x - prev[0]) * lerpFactor;
          const smoothedY = prev[1] + (node.y - prev[1]) * lerpFactor;
          newPositions[node.id] = [smoothedX, smoothedY];
        } else {
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

// Crown layout: projects on upper arc, people on full perimeter oval ring
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
    const centerY = availableHeight / 2 + 30; // Shift center down slightly to make room for projects at top

    const projects = nodes.filter(n => n.node_type.toLowerCase() === 'project');
    const persons = nodes.filter(n => n.node_type.toLowerCase() === 'person');

    const result: Record<string, [number, number]> = {};

    // Animation buffer - add extra spacing to account for floating movement
    const animationBuffer = 20; // Animation amplitude is 15, add margin
    
    // Helper function: calculate min angular spacing for a given radius
    const calcMinAngularSpacing = (radiusX: number, nodeSpacing: number) => {
      const safeRadius = Math.max(radiusX, 50);
      const ratio = Math.min(nodeSpacing / (2 * safeRadius), 0.95);
      return 2 * Math.asin(ratio);
    };
    
    // === PROJECT LAYOUT - ELLIPTICAL UPPER ARC (ORIGINAL CROWN DESIGN) ===
    const projectNodeWidth = 38;
    const minProjectGap = 24;
    const totalProjectSpacing = projectNodeWidth + minProjectGap + animationBuffer;
    
    // Base ellipse radii for project arc
    let projectRadiusX = width * 0.28;
    let projectRadiusY = availableHeight * 0.15;
    
    // Arc span and center (upper arc)
    const projectArcSpan = Math.PI * 0.82; // About 148 degrees
    const projectArcCenter = -Math.PI / 2; // Top center (-90 degrees)
    
    // Calculate minimum angular spacing needed for projects
    const projectMinAngularSpacing = calcMinAngularSpacing(projectRadiusX, totalProjectSpacing);
    const requiredProjectArcSpan = projects.length > 1 
      ? (projects.length - 1) * projectMinAngularSpacing 
      : 0;
    
    // If projects need more space, expand the radius to fit them
    if (requiredProjectArcSpan > projectArcSpan && projects.length > 1) {
      // Calculate how much we need to expand the radius
      const expansionFactor = requiredProjectArcSpan / projectArcSpan;
      // Limit expansion to prevent going off screen
      const maxExpansion = Math.min(expansionFactor, 1.8);
      projectRadiusX *= maxExpansion;
      projectRadiusY *= maxExpansion * 0.7; // Keep Y expansion smaller
    }
    
    // Recalculate spacing with potentially expanded radius
    const actualProjectAngularSpacing = calcMinAngularSpacing(projectRadiusX, totalProjectSpacing);
    const actualProjectArcSpan = projects.length > 1 
      ? Math.min((projects.length - 1) * actualProjectAngularSpacing, projectArcSpan)
      : 0;
    const projectArcStart = projectArcCenter - actualProjectArcSpan / 2;
    
    // Place projects along the elliptical arc
    projects.forEach((project, projectIndex) => {
      let angle: number;
      if (projects.length === 1) {
        angle = projectArcCenter;
      } else {
        const t = projectIndex / (projects.length - 1);
        angle = projectArcStart + t * actualProjectArcSpan;
      }
      
      const projectX = centerX + Math.cos(angle) * projectRadiusX;
      const projectY = centerY + Math.sin(angle) * projectRadiusY;
      
      // Clamp to viewport
      const clampedX = Math.max(50, Math.min(width - 50, projectX));
      const clampedY = Math.max(40, projectY);
      
      result[project.node_id] = [clampedX, clampedY];
    });
    
    // === PEOPLE LAYOUT - FULL OVAL PERIMETER ===
    const personNodeWidth = 34;
    const minPersonGap = 28;
    const totalPersonSpacing = personNodeWidth + minPersonGap + animationBuffer;
    
    // Base oval radii for people (outer ring surrounding projects)
    let personRadiusX = width * 0.42;
    let personRadiusY = availableHeight * 0.38;
    
    // Calculate minimum angular spacing for people on full circle
    const personMinAngularSpacing = calcMinAngularSpacing(personRadiusX, totalPersonSpacing);
    const requiredPersonArcSpan = persons.length * personMinAngularSpacing;
    
    // If people need more space, expand the radius
    if (requiredPersonArcSpan > 2 * Math.PI && persons.length > 1) {
      const expansionFactor = requiredPersonArcSpan / (2 * Math.PI);
      const maxExpansion = Math.min(expansionFactor, 1.5);
      personRadiusX *= maxExpansion;
      personRadiusY *= maxExpansion;
    }
    
    // Place people around the full oval perimeter
    persons.forEach((person, personIndex) => {
      const t = personIndex / persons.length;
      // Start from bottom (Math.PI/2) and go full circle
      const angle = Math.PI / 2 + t * 2 * Math.PI;
      
      const personX = centerX + Math.cos(angle) * personRadiusX;
      const personY = centerY + Math.sin(angle) * personRadiusY;
      
      result[person.node_id] = [personX, personY];
    });

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
  svgRef,
  onEdgeClick,
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

  const getNodeSize = (node: GraphNode, forceMode: boolean = false) => {
    if (layoutMode === 'force' || forceMode) {
      return node.node_type.toLowerCase() === 'project' ? 38 : 24;
    }
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
        ref={svgRef}
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
            const isClickable = isFocusMode && onEdgeClick;

            const filterType = RELATIONSHIP_COLORS[edge.relationship_type] ? edge.relationship_type : 'default';

            return (
              <g key={`edge-${idx}`}>
                {isClickable && (
                  <line
                    x1={sourcePos[0]}
                    y1={sourcePos[1]}
                    x2={targetPos[0]}
                    y2={targetPos[1]}
                    stroke="transparent"
                    strokeWidth={20 / Math.min(Math.max(transform.scale, 0.3), 4)}
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdgeClick(edge);
                    }}
                    data-testid={`edge-${edge.source_node}-${edge.target_node}`}
                  />
                )}
                <line
                  x1={sourcePos[0]}
                  y1={sourcePos[1]}
                  x2={targetPos[0]}
                  y2={targetPos[1]}
                  stroke={edgeColor}
                  strokeWidth={(isHighlighted ? 4 : 2.5) / Math.min(Math.max(transform.scale, 0.3), 4)}
                  strokeOpacity={isFaded ? 0.2 : isHighlighted ? 1 : 0.75}
                  filter={`url(#edge-glow-${filterType})`}
                  style={{
                    transition: 'stroke-opacity 0.4s ease-out, stroke-width 0.3s ease-out',
                    pointerEvents: isClickable ? 'none' : 'auto'
                  }}
                />
              </g>
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
                    strokeDasharray={layoutMode === 'force' ? '4 2' : undefined}
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
                  fontSize={(isProject ? 10 : (layoutMode === 'force' ? 10 : 9)) / Math.min(Math.max(transform.scale, 0.3), 4)}
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
