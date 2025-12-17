import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Graph3DCanvas, { type GraphNode, type GraphEdge } from '@/components/Graph3DCanvas';
import NodeDetailsSidebar from '@/components/NodeDetailsSidebar';
import GraphLegend from '@/components/GraphLegend';
import TopNavigation from '@/components/TopNavigation';
import HelpOverlay from '@/components/HelpOverlay';
import LoadingScreen from '@/components/LoadingScreen';
import { useToast } from '@/hooks/use-toast';

// todo: remove mock functionality - data will come from SQLite API
const mockNodes: GraphNode[] = [
  { node_id: '1', display_name: 'Alice Johnson', description: 'Senior Developer leading the frontend team with expertise in React and TypeScript', node_type: 'person' },
  { node_id: '2', display_name: 'Bob Smith', description: 'Backend architect responsible for API design and database optimization', node_type: 'person' },
  { node_id: '3', display_name: 'Carol White', description: 'Project manager overseeing delivery timelines and stakeholder communication', node_type: 'person' },
  { node_id: '4', display_name: 'David Lee', description: 'UI/UX designer creating intuitive user experiences', node_type: 'person' },
  { node_id: '5', display_name: 'Website Redesign', description: 'Complete overhaul of the company website with modern design patterns and improved performance', node_type: 'project' },
  { node_id: '6', display_name: 'Mobile App', description: 'Native mobile application for iOS and Android platforms with real-time sync', node_type: 'project' },
  { node_id: '7', display_name: 'API Platform', description: 'Core API infrastructure serving all client applications', node_type: 'project' },
  { node_id: '8', display_name: 'Engineering Team', description: 'Core engineering department handling all technical development work', node_type: 'team' },
  { node_id: '9', display_name: 'Design Team', description: 'Creative team responsible for visual design and user research', node_type: 'team' },
  { node_id: '10', display_name: 'Q1 Launch', description: 'Major product launch milestone for first quarter', node_type: 'milestone' },
  { node_id: '11', display_name: 'Beta Release', description: 'Initial beta release to early adopters for feedback', node_type: 'milestone' },
  { node_id: '12', display_name: 'Product Dept', description: 'Product development department overseeing all product initiatives', node_type: 'department' },
];

const mockEdges: GraphEdge[] = [
  { source_node: '1', target_node: '5', relationship_type: 'leads', weight: 1 },
  { source_node: '1', target_node: '8', relationship_type: 'member of', weight: 1 },
  { source_node: '2', target_node: '6', relationship_type: 'contributes to', weight: 1 },
  { source_node: '2', target_node: '7', relationship_type: 'leads', weight: 1 },
  { source_node: '2', target_node: '8', relationship_type: 'member of', weight: 1 },
  { source_node: '3', target_node: '5', relationship_type: 'manages', weight: 1 },
  { source_node: '3', target_node: '6', relationship_type: 'manages', weight: 1 },
  { source_node: '4', target_node: '5', relationship_type: 'designs for', weight: 1 },
  { source_node: '4', target_node: '9', relationship_type: 'member of', weight: 1 },
  { source_node: '5', target_node: '10', relationship_type: 'targets', weight: 1 },
  { source_node: '5', target_node: '11', relationship_type: 'targets', weight: 1 },
  { source_node: '6', target_node: '10', relationship_type: 'targets', weight: 1 },
  { source_node: '7', target_node: '11', relationship_type: 'targets', weight: 1 },
  { source_node: '8', target_node: '12', relationship_type: 'part of', weight: 1 },
  { source_node: '9', target_node: '12', relationship_type: 'part of', weight: 1 },
  { source_node: '1', target_node: '2', relationship_type: 'collaborates with', weight: 1 },
  { source_node: '3', target_node: '4', relationship_type: 'works with', weight: 1 },
];

export default function Home() {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // todo: replace with actual API call when backend is ready
  // const { data, isLoading } = useQuery({
  //   queryKey: ['/api/graph'],
  // });

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const hasVisited = localStorage.getItem('graphVisitorHelp');
    if (!hasVisited) {
      setShowHelp(true);
      localStorage.setItem('graphVisitorHelp', 'true');
    }
  }, []);

  const filteredNodes = typeFilter
    ? mockNodes.filter(n => n.node_type.toLowerCase() === typeFilter)
    : mockNodes;

  const filteredEdges = typeFilter
    ? mockEdges.filter(e => {
        const sourceNode = mockNodes.find(n => n.node_id === e.source_node);
        const targetNode = mockNodes.find(n => n.node_id === e.target_node);
        return (
          sourceNode?.node_type.toLowerCase() === typeFilter ||
          targetNode?.node_type.toLowerCase() === typeFilter
        );
      })
    : mockEdges;

  const handleResetView = () => {
    setSelectedNode(null);
    setTypeFilter(null);
    toast({ title: 'View Reset', description: 'Graph view has been reset to default' });
  };

  const handleExport = () => {
    // todo: implement actual export functionality
    toast({ title: 'Export', description: 'Export functionality coming soon' });
  };

  const handleEdit = () => {
    toast({ title: 'Edit Mode', description: 'Editing capabilities coming in next update' });
  };

  const handleDelete = () => {
    toast({ 
      title: 'Delete Node', 
      description: 'Are you sure? This action cannot be undone.',
      variant: 'destructive'
    });
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="fixed inset-0 overflow-hidden" data-testid="page-home">
      <TopNavigation
        onResetView={handleResetView}
        onExport={handleExport}
        onHelp={() => setShowHelp(true)}
        onSettings={() => toast({ title: 'Settings', description: 'Settings panel coming soon' })}
      />

      <div className="absolute inset-0 pt-16 pb-20">
        <Graph3DCanvas
          nodes={filteredNodes}
          edges={filteredEdges}
          selectedNode={selectedNode}
          onNodeSelect={setSelectedNode}
        />
      </div>

      {selectedNode && (
        <NodeDetailsSidebar
          node={selectedNode}
          edges={mockEdges}
          allNodes={mockNodes}
          onClose={() => setSelectedNode(null)}
          onNodeNavigate={(node) => setSelectedNode(node)}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      <GraphLegend
        onFilterType={setTypeFilter}
        activeFilter={typeFilter}
      />

      {showHelp && (
        <HelpOverlay onClose={() => setShowHelp(false)} />
      )}
    </div>
  );
}
