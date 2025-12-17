import { useState } from 'react';
import { X, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface GraphNode {
  node_id: string;
  display_name: string;
  description: string;
  node_type: string;
}

interface EditNodeModalProps {
  node: GraphNode;
  onClose: () => void;
  onSubmit: (nodeId: string, updates: { display_name?: string; description?: string }) => void;
  isLoading?: boolean;
}

export default function EditNodeModal({ node, onClose, onSubmit, isLoading }: EditNodeModalProps) {
  const [displayName, setDisplayName] = useState(node.display_name);
  const [description, setDescription] = useState(node.description);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    
    onSubmit(node.node_id, {
      display_name: displayName.trim(),
      description: description.trim(),
    });
  };

  const typeColor = node.node_type.toLowerCase() === 'person' ? '#00ffff' : '#b026ff';

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-8"
      style={{ background: 'rgba(0, 0, 0, 0.85)' }}
      onClick={onClose}
      data-testid="modal-edit-node"
    >
      <div 
        className="relative max-w-md w-full rounded-xl p-6 border border-cyan-500/30"
        style={{
          background: 'rgba(20, 24, 59, 0.95)',
          boxShadow: '0 0 50px rgba(0, 255, 255, 0.2)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <Button
          size="icon"
          variant="ghost"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          data-testid="button-close-edit-modal"
        >
          <X className="w-4 h-4" />
        </Button>

        <div className="flex items-center gap-3 mb-6">
          <div 
            className="p-2 rounded-lg"
            style={{
              background: `${typeColor}20`,
              border: `1px solid ${typeColor}50`,
            }}
          >
            <Edit3 className="w-5 h-5" style={{ color: typeColor }} />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-white">
              Edit {node.node_type}
            </h2>
            <p className="text-gray-400 text-sm">
              Update {node.display_name}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-cyan-400 font-tech text-xs uppercase">Name</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="bg-black/30 border-cyan-500/30 text-white"
              data-testid="input-edit-name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-cyan-400 font-tech text-xs uppercase">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-black/30 border-cyan-500/30 text-white min-h-[100px]"
              data-testid="input-edit-description"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-gray-600 text-gray-400 hover:bg-gray-800"
              data-testid="button-cancel-edit"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!displayName.trim() || isLoading}
              className="flex-1 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30"
              data-testid="button-confirm-edit"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
