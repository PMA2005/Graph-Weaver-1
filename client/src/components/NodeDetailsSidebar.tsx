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

const RELATIONSHIP_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  assigned_to: { bg: 'bg-green-500/15', text: 'text-green-400', border: 'border-green-500/30' },
  collaborates_with: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
  consults_on: { bg: 'bg-yellow-500/15', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  manages: { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30' },
  reports_to: { bg: 'bg-pink-500/15', text: 'text-pink-400', border: 'border-pink-500/30' },
  default: { bg: 'bg-gray-500/15', text: 'text-gray-400', border: 'border-gray-500/30' },
};

function getRelationshipStyle(type: string) {
  return RELATIONSHIP_COLORS[type] || RELATIONSHIP_COLORS.default;
}

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
    <>
      {/* Mobile backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 z-40 md:hidden"
        onClick={onClose}
      />
      <div 
        className="fixed inset-x-2 top-16 bottom-20 md:inset-auto md:right-4 md:top-20 md:bottom-24 md:w-96 z-50 animate-in slide-in-from-right duration-300"
        data-testid="sidebar-node-details"
      >
        <div 
          className="h-full rounded-lg border border-cyan-500/30 overflow-hidden flex flex-col"
          style={{
            background: 'rgba(10, 14, 39, 0.95)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: '0 0 30px rgba(0, 255, 255, 0.1)',
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
                  {assignedProjects.map((conn, i) => {
                    const isOutgoing = conn.direction === 'outgoing';
                    const relationshipLabel = conn.edge.relationship_type.replace(/_/g, ' ');
                    const sourceName = isOutgoing ? node.display_name : conn.connectedNode!.display_name;
                    const targetName = isOutgoing ? conn.connectedNode!.display_name : node.display_name;
                    
                    return (
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
                            <p className="text-xs text-purple-400/70 flex items-center gap-1">
                              <span className="text-gray-500">{sourceName}</span>
                              <ArrowRight className="w-3 h-3" />
                              <span>{relationshipLabel}</span>
                              <ArrowRight className="w-3 h-3" />
                              <span className="text-gray-500">{targetName}</span>
                            </p>
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
                    );
                  })}
                </div>
              </div>
            )}

            {isProject && teamMembers.length > 0 && (
              <div>
                <h3 className="font-tech text-xs text-cyan-400 uppercase tracking-wider mb-3">
                  Team Members ({teamMembers.length} people)
                </h3>
                <div className="space-y-2">
                  {teamMembers.map((conn, i) => {
                    const isOutgoing = conn.direction === 'outgoing';
                    const relationshipLabel = conn.edge.relationship_type.replace(/_/g, ' ');
                    const sourceName = isOutgoing ? node.display_name : conn.connectedNode!.display_name;
                    const targetName = isOutgoing ? conn.connectedNode!.display_name : node.display_name;
                    
                    return (
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
                            <p className="text-xs text-cyan-400/70 flex items-center gap-1">
                              <span className="text-gray-500">{sourceName}</span>
                              <ArrowRight className="w-3 h-3" />
                              <span>{relationshipLabel}</span>
                              <ArrowRight className="w-3 h-3" />
                              <span className="text-gray-500">{targetName}</span>
                            </p>
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
                    );
                  })}
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
                      className="w-full flex items-center gap-2 p-2 rounded-lg border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 transition-colors text-left"
                      data-testid={`button-collaborator-${i}`}
                    >
                      <User className="w-4 h-4 text-blue-400" />
                      <div>
                        <span className="text-sm text-white">{conn.connectedNode!.display_name}</span>
                        <p className="text-xs text-blue-400/70 flex items-center gap-1">
                          <span className="text-gray-500">{node.display_name}</span>
                          <Link2 className="w-3 h-3" />
                          <span>collaborates with</span>
                          <Link2 className="w-3 h-3" />
                          <span className="text-gray-500">{conn.connectedNode!.display_name}</span>
                        </p>
                      </div>
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
                    const relStyle = getRelationshipStyle(conn.edge.relationship_type);
                    const relationshipLabel = conn.edge.relationship_type.replace(/_/g, ' ');
                    
                    const sourceName = isOutgoing ? node.display_name : conn.connectedNode!.display_name;
                    const targetName = isOutgoing ? conn.connectedNode!.display_name : node.display_name;
                    
                    return (
                      <div
                        key={i}
                        className={`flex items-center justify-between p-2 rounded-lg border ${relStyle.bg} ${relStyle.border}`}
                      >
                        <button
                          onClick={() => conn.connectedNode && onNodeNavigate(conn.connectedNode)}
                          className="flex items-center gap-2 text-left group flex-1 min-w-0"
                          data-testid={`button-connection-${i}`}
                        >
                          <ConnIcon className={`w-4 h-4 shrink-0 ${relStyle.text}`} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-white truncate group-hover:text-cyan-300">
                              {conn.connectedNode!.display_name}
                            </p>
                            <p className={`text-xs ${relStyle.text} flex items-center gap-1 flex-wrap`}>
                              <span className="text-gray-400">{sourceName}</span>
                              <ArrowRight className="w-3 h-3" />
                              <span>{relationshipLabel}</span>
                              <ArrowRight className="w-3 h-3" />
                              <span className="text-gray-400">{targetName}</span>
                            </p>
                          </div>
                        </button>
                        {onRemoveRelationship && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => onRemoveRelationship(conn.edge)}
                            className="h-6 w-6 text-gray-500 hover:text-red-400 shrink-0"
                            data-testid={`button-remove-connection-${i}`}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
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
    </>
  );
}
