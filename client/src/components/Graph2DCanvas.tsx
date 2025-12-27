import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import * as d3Force from 'd3-force';

type ViewMode = 'global' | 'focused';

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
  works_on: '#a855f7',
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

  useEffect(() => {
    if (!isActive || nodes.length === 0 || width === 0 || height === 0) {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
      return;
    }

    const existingPositions = new Map<string, { x: number; y: number }>();
    nodesRef.current.forEach(n => {
      existingPositions.set(n.id, { x: n.x, y: n.y });
    });

    const centerX = width / 2;
    const centerY = height / 2;
    const spreadX = width * 0.4;
    const spreadY = height * 0.35;

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
          node.vy = (node.vy || 0) + (targetY - node.y) * alpha * 0.6;
        });
      };
      force.initialize = (n: SimNode[]) => { nodes = n; };
      return force;
    };

    const simulation = d3Force.forceSimulation(simNodes)
      .force('link', d3Force.forceLink(simLinks)
        .id((d: any) => d.id)
        .distance(180)
        .strength(0.25)
      )
      .force('charge', d3Force.forceManyBody().strength(-800).distanceMax(600))
      .force('center', d3Force.forceCenter(centerX, centerY).strength(0.02))
      .force('collision', d3Force.forceCollide().radius(75).strength(0.95))
      .force('yAxis', createYForce())
      .alphaDecay(0.015)
      .velocityDecay(0.4);

    simulation.on('tick', () => {
      const newPositions: Record<string, [number, number]> = {};
      simNodes.forEach(node => {
        newPositions[node.id] = [node.x, node.y];
      });
      setPositions(newPositions);
    });

    simulationRef.current = simulation;

    return () => {
      simulation.stop();
    };
  }, [nodes, edges, isActive, width, height]);

  return positions;
}

export default function Graph2DCanvas({
  nodes,
  edges,
  selectedNode,
  selectedNodeIds = new Set(),
  onNodeSelect,
  viewMode,
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

  const positions = useForceSimulation2D(displayNodes, displayEdges, true, dimensions.width, dimensions.height);

  const isFocusMode = viewMode === 'focused' && focusedNodes.length > 0;

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
            <filter key={`edge-glow-${type}`} id={`edge-glow-${type}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          ))}
        </defs>

        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
          {displayEdges.map((edge, idx) => {
            const sourcePos = positions[edge.source_node];
            const targetPos = positions[edge.target_node];
            if (!sourcePos || !targetPos) return null;

            const isHighlighted = selectedNodeIds.has(edge.source_node) || selectedNodeIds.has(edge.target_node);
            const isFaded = isFocusMode && !focusedNodeIds.has(edge.source_node) && !focusedNodeIds.has(edge.target_node);
            const edgeColor = getEdgeColor(edge.relationship_type);

            const midX = (sourcePos[0] + targetPos[0]) / 2;
            const midY = (sourcePos[1] + targetPos[1]) / 2;

            return (
              <line
                key={`edge-${idx}`}
                x1={sourcePos[0]}
                y1={sourcePos[1]}
                x2={targetPos[0]}
                y2={targetPos[1]}
                stroke={edgeColor}
                strokeWidth={isHighlighted ? 3 : 2}
                strokeOpacity={isFaded ? 0.15 : isHighlighted ? 0.9 : 0.5}
                filter={isHighlighted ? `url(#edge-glow-${edge.relationship_type})` : undefined}
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
                style={{ cursor: 'pointer' }}
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
                    fillOpacity={opacity * 0.3}
                    stroke={color}
                    strokeWidth={isSelected ? 3 : 2}
                    strokeOpacity={opacity}
                    filter={isSelected || isFocused ? `url(#glow-project)` : undefined}
                  />
                ) : (
                  <circle
                    r={size}
                    fill={color}
                    fillOpacity={opacity * 0.3}
                    stroke={color}
                    strokeWidth={isSelected ? 3 : 2}
                    strokeOpacity={opacity}
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
                      strokeWidth={1}
                      strokeOpacity={0.4}
                    />
                  ) : (
                    <circle
                      r={size + 6}
                      fill="none"
                      stroke={color}
                      strokeWidth={1}
                      strokeOpacity={0.4}
                    />
                  )
                )}

                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#ffffff"
                  fontSize={isProject ? 10 : 9}
                  fontWeight={700}
                  opacity={opacity}
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
      </svg>
    </div>
  );
}

export type { GraphNode, GraphEdge, ViewMode };
