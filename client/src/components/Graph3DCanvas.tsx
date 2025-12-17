import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera } from '@react-three/drei';
import { Suspense, useState, useRef } from 'react';
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

const NODE_TYPE_SHAPES: Record<string, 'sphere' | 'box' | 'octahedron'> = {
  person: 'sphere',
  project: 'box',
  default: 'sphere',
};

function calculateNodePositions(nodes: GraphNode[], edges: GraphEdge[]) {
  const positions: Record<string, [number, number, number]> = {};
  const nodeCount = nodes.length;
  
  nodes.forEach((node, index) => {
    const angle = (index / nodeCount) * Math.PI * 2;
    const radius = 5 + Math.random() * 3;
    const height = (Math.random() - 0.5) * 4;
    positions[node.node_id] = [
      Math.cos(angle) * radius,
      height,
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
    </group>
  );
}

function Edge3D({ 
  start, 
  end, 
  isHighlighted,
}: { 
  start: [number, number, number]; 
  end: [number, number, number];
  isHighlighted: boolean;
}) {
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
  
  return <primitive object={new THREE.Line(lineGeometry, lineMaterial)} />;
}

function Scene({ 
  nodes, 
  edges, 
  selectedNode, 
  onNodeSelect 
}: Graph3DCanvasProps) {
  const positions = calculateNodePositions(nodes, edges);
  
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
