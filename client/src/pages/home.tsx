import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import Graph3DCanvas from '@/components/Graph3DCanvas';
import NodeDetailsSidebar from '@/components/NodeDetailsSidebar';
import GraphLegend from '@/components/GraphLegend';
import TopNavigation from '@/components/TopNavigation';
import HelpOverlay from '@/components/HelpOverlay';
import LoadingScreen from '@/components/LoadingScreen';
import AddNodeModal from '@/components/AddNodeModal';
import EditNodeModal from '@/components/EditNodeModal';
import AddEdgeModal from '@/components/AddEdgeModal';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { useToast } from '@/hooks/use-toast';
import type { GraphData, GraphNode, GraphEdge } from '@shared/schema';

export default function Home() {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [showAddNode, setShowAddNode] = useState(false);
  const [showEditNode, setShowEditNode] = useState(false);
  const [showAddEdge, setShowAddEdge] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'node' | 'edge'; item: GraphNode | GraphEdge } | null>(null);
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

  const addNodeMutation = useMutation({
    mutationFn: async (node: { node_id: string; display_name: string; description: string; node_type: string }) => {
      return apiRequest('POST', '/api/nodes', node);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/graph'] });
      setShowAddNode(false);
      toast({ title: 'Success', description: 'Node added successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to add node', variant: 'destructive' });
    },
  });

  const updateNodeMutation = useMutation({
    mutationFn: async ({ nodeId, updates }: { nodeId: string; updates: { display_name?: string; description?: string } }) => {
      return apiRequest('PATCH', `/api/nodes/${encodeURIComponent(nodeId)}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/graph'] });
      setShowEditNode(false);
      setSelectedNode(null);
      toast({ title: 'Success', description: 'Node updated successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update node', variant: 'destructive' });
    },
  });

  const deleteNodeMutation = useMutation({
    mutationFn: async (nodeId: string) => {
      return apiRequest('DELETE', `/api/nodes/${encodeURIComponent(nodeId)}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/graph'] });
      setDeleteTarget(null);
      setSelectedNode(null);
      toast({ title: 'Success', description: 'Node deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete node', variant: 'destructive' });
    },
  });

  const addEdgeMutation = useMutation({
    mutationFn: async (edge: { source_node: string; target_node: string; relationship_type: string; weight?: number }) => {
      return apiRequest('POST', '/api/edges', edge);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/graph'] });
      setShowAddEdge(false);
      toast({ title: 'Success', description: 'Relationship created successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create relationship', variant: 'destructive' });
    },
  });

  const deleteEdgeMutation = useMutation({
    mutationFn: async ({ source_node, target_node, relationship_type }: { source_node: string; target_node: string; relationship_type: string }) => {
      return apiRequest('DELETE', `/api/edges?source_node=${encodeURIComponent(source_node)}&target_node=${encodeURIComponent(target_node)}&relationship_type=${encodeURIComponent(relationship_type)}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/graph'] });
      setDeleteTarget(null);
      toast({ title: 'Success', description: 'Relationship removed successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to remove relationship', variant: 'destructive' });
    },
  });

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
    const dataStr = JSON.stringify(graphData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'graph-data.json';
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported', description: 'Graph data exported as JSON' });
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          toast({ title: 'Error', description: 'Invalid JSON file format.', variant: 'destructive' });
          return;
        }
        
        if (!data.nodes && !data.edges) {
          toast({ title: 'Error', description: 'Invalid file format. Expected JSON with nodes and/or edges.', variant: 'destructive' });
          return;
        }
        
        const response = await apiRequest('POST', '/api/import', data);
        
        if (!response.ok) {
          const errorData = await response.json();
          toast({ title: 'Error', description: errorData.error || 'Failed to import data.', variant: 'destructive' });
          return;
        }
        
        const result = await response.json();
        
        queryClient.invalidateQueries({ queryKey: ['/api/graph'] });
        setSelectedNode(null);
        toast({ title: 'Imported', description: result.message });
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to import data. Please try again.', variant: 'destructive' });
      }
    };
    input.click();
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    
    if (deleteTarget.type === 'node') {
      deleteNodeMutation.mutate((deleteTarget.item as GraphNode).node_id);
    } else {
      const edge = deleteTarget.item as GraphEdge;
      deleteEdgeMutation.mutate({ source_node: edge.source_node, target_node: edge.target_node, relationship_type: edge.relationship_type });
    }
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

  const isAnyModalOpen = showAddNode || showEditNode || showAddEdge || !!deleteTarget;
  const isSidebarOpen = !!selectedNode;

  return (
    <div className="fixed inset-0 overflow-hidden" data-testid="page-home">
      <TopNavigation
        onResetView={handleResetView}
        onExport={handleExport}
        onImport={handleImport}
        onHelp={() => setShowHelp(true)}
        onSettings={() => toast({ title: 'Settings', description: 'Settings panel coming soon' })}
        onAddNode={() => setShowAddNode(true)}
      />

      <div 
        className="absolute inset-0 pt-16 pb-20 transition-all duration-300"
        style={{ 
          opacity: isAnyModalOpen ? 0 : 1,
          filter: isSidebarOpen && !isAnyModalOpen ? 'blur(3px)' : 'none',
        }}
      >
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
          onEdit={() => setShowEditNode(true)}
          onDelete={() => setDeleteTarget({ type: 'node', item: selectedNode })}
          onAddRelationship={() => setShowAddEdge(true)}
          onRemoveRelationship={(edge) => setDeleteTarget({ type: 'edge', item: edge })}
        />
      )}

      <GraphLegend
        onFilterType={setTypeFilter}
        activeFilter={typeFilter}
      />

      {showHelp && (
        <HelpOverlay onClose={() => setShowHelp(false)} />
      )}

      {showAddNode && (
        <AddNodeModal
          onClose={() => setShowAddNode(false)}
          onSubmit={(node) => addNodeMutation.mutate(node)}
          isLoading={addNodeMutation.isPending}
        />
      )}

      {showEditNode && selectedNode && (
        <EditNodeModal
          node={selectedNode}
          onClose={() => setShowEditNode(false)}
          onSubmit={(nodeId, updates) => updateNodeMutation.mutate({ nodeId, updates })}
          isLoading={updateNodeMutation.isPending}
        />
      )}

      {showAddEdge && (
        <AddEdgeModal
          nodes={nodes}
          onClose={() => setShowAddEdge(false)}
          onSubmit={(edge) => addEdgeMutation.mutate(edge)}
          isLoading={addEdgeMutation.isPending}
          preselectedSource={selectedNode?.node_id}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          title={deleteTarget.type === 'node' ? 'Delete Node' : 'Remove Relationship'}
          message={
            deleteTarget.type === 'node'
              ? 'This will permanently delete this node and all its relationships. This action cannot be undone.'
              : 'This will remove the relationship between these two nodes.'
          }
          itemName={
            deleteTarget.type === 'node'
              ? (deleteTarget.item as GraphNode).display_name
              : `${(deleteTarget.item as GraphEdge).source_node} → ${(deleteTarget.item as GraphEdge).target_node}`
          }
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
          isLoading={deleteNodeMutation.isPending || deleteEdgeMutation.isPending}
        />
      )}
    </div>
  );
}
