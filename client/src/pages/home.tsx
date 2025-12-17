import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Graph3DCanvas from '@/components/Graph3DCanvas';
import NodeDetailsSidebar from '@/components/NodeDetailsSidebar';
import GraphLegend from '@/components/GraphLegend';
import TopNavigation from '@/components/TopNavigation';
import HelpOverlay from '@/components/HelpOverlay';
import LoadingScreen from '@/components/LoadingScreen';
import { useToast } from '@/hooks/use-toast';
import type { GraphData } from '@shared/schema';

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

export default function Home() {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: graphData, isLoading, error } = useQuery<GraphData>({
    queryKey: ['/api/graph'],
  });

  useEffect(() => {
    const hasVisited = localStorage.getItem('graphVisitorHelp');
    if (!hasVisited) {
      setShowHelp(true);
      localStorage.setItem('graphVisitorHelp', 'true');
    }
  }, []);

  const nodes: GraphNode[] = graphData?.nodes || [];
  const edges: GraphEdge[] = graphData?.edges || [];

  const filteredNodes = typeFilter
    ? nodes.filter(n => n.node_type.toLowerCase() === typeFilter)
    : nodes;

  const filteredEdges = typeFilter
    ? edges.filter(e => {
        const sourceNode = nodes.find(n => n.node_id === e.source_node);
        const targetNode = nodes.find(n => n.node_id === e.target_node);
        return (
          sourceNode?.node_type.toLowerCase() === typeFilter ||
          targetNode?.node_type.toLowerCase() === typeFilter
        );
      })
    : edges;

  const handleResetView = () => {
    setSelectedNode(null);
    setTypeFilter(null);
    toast({ title: 'View Reset', description: 'Graph view has been reset to default' });
  };

  const handleExport = () => {
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

  if (error) {
    return (
      <div 
        className="fixed inset-0 flex flex-col items-center justify-center"
        style={{ background: 'linear-gradient(180deg, #0a0e27 0%, #1a1e3f 100%)' }}
      >
        <p className="text-red-400 font-tech">Error loading graph data</p>
        <p className="text-gray-500 text-sm mt-2">Please check the database connection</p>
      </div>
    );
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
          edges={edges}
          allNodes={nodes}
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
