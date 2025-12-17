import { X, User, Folder, Users, Flag, Building2, Link2, Trash2, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

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

interface NodeDetailsSidebarProps {
  node: GraphNode;
  edges: GraphEdge[];
  allNodes: GraphNode[];
  onClose: () => void;
  onNodeNavigate: (node: GraphNode) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const NODE_TYPE_COLORS: Record<string, string> = {
  person: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50',
  project: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
  team: 'bg-pink-500/20 text-pink-400 border-pink-500/50',
  milestone: 'bg-green-500/20 text-green-400 border-green-500/50',
  department: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  default: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
};

const NODE_TYPE_ICONS: Record<string, typeof User> = {
  person: User,
  project: Folder,
  team: Users,
  milestone: Flag,
  department: Building2,
};

export default function NodeDetailsSidebar({
  node,
  edges,
  allNodes,
  onClose,
  onNodeNavigate,
  onEdit,
  onDelete,
}: NodeDetailsSidebarProps) {
  const nodeTypeClass = NODE_TYPE_COLORS[node.node_type.toLowerCase()] || NODE_TYPE_COLORS.default;
  const NodeIcon = NODE_TYPE_ICONS[node.node_type.toLowerCase()] || User;

  const connections = edges
    .filter(e => e.source_node === node.node_id || e.target_node === node.node_id)
    .map(e => {
      const isSource = e.source_node === node.node_id;
      const connectedId = isSource ? e.target_node : e.source_node;
      const connectedNode = allNodes.find(n => n.node_id === connectedId);
      return {
        edge: e,
        connectedNode,
        direction: isSource ? 'outgoing' : 'incoming',
      };
    })
    .filter(c => c.connectedNode);

  return (
    <div 
      className="absolute right-4 top-20 bottom-24 w-96 z-50 animate-in slide-in-from-right duration-300"
      data-testid="sidebar-node-details"
    >
      <div 
        className="h-full rounded-lg border border-cyan-500/30 overflow-hidden"
        style={{
          background: 'rgba(20, 24, 59, 0.85)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 0 30px rgba(0, 255, 255, 0.15)',
        }}
      >
        <div className="p-4 border-b border-cyan-500/20 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div 
              className="p-2 rounded-lg border"
              style={{
                background: 'rgba(0, 255, 255, 0.1)',
                borderColor: 'rgba(0, 255, 255, 0.3)',
              }}
            >
              <NodeIcon className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="min-w-0">
              <h2 
                className="font-display text-lg font-semibold text-white truncate"
                data-testid="text-node-name"
              >
                {node.display_name}
              </h2>
              <Badge 
                variant="outline" 
                className={`text-xs mt-1 ${nodeTypeClass}`}
                data-testid="badge-node-type"
              >
                {node.node_type}
              </Badge>
            </div>
          </div>
          <Button 
            size="icon" 
            variant="ghost"
            onClick={onClose}
            className="text-gray-400 hover:text-white shrink-0"
            data-testid="button-close-sidebar"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <ScrollArea className="h-[calc(100%-180px)]">
          <div className="p-4 space-y-6">
            <div>
              <h3 className="font-tech text-xs text-cyan-400 uppercase tracking-wider mb-2">
                Description
              </h3>
              <p 
                className="text-gray-300 text-sm leading-relaxed"
                data-testid="text-node-description"
              >
                {node.description || 'No description available'}
              </p>
            </div>

            <div>
              <h3 className="font-tech text-xs text-cyan-400 uppercase tracking-wider mb-2">
                Node ID
              </h3>
              <code className="text-xs text-gray-400 font-mono bg-black/30 px-2 py-1 rounded">
                {node.node_id}
              </code>
            </div>

            <div>
              <h3 className="font-tech text-xs text-cyan-400 uppercase tracking-wider mb-3">
                Connections ({connections.length})
              </h3>
              <div className="space-y-2">
                {connections.length === 0 ? (
                  <p className="text-gray-500 text-sm">No connections</p>
                ) : (
                  connections.map((conn, i) => {
                    const ConnIcon = NODE_TYPE_ICONS[conn.connectedNode!.node_type.toLowerCase()] || User;
                    return (
                      <button
                        key={i}
                        onClick={() => conn.connectedNode && onNodeNavigate(conn.connectedNode)}
                        className="w-full flex items-center gap-3 p-2 rounded-lg border border-transparent hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all text-left group"
                        data-testid={`button-connection-${i}`}
                      >
                        <div className="p-1.5 rounded bg-purple-500/20 border border-purple-500/30">
                          <ConnIcon className="w-3 h-3 text-purple-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate group-hover:text-cyan-400 transition-colors">
                            {conn.connectedNode!.display_name}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Link2 className="w-3 h-3" />
                            {conn.edge.relationship_type}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-cyan-500/20 bg-[rgba(20,24,59,0.95)] flex gap-2">
          <Button
            variant="outline"
            className="flex-1 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
            onClick={onEdit}
            data-testid="button-edit-node"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10"
            onClick={onDelete}
            data-testid="button-delete-node"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
