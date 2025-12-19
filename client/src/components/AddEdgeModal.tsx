import { useState } from 'react';
import { X, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface GraphNode {
  node_id: string;
  display_name: string;
  description: string;
  node_type: string;
}

interface AddEdgeModalProps {
  nodes: GraphNode[];
  onClose: () => void;
  onSubmit: (edge: { source_node: string; target_node: string; relationship_type: string; weight?: number }) => void;
  isLoading?: boolean;
  preselectedSource?: string;
}

const RELATIONSHIP_TYPES = [
  { value: 'assigned_to', label: 'Assigned To', description: 'Person is assigned to project' },
  { value: 'collaborates_with', label: 'Collaborates With', description: 'Person collaborates with person' },
  { value: 'consults_on', label: 'Consults On', description: 'Person consults on project' },
  { value: 'manages', label: 'Manages', description: 'Person manages project or team' },
  { value: 'reports_to', label: 'Reports To', description: 'Person reports to another person' },
  { value: 'custom', label: 'Custom...', description: 'Define your own relationship type' },
];

export default function AddEdgeModal({ 
  nodes, 
  onClose, 
  onSubmit, 
  isLoading,
  preselectedSource 
}: AddEdgeModalProps) {
  const [sourceNode, setSourceNode] = useState(preselectedSource || '');
  const [targetNode, setTargetNode] = useState('');
  const [relationshipType, setRelationshipType] = useState('assigned_to');
  const [customRelationship, setCustomRelationship] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceNode || !targetNode || sourceNode === targetNode) return;
    
    const finalRelationshipType = relationshipType === 'custom' 
      ? customRelationship.trim().toLowerCase().replace(/\s+/g, '_') 
      : relationshipType;
    
    if (relationshipType === 'custom' && !customRelationship.trim()) return;
    
    onSubmit({
      source_node: sourceNode,
      target_node: targetNode,
      relationship_type: finalRelationshipType,
      weight: 1,
    });
  };
  
  const isCustom = relationshipType === 'custom';

  const people = nodes.filter(n => n.node_type.toLowerCase() === 'person');
  const projects = nodes.filter(n => n.node_type.toLowerCase() === 'project');

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-8"
      style={{ background: 'rgba(0, 0, 0, 0.8)' }}
      onClick={onClose}
      data-testid="modal-add-edge"
    >
      <div 
        className="relative max-w-md w-full rounded-xl p-6 border border-cyan-500/30"
        style={{
          background: 'rgb(10, 14, 39)',
          boxShadow: '0 0 50px rgba(0, 255, 255, 0.15)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <Button
          size="icon"
          variant="ghost"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          data-testid="button-close-edge-modal"
        >
          <X className="w-4 h-4" />
        </Button>

        <div className="flex items-center gap-3 mb-6">
          <div 
            className="p-2 rounded-lg"
            style={{
              background: 'rgba(0, 255, 255, 0.1)',
              border: '1px solid rgba(0, 255, 255, 0.3)',
            }}
          >
            <Link2 className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-white">
              Create Relationship
            </h2>
            <p className="text-gray-400 text-sm">
              Connect two nodes together
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-cyan-400 font-tech text-xs uppercase">From</Label>
            <Select value={sourceNode} onValueChange={setSourceNode}>
              <SelectTrigger 
                className="bg-black/30 border-cyan-500/30 text-white"
                data-testid="select-source-node"
              >
                <SelectValue placeholder="Select source node" />
              </SelectTrigger>
              <SelectContent className="bg-[#14183b] border-cyan-500/30 max-h-[200px]">
                <div className="px-2 py-1 text-xs text-cyan-400 font-tech">People</div>
                {people.map(node => (
                  <SelectItem key={node.node_id} value={node.node_id} className="text-white">
                    {node.display_name}
                  </SelectItem>
                ))}
                <div className="px-2 py-1 text-xs text-purple-400 font-tech mt-2">Projects</div>
                {projects.map(node => (
                  <SelectItem key={node.node_id} value={node.node_id} className="text-white">
                    {node.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-cyan-400 font-tech text-xs uppercase">Relationship Type</Label>
            <Select value={relationshipType} onValueChange={setRelationshipType}>
              <SelectTrigger 
                className="bg-black/30 border-cyan-500/30 text-white"
                data-testid="select-relationship-type"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#14183b] border-cyan-500/30">
                {RELATIONSHIP_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value} className="text-white">
                    <div>
                      <div>{type.label}</div>
                      <div className="text-xs text-gray-400">{type.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {isCustom && (
            <div className="space-y-2">
              <Label className="text-cyan-400 font-tech text-xs uppercase">Custom Relationship Name</Label>
              <Input
                value={customRelationship}
                onChange={(e) => setCustomRelationship(e.target.value)}
                placeholder="e.g., mentors, assists, supervises"
                className="bg-black/30 border-cyan-500/30 text-white"
                data-testid="input-custom-relationship"
              />
              <p className="text-xs text-gray-500">
                Will be saved as: {customRelationship.trim().toLowerCase().replace(/\s+/g, '_') || 'your_relationship'}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-cyan-400 font-tech text-xs uppercase">To</Label>
            <Select value={targetNode} onValueChange={setTargetNode}>
              <SelectTrigger 
                className="bg-black/30 border-cyan-500/30 text-white"
                data-testid="select-target-node"
              >
                <SelectValue placeholder="Select target node" />
              </SelectTrigger>
              <SelectContent className="bg-[#14183b] border-cyan-500/30 max-h-[200px]">
                <div className="px-2 py-1 text-xs text-cyan-400 font-tech">People</div>
                {people.filter(n => n.node_id !== sourceNode).map(node => (
                  <SelectItem key={node.node_id} value={node.node_id} className="text-white">
                    {node.display_name}
                  </SelectItem>
                ))}
                <div className="px-2 py-1 text-xs text-purple-400 font-tech mt-2">Projects</div>
                {projects.filter(n => n.node_id !== sourceNode).map(node => (
                  <SelectItem key={node.node_id} value={node.node_id} className="text-white">
                    {node.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-gray-600 text-gray-400 hover:bg-gray-800"
              data-testid="button-cancel-edge"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!sourceNode || !targetNode || sourceNode === targetNode || isLoading || (isCustom && !customRelationship.trim())}
              className="flex-1 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30"
              data-testid="button-confirm-edge"
            >
              {isLoading ? 'Creating...' : 'Create Relationship'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
