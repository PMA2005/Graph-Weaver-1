import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera, Html, Text } from '@react-three/drei';
import { Suspense, useState, useRef, useMemo } from 'react';
import * as THREE from 'three';

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
  onNodeSelect: (node: GraphNode | null) => void;
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

function calculateNodePositions(nodes: GraphNode[], edges: GraphEdge[]) {
  const positions: Record<string, [number, number, number]> = {};
  const nodeCount = nodes.length;
  
  const projects = nodes.filter(n => n.node_type.toLowerCase() === 'project');
  const people = nodes.filter(n => n.node_type.toLowerCase() === 'person');
  
  projects.forEach((node, index) => {
    const angle = (index / projects.length) * Math.PI * 2;
    const radius = 3;
    positions[node.node_id] = [
      Math.cos(angle) * radius,
      2,
      Math.sin(angle) * radius
    ];
  });
  
  people.forEach((node, index) => {
    const angle = (index / people.length) * Math.PI * 2 + 0.3;
    const radius = 7;
    positions[node.node_id] = [
      Math.cos(angle) * radius,
      -1 + (index % 3) * 0.5,
      Math.sin(angle) * radius
    ];
  });
  
  return positions;
}

function Node3D({ 
  node, 
  position, 
  isSelected, 
  isConnected,
  onClick 
}: { 
  node: GraphNode; 
  position: [number, number, number]; 
  isSelected: boolean;
  isConnected: boolean;
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  const color = NODE_TYPE_COLORS[node.node_type.toLowerCase()] || NODE_TYPE_COLORS.default;
  const typeLabel = NODE_TYPE_LABELS[node.node_type.toLowerCase()] || NODE_TYPE_LABELS.default;
  const shape = NODE_TYPE_SHAPES[node.node_type.toLowerCase()] || NODE_TYPE_SHAPES.default;
  const scale = isSelected ? 1.3 : hovered ? 1.15 : 1;
  const opacity = isSelected || isConnected ? 1 : (hovered ? 0.9 : 0.7);
  
  const geometry = shape === 'sphere' 
    ? <sphereGeometry args={[0.4, 32, 32]} />
    : shape === 'box'
    ? <boxGeometry args={[0.6, 0.6, 0.6]} />
    : <octahedronGeometry args={[0.45]} />;

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={scale}
      >
        {geometry}
        <meshStandardMaterial 
          color={color} 
          emissive={color}
          emissiveIntensity={isSelected ? 0.8 : hovered ? 0.5 : 0.3}
          transparent
          opacity={opacity}
        />
      </mesh>
      
      {(isSelected || hovered) && (
        <mesh scale={1.5}>
          {geometry}
          <meshBasicMaterial 
            color={color} 
            transparent 
            opacity={0.15}
            side={THREE.BackSide}
          />
        </mesh>
      )}
      
      <Html
        position={[0, 0.8, 0]}
        center
        distanceFactor={10}
        style={{ pointerEvents: 'none' }}
      >
        <div 
          className="text-center whitespace-nowrap select-none"
          style={{ 
            transform: 'translateX(-50%)',
            textShadow: '0 0 10px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.6)'
          }}
        >
          <div 
            className="font-display text-sm font-bold"
            style={{ color: color }}
          >
            {node.display_name}
          </div>
          <div 
            className="font-tech text-xs opacity-70"
            style={{ color: color }}
          >
            {typeLabel}
          </div>
        </div>
      </Html>
    </group>
  );
}

function EdgeLabel({
  position,
  relationshipType,
  isHighlighted,
}: {
  position: [number, number, number];
  relationshipType: string;
  isHighlighted: boolean;
}) {
  const formattedLabel = relationshipType.replace(/_/g, ' ');
  
  return (
    <Html
      position={position}
      center
      distanceFactor={12}
      style={{ pointerEvents: 'none' }}
    >
      <div 
        className="font-tech text-xs px-2 py-0.5 rounded whitespace-nowrap select-none"
        style={{ 
          background: isHighlighted ? 'rgba(0, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.5)',
          color: isHighlighted ? '#00ffff' : 'rgba(0, 255, 255, 0.6)',
          border: `1px solid ${isHighlighted ? 'rgba(0, 255, 255, 0.5)' : 'rgba(0, 255, 255, 0.2)'}`,
          textShadow: '0 0 5px rgba(0,0,0,0.8)',
        }}
      >
        {formattedLabel}
      </div>
    </Html>
  );
}

function Edge3D({ 
  start, 
  end, 
  isHighlighted,
  relationshipType,
}: { 
  start: [number, number, number]; 
  end: [number, number, number];
  isHighlighted: boolean;
  relationshipType: string;
}) {
  const lineObject = useMemo(() => {
    const points = [
      new THREE.Vector3(...start),
      new THREE.Vector3(...end)
    ];
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: '#00ffff',
      transparent: true,
      opacity: isHighlighted ? 0.8 : 0.25,
    });
    return new THREE.Line(lineGeometry, lineMaterial);
  }, [start, end, isHighlighted]);
  
  const midPoint: [number, number, number] = [
    (start[0] + end[0]) / 2,
    (start[1] + end[1]) / 2 + 0.3,
    (start[2] + end[2]) / 2
  ];
  
  return (
    <group>
      <primitive object={lineObject} />
      {isHighlighted && (
        <EdgeLabel 
          position={midPoint}
          relationshipType={relationshipType}
          isHighlighted={isHighlighted}
        />
      )}
    </group>
  );
}

function Scene({ 
  nodes, 
  edges, 
  selectedNode, 
  onNodeSelect 
}: Graph3DCanvasProps) {
  const positions = useMemo(() => calculateNodePositions(nodes, edges), [nodes, edges]);
  
  const connectedNodeIds = new Set<string>();
  if (selectedNode) {
    edges.forEach(edge => {
      if (edge.source_node === selectedNode.node_id) {
        connectedNodeIds.add(edge.target_node);
      }
      if (edge.target_node === selectedNode.node_id) {
        connectedNodeIds.add(edge.source_node);
      }
    });
  }

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 5, 15]} fov={60} />
      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={30}
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
      
      {edges.map((edge, i) => {
        const startPos = positions[edge.source_node];
        const endPos = positions[edge.target_node];
        if (!startPos || !endPos) return null;
        
        const isHighlighted = selectedNode && (
          edge.source_node === selectedNode.node_id ||
          edge.target_node === selectedNode.node_id
        );
        
        return (
          <Edge3D 
            key={`edge-${i}`}
            start={startPos}
            end={endPos}
            isHighlighted={!!isHighlighted}
            relationshipType={edge.relationship_type}
          />
        );
      })}
      
      {nodes.map(node => (
        <Node3D
          key={node.node_id}
          node={node}
          position={positions[node.node_id]}
          isSelected={selectedNode?.node_id === node.node_id}
          isConnected={connectedNodeIds.has(node.node_id)}
          onClick={() => onNodeSelect(
            selectedNode?.node_id === node.node_id ? null : node
          )}
        />
      ))}
    </>
  );
}

export default function Graph3DCanvas({ 
  nodes, 
  edges, 
  selectedNode, 
  onNodeSelect 
}: Graph3DCanvasProps) {
  return (
    <div 
      className="w-full h-full"
      style={{ background: 'linear-gradient(180deg, #0a0e27 0%, #1a1e3f 100%)' }}
      data-testid="canvas-3d-graph"
    >
      <Canvas
        onClick={() => onNodeSelect(null)}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <Scene 
            nodes={nodes} 
            edges={edges} 
            selectedNode={selectedNode}
            onNodeSelect={onNodeSelect}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

export type { GraphNode, GraphEdge };
