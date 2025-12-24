import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import { Suspense, useState, useRef, useMemo, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
} from 'd3-force-3d';

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

interface Graph3DCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNode: GraphNode | null;
  selectedNodeIds?: Set<string>;
  onNodeSelect: (node: GraphNode | null, multiSelect?: boolean) => void;
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

const NODE_TYPE_SHAPES: Record<string, 'sphere' | 'box' | 'octahedron'> = {
  person: 'sphere',
  project: 'box',
  default: 'sphere',
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
  z: number;
  vx?: number;
  vy?: number;
  vz?: number;
  fx?: number | null;
  fy?: number | null;
  fz?: number | null;
  node: GraphNode;
}

interface SimLink {
  source: string | SimNode;
  target: string | SimNode;
  edge: GraphEdge;
}

function useForceSimulation(
  nodes: GraphNode[],
  edges: GraphEdge[],
  isActive: boolean
): Record<string, [number, number, number]> {
  const [positions, setPositions] = useState<Record<string, [number, number, number]>>({});
  const simulationRef = useRef<ReturnType<typeof forceSimulation> | null>(null);
  const nodesRef = useRef<SimNode[]>([]);

  useEffect(() => {
    if (!isActive || nodes.length === 0) {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
      return;
    }

    const existingPositions = new Map<string, { x: number; y: number; z: number }>();
    nodesRef.current.forEach(n => {
      existingPositions.set(n.id, { x: n.x, y: n.y, z: n.z });
    });

    const baseRadius = Math.max(12, 8 + Math.sqrt(nodes.length) * 3);
    
    const simNodes: SimNode[] = nodes.map((node, i) => {
      const existing = existingPositions.get(node.node_id);
      const angle = (i / nodes.length) * Math.PI * 2;
      const radius = baseRadius + Math.random() * (baseRadius * 0.2);
      const isProject = node.node_type.toLowerCase() === 'project';
      const verticalOffset = isProject ? 12 : -12;
      return {
        id: node.node_id,
        x: existing?.x ?? Math.cos(angle) * radius,
        y: existing?.y ?? verticalOffset + (Math.random() - 0.5) * 5,
        z: existing?.z ?? Math.sin(angle) * radius,
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

    const collisionRadius = Math.max(4, 3 + nodes.length * 0.05);
    const chargeStrength = -80 - nodes.length * 2;
    const linkDistance = Math.max(8, 6 + nodes.length * 0.2);

    const yForce = () => {
      let nodes: SimNode[] = [];
      const force = (alpha: number) => {
        nodes.forEach(node => {
          const isProject = node.node.node_type.toLowerCase() === 'project';
          const targetY = isProject ? 12 : -12;
          node.vy = (node.vy || 0) + (targetY - node.y) * alpha * 0.2;
        });
      };
      force.initialize = (n: SimNode[]) => { nodes = n; };
      return force;
    };

    const simulation = forceSimulation(simNodes, 3)
      .force('link', forceLink(simLinks)
        .id((d: any) => d.id)
        .distance(linkDistance)
        .strength(0.5)
      )
      .force('charge', forceManyBody().strength(chargeStrength).distanceMax(baseRadius * 1.8))
      .force('center', forceCenter(0, 0, 0).strength(0.08))
      .force('yAxis', yForce())
      .force('collision', forceCollide().radius(collisionRadius).strength(0.9))
      .alphaDecay(0.025)
      .velocityDecay(0.35);

    simulationRef.current = simulation as any;

    const updatePositions = () => {
      const newPositions: Record<string, [number, number, number]> = {};
      simNodes.forEach(n => {
        newPositions[n.id] = [n.x || 0, n.y || 0, n.z || 0];
      });
      setPositions(newPositions);
    };

    simulation.on('tick', updatePositions);
    
    simulation.alpha(1).restart();

    return () => {
      simulation.stop();
    };
  }, [nodes, edges, isActive]);

  return positions;
}

function AnimatedNode3D({ 
  node, 
  targetPosition, 
  isSelected, 
  isConnected,
  isFocused,
  isFaded,
  cameraDistance,
  onClick 
}: { 
  node: GraphNode; 
  targetPosition: [number, number, number]; 
  isSelected: boolean;
  isConnected: boolean;
  isFocused: boolean;
  isFaded: boolean;
  cameraDistance: number;
  onClick: (event?: { ctrlKey: boolean; metaKey: boolean }) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const currentPos = useRef(new THREE.Vector3(...targetPosition));
  
  const color = NODE_TYPE_COLORS[node.node_type.toLowerCase()] || NODE_TYPE_COLORS.default;
  const typeLabel = NODE_TYPE_LABELS[node.node_type.toLowerCase()] || NODE_TYPE_LABELS.default;
  const shape = NODE_TYPE_SHAPES[node.node_type.toLowerCase()] || NODE_TYPE_SHAPES.default;
  
  const scale = isSelected ? 1.4 : isFocused ? 1.2 : hovered ? 1.15 : 1;
  const baseOpacity = isFaded ? 0.25 : (isSelected || isConnected || isFocused ? 1 : (hovered ? 0.9 : 0.7));

  useFrame((_, delta) => {
    if (groupRef.current) {
      const target = new THREE.Vector3(...targetPosition);
      currentPos.current.lerp(target, Math.min(1, delta * 5));
      groupRef.current.position.copy(currentPos.current);
    }
  });
  
  const nodeSize = shape === 'box' ? 2.0 : 1.5;
  const geometry = shape === 'sphere' 
    ? <sphereGeometry args={[nodeSize, 32, 32]} />
    : shape === 'box'
    ? <boxGeometry args={[nodeSize * 1.4, nodeSize * 1.4, nodeSize * 1.4]} />
    : <octahedronGeometry args={[nodeSize]} />;

  const labelScale = Math.max(1.0, Math.min(2.0, 50 / cameraDistance));
  const showLabel = true;

  return (
    <group ref={groupRef}>
      <mesh
        onClick={(e) => { 
          e.stopPropagation(); 
          const nativeEvent = e.nativeEvent as PointerEvent;
          onClick({ ctrlKey: nativeEvent.ctrlKey, metaKey: nativeEvent.metaKey }); 
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={scale}
      >
        {geometry}
        <meshStandardMaterial 
          color={color} 
          emissive={color}
          emissiveIntensity={isSelected ? 0.9 : isFocused ? 0.7 : hovered ? 0.5 : 0.3}
          transparent
          opacity={baseOpacity}
        />
      </mesh>
      
      {(isSelected || isFocused || hovered) && (
        <mesh scale={1.6}>
          {geometry}
          <meshBasicMaterial 
            color={color} 
            transparent 
            opacity={isFaded ? 0.05 : 0.15}
            side={THREE.BackSide}
          />
        </mesh>
      )}
      
      {showLabel && (
        <Html
          position={[0, nodeSize + 1.2, 0]}
          center
          distanceFactor={8}
          style={{ 
            pointerEvents: 'none',
            transform: `scale(${labelScale})`,
            opacity: isFaded ? 0.3 : 1,
          }}
        >
          <div 
            className="text-center whitespace-nowrap select-none px-4 py-2 rounded-md"
            style={{ 
              background: 'rgba(10, 14, 39, 0.95)',
              border: `2px solid ${color}`,
              boxShadow: `0 0 15px ${color}80, 0 0 30px ${color}40`,
            }}
          >
            <div 
              className="font-display text-lg font-bold leading-tight"
              style={{ color: '#ffffff', textShadow: `0 0 10px ${color}` }}
            >
              {node.display_name}
            </div>
            <div 
              className="font-tech text-sm uppercase tracking-wider mt-1"
              style={{ color: color, fontWeight: 600 }}
            >
              {typeLabel}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

function EdgeLabel({
  position,
  relationshipType,
  isHighlighted,
  cameraDistance,
}: {
  position: [number, number, number];
  relationshipType: string;
  isHighlighted: boolean;
  cameraDistance: number;
}) {
  const formattedLabel = relationshipType.replace(/_/g, ' ');
  const edgeColor = getEdgeColor(relationshipType);
  
  if (cameraDistance > 80 && !isHighlighted) return null;
  
  const labelScale = Math.max(0.8, Math.min(1.5, 40 / cameraDistance));
  
  return (
    <Html
      position={position}
      center
      distanceFactor={6}
      style={{ pointerEvents: 'none', transform: `scale(${labelScale})` }}
    >
      <div 
        className="font-tech text-sm px-3 py-1 rounded-md whitespace-nowrap select-none font-semibold"
        style={{ 
          background: isHighlighted ? `${edgeColor}50` : 'rgba(10, 14, 39, 0.9)',
          color: isHighlighted ? '#ffffff' : edgeColor,
          border: `2px solid ${edgeColor}`,
          textShadow: `0 0 8px ${edgeColor}`,
          boxShadow: isHighlighted ? `0 0 12px ${edgeColor}60` : 'none',
        }}
      >
        {formattedLabel}
      </div>
    </Html>
  );
}

function AnimatedEdge3D({ 
  startPosition,
  endPosition,
  isHighlighted,
  isFaded,
  relationshipType,
  cameraDistance,
}: { 
  startPosition: [number, number, number];
  endPosition: [number, number, number];
  isHighlighted: boolean;
  isFaded: boolean;
  relationshipType: string;
  cameraDistance: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const edgeColor = getEdgeColor(relationshipType);
  
  const startRef = useRef(new THREE.Vector3(...startPosition));
  const endRef = useRef(new THREE.Vector3(...endPosition));

  const lineObject = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(6);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.LineBasicMaterial({
      color: edgeColor,
      transparent: true,
      opacity: isFaded ? 0.1 : (isHighlighted ? 0.9 : 0.4),
    });
    return new THREE.Line(geo, mat);
  }, [edgeColor, isHighlighted, isFaded]);

  useFrame((_, delta) => {
    const targetStart = new THREE.Vector3(...startPosition);
    const targetEnd = new THREE.Vector3(...endPosition);
    
    startRef.current.lerp(targetStart, Math.min(1, delta * 5));
    endRef.current.lerp(targetEnd, Math.min(1, delta * 5));
    
    const positions = lineObject.geometry.attributes.position as THREE.BufferAttribute;
    positions.setXYZ(0, startRef.current.x, startRef.current.y, startRef.current.z);
    positions.setXYZ(1, endRef.current.x, endRef.current.y, endRef.current.z);
    positions.needsUpdate = true;
  });

  const midPoint: [number, number, number] = [
    (startPosition[0] + endPosition[0]) / 2,
    (startPosition[1] + endPosition[1]) / 2 + 0.3,
    (startPosition[2] + endPosition[2]) / 2
  ];
  
  return (
    <group ref={groupRef}>
      <primitive object={lineObject} />
      {!isFaded && (
        <EdgeLabel 
          position={midPoint}
          relationshipType={relationshipType}
          isHighlighted={isHighlighted}
          cameraDistance={cameraDistance}
        />
      )}
    </group>
  );
}

interface SceneProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNode: GraphNode | null;
  selectedNodeIds: Set<string>;
  focusedNodeIds: Set<string>;
  onNodeSelect: (node: GraphNode | null, event?: { ctrlKey?: boolean; metaKey?: boolean }) => void;
  viewMode: ViewMode;
  onBackgroundClick: () => void;
}

function Scene({ 
  nodes, 
  edges, 
  selectedNode,
  selectedNodeIds,
  focusedNodeIds,
  onNodeSelect,
  viewMode,
  onBackgroundClick,
}: SceneProps) {
  const positions = useForceSimulation(nodes, edges, true);
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [cameraDistance, setCameraDistance] = useState(70);
  const idleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasInitialFramed = useRef(false);
  const targetPositionRef = useRef(new THREE.Vector3(0, 0, 0));
  const targetCameraRef = useRef(new THREE.Vector3(0, 25, 70));
  const isTransitioning = useRef(false);
  const { camera } = useThree();
  
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

  // Compute graph bounds and centroid
  const graphBounds = useMemo(() => {
    const posArray = Object.values(positions);
    if (posArray.length === 0) return null;
    
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    
    posArray.forEach(([x, y, z]) => {
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
    });
    
    const centroid = new THREE.Vector3(
      (minX + maxX) / 2,
      (minY + maxY) / 2,
      (minZ + maxZ) / 2
    );
    
    const radius = Math.max(
      maxX - minX,
      maxY - minY,
      maxZ - minZ
    ) / 2 + 10;
    
    return { centroid, radius };
  }, [positions]);

  // Auto-frame graph on initial load
  useEffect(() => {
    if (!hasInitialFramed.current && graphBounds && Object.keys(positions).length >= nodes.length * 0.8) {
      hasInitialFramed.current = true;
      const { centroid, radius } = graphBounds;
      const optimalDistance = Math.min(55, Math.max(35, radius * 2));
      
      targetPositionRef.current.copy(centroid);
      targetCameraRef.current.set(centroid.x, centroid.y + 5, centroid.z + optimalDistance);
      isTransitioning.current = true;
    }
  }, [graphBounds, positions, nodes.length]);

  // Center on selected nodes
  useEffect(() => {
    if (selectedNodeIds.size === 0 || !hasInitialFramed.current) return;
    
    const selectedPositions: [number, number, number][] = [];
    selectedNodeIds.forEach(id => {
      const pos = positions[id];
      if (pos) selectedPositions.push(pos);
    });
    
    if (selectedPositions.length === 0) return;
    
    const centroid = new THREE.Vector3(
      selectedPositions.reduce((sum, p) => sum + p[0], 0) / selectedPositions.length,
      selectedPositions.reduce((sum, p) => sum + p[1], 0) / selectedPositions.length,
      selectedPositions.reduce((sum, p) => sum + p[2], 0) / selectedPositions.length
    );
    
    targetPositionRef.current.copy(centroid);
    
    // Move camera to face the selected node
    const currentDir = camera.position.clone().sub(controlsRef.current?.target || new THREE.Vector3()).normalize();
    const distance = Math.min(45, Math.max(20, cameraDistance * 0.5));
    targetCameraRef.current.copy(centroid).add(currentDir.multiplyScalar(distance));
    
    isTransitioning.current = true;
  }, [selectedNodeIds, positions]);

  // Animate camera and controls target with convergence check
  useFrame((_, delta) => {
    const dist = camera.position.length();
    if (Math.abs(dist - cameraDistance) > 0.5) {
      setCameraDistance(dist);
    }
    
    if (controlsRef.current && isTransitioning.current) {
      const lerpFactor = Math.min(1, delta * 4);
      
      controlsRef.current.target.lerp(targetPositionRef.current, lerpFactor);
      camera.position.lerp(targetCameraRef.current, lerpFactor);
      controlsRef.current.update();
      
      // Check convergence - stop when close enough
      const targetDist = controlsRef.current.target.distanceTo(targetPositionRef.current);
      const cameraDist = camera.position.distanceTo(targetCameraRef.current);
      
      if (targetDist < 0.5 && cameraDist < 0.5) {
        isTransitioning.current = false;
      }
    }
  });

  const handleNodeClick = (node: GraphNode, event: { ctrlKey: boolean; metaKey: boolean }) => {
    if (event.ctrlKey || event.metaKey) {
      onNodeSelect(node, event);
    } else {
      onNodeSelect(node, event);
    }
  };

  const handleInteractionStart = useCallback(() => {
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = null;
    }
    setIsAutoRotating(false);
  }, []);

  const handleInteractionEnd = useCallback(() => {
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }
    idleTimeoutRef.current = setTimeout(() => {
      setIsAutoRotating(true);
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
    };
  }, []);

  const isFocusMode = viewMode === 'focused' && focusedNodeIds.size > 0;

  return (
    <>
      <OrbitControls 
        ref={controlsRef}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={10}
        maxDistance={graphBounds ? Math.max(100, graphBounds.radius * 4) : 150}
        autoRotate={isAutoRotating && !isFocusMode}
        autoRotateSpeed={0.3}
        enableDamping
        dampingFactor={0.05}
        minPolarAngle={0}
        maxPolarAngle={Math.PI}
        rotateSpeed={0.8}
        onStart={handleInteractionStart}
        onEnd={handleInteractionEnd}
      />
      
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#00ffff" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#b026ff" />
      
      <Stars 
        radius={100} 
        depth={50} 
        count={3000} 
        factor={4} 
        saturation={0} 
        fade 
        speed={0.5}
      />
      
      <mesh 
        position={[0, 0, -50]} 
        onClick={onBackgroundClick}
        visible={false}
      >
        <planeGeometry args={[200, 200]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      
      {edges.map((edge, i) => {
        const startPos = positions[edge.source_node];
        const endPos = positions[edge.target_node];
        if (!startPos || !endPos) return null;
        
        const isHighlighted = selectedNodeIds.has(edge.source_node) || 
                             selectedNodeIds.has(edge.target_node);
        
        const isFaded = isFocusMode && 
          !focusedNodeIds.has(edge.source_node) && 
          !focusedNodeIds.has(edge.target_node);
        
        return (
          <AnimatedEdge3D 
            key={`edge-${edge.source_node}-${edge.target_node}-${edge.relationship_type}`}
            startPosition={startPos}
            endPosition={endPos}
            isHighlighted={isHighlighted}
            isFaded={isFaded}
            relationshipType={edge.relationship_type}
            cameraDistance={cameraDistance}
          />
        );
      })}
      
      {nodes.map(node => {
        const pos = positions[node.node_id];
        if (!pos) return null;
        
        const isSelected = selectedNodeIds.has(node.node_id);
        const isFocused = focusedNodeIds.has(node.node_id);
        const isFaded = isFocusMode && !isFocused && !isSelected;
        
        return (
          <AnimatedNode3D
            key={node.node_id}
            node={node}
            targetPosition={pos}
            isSelected={isSelected}
            isConnected={connectedNodeIds.has(node.node_id)}
            isFocused={isFocused}
            isFaded={isFaded}
            cameraDistance={cameraDistance}
            onClick={(e) => handleNodeClick(node, { ctrlKey: e?.ctrlKey || false, metaKey: e?.metaKey || false })}
          />
        );
      })}
    </>
  );
}

export default function Graph3DCanvas({ 
  nodes, 
  edges, 
  selectedNode,
  selectedNodeIds = new Set(),
  onNodeSelect,
  viewMode,
  focusedNodes = [],
  focusedEdges = [],
  onResetView,
}: Graph3DCanvasProps) {
  const displayNodes = viewMode === 'focused' && focusedNodes.length > 0 ? focusedNodes : nodes;
  const displayEdges = viewMode === 'focused' && focusedEdges.length > 0 ? focusedEdges : edges;
  
  const focusedNodeIds = useMemo(() => {
    return new Set((focusedNodes || []).map(n => n.node_id));
  }, [focusedNodes]);

  const handleNodeClick = (node: GraphNode | null, event?: { ctrlKey?: boolean; metaKey?: boolean }) => {
    const multiSelect = event?.ctrlKey || event?.metaKey || false;
    onNodeSelect(node, multiSelect);
  };

  const handleBackgroundClick = () => {
    if (viewMode === 'focused') {
      onResetView();
    } else {
      onNodeSelect(null, false);
    }
  };

  return (
    <div 
      className="w-full h-full"
      style={{ background: 'linear-gradient(180deg, #0a0e27 0%, #1a1e3f 100%)' }}
      data-testid="canvas-3d-graph"
    >
      <Canvas
        onPointerMissed={handleBackgroundClick}
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 25, 70], fov: 60 }}
      >
        <Suspense fallback={null}>
          <Scene 
            nodes={displayNodes} 
            edges={displayEdges} 
            selectedNode={selectedNode}
            selectedNodeIds={selectedNodeIds}
            focusedNodeIds={focusedNodeIds}
            onNodeSelect={handleNodeClick}
            viewMode={viewMode}
            onBackgroundClick={handleBackgroundClick}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

export type { GraphNode, GraphEdge, ViewMode };
