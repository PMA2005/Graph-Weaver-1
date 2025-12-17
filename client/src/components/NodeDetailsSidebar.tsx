import { X, User, Folder, Link2, Trash2, Edit3, Plus, ArrowRight } from 'lucide-react';
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
  onAddRelationship?: () => void;
  onRemoveRelationship?: (edge: GraphEdge) => void;
}

const NODE_TYPE_COLORS: Record<string, string> = {
  person: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50',
  project: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
  default: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
};

const NODE_TYPE_ICONS: Record<string, typeof User> = {
  person: User,
  project: Folder,
};

export default function NodeDetailsSidebar({
  node,
  edges,
  allNodes,
  onClose,
  onNodeNavigate,
  onEdit,
  onDelete,
  onAddRelationship,
  onRemoveRelationship,
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

  const isPerson = node.node_type.toLowerCase() === 'person';
  const isProject = node.node_type.toLowerCase() === 'project';

  const assignedProjects = isPerson 
    ? connections.filter(c => 
        c.connectedNode?.node_type.toLowerCase() === 'project' &&
        ['assigned_to', 'consults_on', 'manages'].includes(c.edge.relationship_type)
      )
    : [];

  const teamMembers = isProject
    ? connections.filter(c => 
        c.connectedNode?.node_type.toLowerCase() === 'person'
      )
    : [];

  const collaborators = isPerson
    ? connections.filter(c => 
        c.connectedNode?.node_type.toLowerCase() === 'person' &&
        c.edge.relationship_type === 'collaborates_with'
      )
    : [];

  return (
    <div 
      className="absolute right-4 top-20 bottom-24 w-96 z-50 animate-in slide-in-from-right duration-300"
      data-testid="sidebar-node-details"
    >
      <div 
        className="h-full rounded-lg border border-cyan-500/30 overflow-hidden flex flex-col"
        style={{
          background: 'rgba(20, 24, 59, 0.85)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 0 30px rgba(0, 255, 255, 0.15)',
        }}
      >
        <div className="p-4 border-b border-cyan-500/20 flex items-start justify-between gap-3 shrink-0">
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

        <ScrollArea className="flex-1">
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

            {isPerson && assignedProjects.length > 0 && (
              <div>
                <h3 className="font-tech text-xs text-purple-400 uppercase tracking-wider mb-3">
                  Working On ({assignedProjects.length} projects)
                </h3>
                <div className="space-y-2">
                  {assignedProjects.map((conn, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded-lg border border-purple-500/20 bg-purple-500/5"
                    >
                      <button
                        onClick={() => conn.connectedNode && onNodeNavigate(conn.connectedNode)}
                        className="flex items-center gap-2 text-left hover:text-purple-400 transition-colors"
                        data-testid={`button-project-${i}`}
                      >
                        <Folder className="w-4 h-4 text-purple-400" />
                        <div>
                          <p className="text-sm text-white">{conn.connectedNode!.display_name}</p>
                          <p className="text-xs text-gray-500">{conn.edge.relationship_type.replace(/_/g, ' ')}</p>
                        </div>
                      </button>
                      {onRemoveRelationship && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => onRemoveRelationship(conn.edge)}
                          className="h-6 w-6 text-gray-500 hover:text-red-400"
                          data-testid={`button-remove-relationship-${i}`}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isProject && teamMembers.length > 0 && (
              <div>
                <h3 className="font-tech text-xs text-cyan-400 uppercase tracking-wider mb-3">
                  Team Members ({teamMembers.length} people)
                </h3>
                <div className="space-y-2">
                  {teamMembers.map((conn, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded-lg border border-cyan-500/20 bg-cyan-500/5"
                    >
                      <button
                        onClick={() => conn.connectedNode && onNodeNavigate(conn.connectedNode)}
                        className="flex items-center gap-2 text-left hover:text-cyan-400 transition-colors"
                        data-testid={`button-member-${i}`}
                      >
                        <User className="w-4 h-4 text-cyan-400" />
                        <div>
                          <p className="text-sm text-white">{conn.connectedNode!.display_name}</p>
                          <p className="text-xs text-gray-500">{conn.edge.relationship_type.replace(/_/g, ' ')}</p>
                        </div>
                      </button>
                      {onRemoveRelationship && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => onRemoveRelationship(conn.edge)}
                          className="h-6 w-6 text-gray-500 hover:text-red-400"
                          data-testid={`button-remove-member-${i}`}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isPerson && collaborators.length > 0 && (
              <div>
                <h3 className="font-tech text-xs text-cyan-400 uppercase tracking-wider mb-3">
                  Collaborates With
                </h3>
                <div className="space-y-2">
                  {collaborators.map((conn, i) => (
                    <button
                      key={i}
                      onClick={() => conn.connectedNode && onNodeNavigate(conn.connectedNode)}
                      className="w-full flex items-center gap-2 p-2 rounded-lg border border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 transition-colors text-left"
                      data-testid={`button-collaborator-${i}`}
                    >
                      <User className="w-4 h-4 text-cyan-400" />
                      <span className="text-sm text-white">{conn.connectedNode!.display_name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-tech text-xs text-gray-400 uppercase tracking-wider">
                  All Connections ({connections.length})
                </h3>
                {onAddRelationship && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onAddRelationship}
                    className="h-6 text-xs text-cyan-400 hover:bg-cyan-500/10"
                    data-testid="button-add-relationship"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add
                  </Button>
                )}
              </div>
              <div className="space-y-1">
                {connections.length === 0 ? (
                  <p className="text-gray-500 text-sm">No connections yet</p>
                ) : (
                  connections.map((conn, i) => {
                    const ConnIcon = NODE_TYPE_ICONS[conn.connectedNode!.node_type.toLowerCase()] || User;
                    const isOutgoing = conn.direction === 'outgoing';
                    return (
                      <button
                        key={i}
                        onClick={() => conn.connectedNode && onNodeNavigate(conn.connectedNode)}
                        className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-all text-left group"
                        data-testid={`button-connection-${i}`}
                      >
                        <ConnIcon className="w-3 h-3 text-gray-500" />
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          {isOutgoing ? '' : <ArrowRight className="w-3 h-3 rotate-180" />}
                          {conn.edge.relationship_type.replace(/_/g, ' ')}
                          {isOutgoing ? <ArrowRight className="w-3 h-3" /> : ''}
                        </span>
                        <span className="text-sm text-gray-300 group-hover:text-white truncate">
                          {conn.connectedNode!.display_name}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-cyan-500/20 bg-[rgba(20,24,59,0.95)] flex gap-2 shrink-0">
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
