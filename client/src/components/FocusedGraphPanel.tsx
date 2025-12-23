import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Suspense, useMemo } from 'react';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { User, Folder, Layers, Eye } from 'lucide-react';

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

interface FocusedGraphPanelProps {
  subgraph: { nodes: GraphNode[]; edges: GraphEdge[] };
  selectedNodes: GraphNode[];
  selectedNodeIds: Set<string>;
  viewMode: 'single' | 'combined';
  activeViewIndex: number;
  onViewModeChange: (mode: 'single' | 'combined') => void;
  onActiveViewChange: (index: number) => void;
  onNodeSelect: (node: GraphNode) => void;
  onNodeNavigate: (node: GraphNode) => void;
}

const NODE_TYPE_COLORS: Record<string, string> = {
  person: '#00ffff',
  project: '#b026ff',
  default: '#ff6b35',
};

function calculateFocusedPositions(nodes: GraphNode[], edges: GraphEdge[], centerNodeId?: string) {
  const positions: Record<string, [number, number, number]> = {};
  
  if (nodes.length === 0) return positions;
  
  const centerNode = centerNodeId ? nodes.find(n => n.node_id === centerNodeId) : nodes[0];
  if (centerNode) {
    positions[centerNode.node_id] = [0, 0, 0];
  }
  
  const otherNodes = nodes.filter(n => n.node_id !== centerNode?.node_id);
  const radius = Math.max(2, otherNodes.length * 0.4);
  
  otherNodes.forEach((node, index) => {
    const angle = (index / otherNodes.length) * Math.PI * 2;
    positions[node.node_id] = [
      Math.cos(angle) * radius,
      (Math.random() - 0.5) * 0.5,
      Math.sin(angle) * radius
    ];
  });
  
  return positions;
}

function FocusedNode({ 
  node, 
  position, 
  isCenter,
  isSelected,
  onClick 
}: { 
  node: GraphNode; 
  position: [number, number, number]; 
  isCenter: boolean;
  isSelected: boolean;
  onClick: () => void;
}) {
  const color = NODE_TYPE_COLORS[node.node_type.toLowerCase()] || NODE_TYPE_COLORS.default;
  const isPerson = node.node_type.toLowerCase() === 'person';
  const scale = isCenter ? 1.2 : 1;

  return (
    <group position={position}>
      <mesh onClick={(e) => { e.stopPropagation(); onClick(); }} scale={scale}>
        {isPerson ? (
          <sphereGeometry args={[0.25, 16, 16]} />
        ) : (
          <boxGeometry args={[0.4, 0.4, 0.4]} />
        )}
        <meshStandardMaterial 
          color={color} 
          emissive={color}
          emissiveIntensity={isCenter ? 0.6 : isSelected ? 0.4 : 0.2}
          transparent
          opacity={0.9}
        />
      </mesh>
      {isCenter && (
        <pointLight color={color} intensity={0.5} distance={3} />
      )}
    </group>
  );
}

function FocusedEdge({ 
  start, 
  end, 
  relationshipType 
}: { 
  start: [number, number, number]; 
  end: [number, number, number]; 
  relationshipType: string;
}) {
  const lineRef = useMemo(() => {
    const points = [
      new THREE.Vector3(...start),
      new THREE.Vector3(...end)
    ];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ 
      color: '#00ffff', 
      transparent: true, 
      opacity: 0.4 
    });
    return new THREE.Line(geometry, material);
  }, [start, end]);

  return <primitive object={lineRef} />;
}

