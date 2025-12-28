import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import Graph2DCanvas from '@/components/Graph2DCanvas';
import type { ViewMode, LayoutMode } from '@/components/Graph2DCanvas';
import NodeDetailsSidebar from '@/components/NodeDetailsSidebar';
import GraphLegend from '@/components/GraphLegend';
import TopNavigation from '@/components/TopNavigation';
import HelpOverlay from '@/components/HelpOverlay';
import GuidedTour from '@/components/GuidedTour';
import LoadingScreen from '@/components/LoadingScreen';
import AddNodeModal from '@/components/AddNodeModal';
import EditNodeModal from '@/components/EditNodeModal';
import AddEdgeModal from '@/components/AddEdgeModal';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import FocusOverlay from '@/components/FocusOverlay';
import { useToast } from '@/hooks/use-toast';
import type { GraphData, GraphNode, GraphEdge } from '@shared/schema';

export default function Home() {
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());
  const [selectionOrder, setSelectionOrder] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('global');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('force');
  const [showHelp, setShowHelp] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [showAddNode, setShowAddNode] = useState(false);
  const [showEditNode, setShowEditNode] = useState(false);
  const [showAddEdge, setShowAddEdge] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'node' | 'edge'; item: GraphNode | GraphEdge } | null>(null);
  const [graphKey, setGraphKey] = useState(0);
  const { toast } = useToast();

  const toggleNodeSelection = useCallback((node: GraphNode, multiSelect: boolean = false) => {
    const nodeId = node.node_id;
    setSelectedNodeIds(prev => {
      const newSet = new Set(prev);
      const isAlreadyInFocusedView = prev.size > 0;
      
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
        setSelectionOrder(order => order.filter(id => id !== nodeId));
        if (newSet.size === 0) {
          setViewMode('global');
        }
      } else {
        if (!multiSelect && !isAlreadyInFocusedView) {
          newSet.clear();
          setSelectionOrder([nodeId]);
        } else {
          setSelectionOrder(order => [...order, nodeId]);
        }
        newSet.add(nodeId);
        setViewMode('focused');
      }
      return newSet;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedNodeIds(new Set());
    setSelectionOrder([]);
    setViewMode('global');
  }, []);

  const removeNodeFromSelection = useCallback((nodeId: string) => {
    setSelectedNodeIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(nodeId);
      if (newSet.size === 0) {
        setViewMode('global');
      }
      return newSet;
    });
    setSelectionOrder(order => order.filter(id => id !== nodeId));
  }, []);

  const makePrimaryNode = useCallback((nodeId: string) => {
    setSelectionOrder(order => {
      const filtered = order.filter(id => id !== nodeId);
      return [...filtered, nodeId];
    });
  }, []);

  const { data: graphData, isLoading, error } = useQuery<GraphData>({
    queryKey: ['/api/graph'],
  });

  useEffect(() => {
    const hasCompletedTour = localStorage.getItem('graphTourCompleted');
    if (!hasCompletedTour) {
      setShowTour(true);
    }
  }, []);

  const handleTourComplete = useCallback(() => {
    localStorage.setItem('graphTourCompleted', 'true');
    setShowTour(false);
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
      clearSelection();
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
      clearSelection();
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

  const filteredNodeIds = new Set(filteredNodes.map(n => n.node_id));

  const filteredEdges = typeFilter
    ? edges.filter(e => 
        filteredNodeIds.has(e.source_node) && 
        filteredNodeIds.has(e.target_node)
      )
    : edges;

  const selectedNodes = useMemo(() => 
    selectionOrder.map(id => nodes.find(n => n.node_id === id)).filter(Boolean) as GraphNode[],
    [selectionOrder, nodes]
  );

  // Show the most recently selected node in the sidebar
  const primaryNode = selectedNodes[selectedNodes.length - 1] || null;

  const getNeighborhood = useCallback((nodeId: string) => {
    const neighborEdges = edges.filter(e => e.source_node === nodeId || e.target_node === nodeId);
    const neighborIds = new Set<string>();
    neighborIds.add(nodeId);
    neighborEdges.forEach(e => {
      neighborIds.add(e.source_node);
      neighborIds.add(e.target_node);
    });
    const neighborNodes = nodes.filter(n => neighborIds.has(n.node_id));
    return { nodes: neighborNodes, edges: neighborEdges };
  }, [nodes, edges]);

  const focusedSubgraph = useMemo(() => {
    if (selectedNodes.length === 0) return { nodes: [], edges: [] };
    
    const allNeighborIds = new Set<string>();
    const allNeighborEdges: GraphEdge[] = [];
    const edgeSet = new Set<string>();
    
    selectedNodes.forEach(node => {
      const neighborhood = getNeighborhood(node.node_id);
      neighborhood.nodes.forEach(n => allNeighborIds.add(n.node_id));
      neighborhood.edges.forEach(e => {
        const edgeKey = `${e.source_node}-${e.target_node}-${e.relationship_type}`;
        if (!edgeSet.has(edgeKey)) {
          edgeSet.add(edgeKey);
          allNeighborEdges.push(e);
        }
      });
    });
    
    return {
      nodes: nodes.filter(n => allNeighborIds.has(n.node_id)),
      edges: allNeighborEdges
    };
  }, [selectedNodes, getNeighborhood, nodes]);

  const handleResetView = () => {
    clearSelection();
    setTypeFilter(null);
    setGraphKey(k => k + 1);
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
        clearSelection();
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

  const handleNodeSelect = useCallback((node: GraphNode | null, multiSelect?: boolean | { ctrlKey?: boolean; metaKey?: boolean }) => {
    if (node) {
      const isMultiSelect = typeof multiSelect === 'boolean' 
        ? multiSelect 
        : (multiSelect?.ctrlKey || multiSelect?.metaKey || false);
      toggleNodeSelection(node, isMultiSelect);
    } else {
      clearSelection();
    }
  }, [toggleNodeSelection, clearSelection]);

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

  const isAnyModalOpen = showAddNode || showEditNode || showAddEdge || !!deleteTarget || showHelp;

  return (
    <div className="fixed inset-0 overflow-hidden" data-testid="page-home">
      <TopNavigation
        onResetView={handleResetView}
        onExport={handleExport}
        onImport={handleImport}
        onHelp={() => setShowHelp(true)}
        onSettings={() => toast({ title: 'Settings', description: 'Settings panel coming soon' })}
        onAddNode={() => setShowAddNode(true)}
        nodes={nodes}
        onNodeSelect={(node) => {
          setTypeFilter(null); // Clear type filter so searched node is visible
          handleNodeSelect(node, false);
        }}
      />

      <div className="absolute inset-0 pt-14 sm:pt-16 pb-16 sm:pb-20">
        <div className="w-full h-full relative flex items-center justify-center">
          {!isAnyModalOpen && (
            <Graph2DCanvas
              key={graphKey}
              nodes={filteredNodes}
              edges={filteredEdges}
              selectedNode={primaryNode}
              selectedNodeIds={selectedNodeIds}
              onNodeSelect={handleNodeSelect}
              viewMode={viewMode}
              layoutMode={layoutMode}
              focusedNodes={focusedSubgraph.nodes}
              focusedEdges={focusedSubgraph.edges}
              onResetView={handleResetView}
            />
          )}
        </div>
      </div>

      <FocusOverlay
        selectedNodes={selectedNodes}
        viewMode={viewMode}
        onRemoveNode={removeNodeFromSelection}
        onResetView={handleResetView}
        onNodeClick={(node) => {
          makePrimaryNode(node.node_id);
        }}
      />

      {primaryNode && (
        <NodeDetailsSidebar
          node={primaryNode}
          edges={edges}
          allNodes={nodes}
          onClose={clearSelection}
          onNodeNavigate={(node) => handleNodeSelect(node, false)}
          onEdit={() => setShowEditNode(true)}
          onDelete={() => setDeleteTarget({ type: 'node', item: primaryNode })}
          onAddRelationship={() => setShowAddEdge(true)}
          onRemoveRelationship={(edge) => setDeleteTarget({ type: 'edge', item: edge })}
        />
      )}

      <GraphLegend
        onFilterType={setTypeFilter}
        activeFilter={typeFilter}
        layoutMode={layoutMode}
        onLayoutChange={setLayoutMode}
      />

      {showHelp && (
        <HelpOverlay 
          onClose={() => setShowHelp(false)} 
          onStartTour={() => {
            setShowHelp(false);
            setShowTour(true);
          }}
        />
      )}

      <GuidedTour
        isOpen={showTour}
        onClose={() => setShowTour(false)}
        onComplete={handleTourComplete}
      />

      {showAddNode && (
        <AddNodeModal
          onClose={() => setShowAddNode(false)}
          onSubmit={(node) => addNodeMutation.mutate(node)}
          isLoading={addNodeMutation.isPending}
        />
      )}

      {showEditNode && primaryNode && (
        <EditNodeModal
          node={primaryNode}
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
          preselectedSource={primaryNode?.node_id}
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
