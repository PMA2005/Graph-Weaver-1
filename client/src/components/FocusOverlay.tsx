import { X, RotateCcw, User, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GraphNode {
  node_id: string;
  display_name: string;
  description: string;
  node_type: string;
}

interface FocusOverlayProps {
  selectedNodes: GraphNode[];
  viewMode: 'global' | 'focused';
  onRemoveNode: (nodeId: string) => void;
  onResetView: () => void;
  onNodeClick: (node: GraphNode) => void;
}

const NODE_TYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  person: { bg: 'bg-cyan-500/20', border: 'border-cyan-500/50', text: 'text-cyan-400' },
  project: { bg: 'bg-purple-500/20', border: 'border-purple-500/50', text: 'text-purple-400' },
};

export default function FocusOverlay({
  selectedNodes,
  viewMode,
  onRemoveNode,
  onResetView,
  onNodeClick,
}: FocusOverlayProps) {
  if (selectedNodes.length === 0 && viewMode === 'global') {
    return null;
  }

  return (
    <div 
      className="absolute top-16 sm:top-20 left-2 right-2 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-40 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-lg"
      style={{
        background: 'rgba(10, 14, 39, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(0, 255, 255, 0.2)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
      }}
      data-testid="overlay-focus"
    >
      {viewMode === 'focused' && (
        <div className="hidden sm:flex items-center gap-2 text-cyan-400 text-sm font-tech uppercase tracking-wider">
          <span className="opacity-60">Focused on:</span>
        </div>
      )}
      
      <div className="flex items-center gap-2 flex-wrap flex-1 max-w-full sm:max-w-[600px]">
        {selectedNodes.map((node, index) => {
          const colors = NODE_TYPE_COLORS[node.node_type.toLowerCase()] || NODE_TYPE_COLORS.person;
          const Icon = node.node_type.toLowerCase() === 'project' ? Folder : User;
          
          return (
            <div 
              key={node.node_id}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md border ${colors.bg} ${colors.border} cursor-pointer hover-elevate`}
              onClick={() => onNodeClick(node)}
              data-testid={`chip-node-${node.node_id}`}
            >
              <Icon className={`w-3 h-3 ${colors.text}`} />
              <span className={`text-sm font-medium ${colors.text}`}>
                {node.display_name}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveNode(node.node_id);
                }}
                className="ml-1 p-0.5 rounded hover:bg-white/10 transition-colors"
                data-testid={`button-remove-node-${node.node_id}`}
              >
                <X className="w-3 h-3 text-gray-400 hover:text-white" />
              </button>
            </div>
          );
        })}
      </div>

      {(viewMode === 'focused' || selectedNodes.length > 0) && (
        <Button
          size="sm"
          variant="outline"
          onClick={onResetView}
          className="ml-2 border-cyan-500/50 text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20"
          data-testid="button-reset-view"
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Reset
        </Button>
      )}
    </div>
  );
}