function FocusedScene({ 
  nodes, 
  edges, 
  centerNodeId,
  selectedNodeIds,
  onNodeClick 
}: { 
  nodes: GraphNode[]; 
  edges: GraphEdge[];
  centerNodeId?: string;
  selectedNodeIds: Set<string>;
  onNodeClick: (node: GraphNode) => void;
}) {
  const positions = useMemo(() => 
    calculateFocusedPositions(nodes, edges, centerNodeId),
    [nodes, edges, centerNodeId]
  );

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={0.5} />
      
      {edges.map((edge, i) => {
        const start = positions[edge.source_node];
        const end = positions[edge.target_node];
        if (!start || !end) return null;
        return (
          <FocusedEdge 
            key={i} 
            start={start} 
            end={end} 
            relationshipType={edge.relationship_type}
          />
        );
      })}

      {nodes.map(node => {
        const pos = positions[node.node_id];
        if (!pos) return null;
        return (
          <FocusedNode
            key={node.node_id}
            node={node}
            position={pos}
            isCenter={node.node_id === centerNodeId}
            isSelected={selectedNodeIds.has(node.node_id)}
            onClick={() => onNodeClick(node)}
          />
        );
      })}
    </>
  );
}

export default function FocusedGraphPanel({
  subgraph,
  selectedNodes,
  selectedNodeIds,
  viewMode,
  activeViewIndex,
  onViewModeChange,
  onActiveViewChange,
  onNodeSelect,
  onNodeNavigate,
}: FocusedGraphPanelProps) {
  const centerNodeId = viewMode === 'single' && selectedNodes[activeViewIndex]
    ? selectedNodes[activeViewIndex].node_id
    : selectedNodes[0]?.node_id;

  return (
    <div 
      className="w-80 h-full flex flex-col border-r border-cyan-500/20"
      style={{ background: 'rgba(10, 14, 39, 0.9)' }}
      data-testid="panel-focused-graph"
    >
      <div className="p-3 border-b border-cyan-500/20 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-tech text-cyan-400 uppercase tracking-wider">
            Focused View
          </h3>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={viewMode === 'single' ? 'default' : 'ghost'}
              onClick={() => onViewModeChange('single')}
              className="h-7 px-2 text-xs"
              data-testid="button-view-single"
            >
              <Eye className="w-3 h-3 mr-1" />
              Single
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'combined' ? 'default' : 'ghost'}
              onClick={() => onViewModeChange('combined')}
              className="h-7 px-2 text-xs"
              data-testid="button-view-combined"
            >
              <Layers className="w-3 h-3 mr-1" />
              All
            </Button>
          </div>
        </div>

        {viewMode === 'single' && selectedNodes.length > 1 && (
          <div className="flex flex-wrap gap-1">
            {selectedNodes.map((node, index) => {
              const Icon = node.node_type.toLowerCase() === 'person' ? User : Folder;
              const isActive = index === activeViewIndex;
              return (
                <Button
                  key={node.node_id}
                  size="sm"
                  variant={isActive ? 'default' : 'outline'}
                  onClick={() => onActiveViewChange(index)}
                  className={`h-6 px-2 text-xs ${isActive ? '' : 'border-cyan-500/30 text-cyan-400'}`}
                  data-testid={`button-switch-node-${index}`}
                >
                  <Icon className="w-3 h-3 mr-1" />
                  {node.display_name.length > 10 
                    ? node.display_name.slice(0, 10) + '...' 
                    : node.display_name}
                </Button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex-1 relative">
        <Canvas>
          <Suspense fallback={null}>
            <PerspectiveCamera makeDefault position={[0, 3, 6]} fov={50} />
            <OrbitControls 
              enablePan={false}
              minDistance={3}
              maxDistance={15}
              autoRotate
              autoRotateSpeed={0.5}
            />
            <FocusedScene
              nodes={subgraph.nodes}
              edges={subgraph.edges}
              centerNodeId={centerNodeId}
              selectedNodeIds={selectedNodeIds}
              onNodeClick={onNodeNavigate}
            />
          </Suspense>
        </Canvas>
      </div>

      <div className="p-2 border-t border-cyan-500/20">
        <p className="text-xs text-gray-500 text-center">
          {subgraph.nodes.length} nodes, {subgraph.edges.length} connections
        </p>
      </div>
    </div>
  );
}
