import NodeDetailsSidebar from '../NodeDetailsSidebar';

// todo: remove mock functionality
const mockNode = {
  node_id: '1',
  display_name: 'Alice Johnson',
  description: 'Senior Developer leading the frontend team. She has over 10 years of experience in web development and specializes in React and TypeScript.',
  node_type: 'person',
};

const mockAllNodes = [
  mockNode,
  { node_id: '2', display_name: 'Bob Smith', description: 'Backend architect', node_type: 'person' },
  { node_id: '4', display_name: 'Website Redesign', description: 'Company website overhaul', node_type: 'project' },
  { node_id: '6', display_name: 'Engineering Team', description: 'Core engineering team', node_type: 'team' },
];

const mockEdges = [
  { source_node: '1', target_node: '4', relationship_type: 'leads', weight: 1 },
  { source_node: '1', target_node: '6', relationship_type: 'member of', weight: 1 },
  { source_node: '2', target_node: '1', relationship_type: 'collaborates with', weight: 1 },
];

export default function NodeDetailsSidebarExample() {
  return (
    <div 
      className="relative w-full h-[600px]" 
      style={{ background: 'linear-gradient(180deg, #0a0e27 0%, #1a1e3f 100%)' }}
    >
      <NodeDetailsSidebar
        node={mockNode}
        edges={mockEdges}
        allNodes={mockAllNodes}
        onClose={() => console.log('Close sidebar')}
        onNodeNavigate={(node) => console.log('Navigate to:', node.display_name)}
        onEdit={() => console.log('Edit node')}
        onDelete={() => console.log('Delete node')}
      />
    </div>
  );
}
