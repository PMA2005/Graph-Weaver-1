import Graph3DCanvas from '../Graph3DCanvas';
import { useState } from 'react';
import type { GraphNode, GraphEdge } from '../Graph3DCanvas';

// todo: remove mock functionality - this data will come from SQLite database
const mockNodes: GraphNode[] = [
  { node_id: '1', display_name: 'Alice Johnson', description: 'Senior Developer leading the frontend team', node_type: 'person' },
  { node_id: '2', display_name: 'Bob Smith', description: 'Backend architect responsible for API design', node_type: 'person' },
  { node_id: '3', display_name: 'Carol White', description: 'Project manager overseeing delivery timelines', node_type: 'person' },
  { node_id: '4', display_name: 'Website Redesign', description: 'Complete overhaul of the company website with modern design', node_type: 'project' },
  { node_id: '5', display_name: 'Mobile App', description: 'Native mobile application for iOS and Android', node_type: 'project' },
  { node_id: '6', display_name: 'Engineering Team', description: 'Core engineering department handling all technical work', node_type: 'team' },
  { node_id: '7', display_name: 'Q1 Launch', description: 'Major product launch milestone for Q1', node_type: 'milestone' },
  { node_id: '8', display_name: 'Product Dept', description: 'Product development department', node_type: 'department' },
];

const mockEdges: GraphEdge[] = [
  { source_node: '1', target_node: '4', relationship_type: 'leads', weight: 1 },
  { source_node: '1', target_node: '6', relationship_type: 'member of', weight: 1 },
  { source_node: '2', target_node: '5', relationship_type: 'contributes to', weight: 1 },
  { source_node: '2', target_node: '6', relationship_type: 'member of', weight: 1 },
  { source_node: '3', target_node: '4', relationship_type: 'manages', weight: 1 },
  { source_node: '3', target_node: '5', relationship_type: 'manages', weight: 1 },
  { source_node: '4', target_node: '7', relationship_type: 'targets', weight: 1 },
  { source_node: '6', target_node: '8', relationship_type: 'part of', weight: 1 },
  { source_node: '5', target_node: '7', relationship_type: 'targets', weight: 1 },
];

export default function Graph3DCanvasExample() {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  return (
    <div className="w-full h-[600px]">
      <Graph3DCanvas
        nodes={mockNodes}
        edges={mockEdges}
        selectedNode={selectedNode}
        onNodeSelect={setSelectedNode}
      />
    </div>
  );
}
