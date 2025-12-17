import { useState } from 'react';
import { X, User, Folder, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AddNodeModalProps {
  onClose: () => void;
  onSubmit: (node: { node_id: string; display_name: string; description: string; node_type: string }) => void;
  isLoading?: boolean;
}

export default function AddNodeModal({ onClose, onSubmit, isLoading }: AddNodeModalProps) {
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [nodeType, setNodeType] = useState('person');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    
    onSubmit({
      node_id: displayName.trim(),
      display_name: displayName.trim(),
      description: description.trim(),
      node_type: nodeType,
    });
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-8"
      style={{ background: 'rgba(0, 0, 0, 0.85)' }}
      onClick={onClose}
      data-testid="modal-add-node"
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
          data-testid="button-close-add-modal"
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
            <Plus className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-white">
              Add New Node
            </h2>
            <p className="text-gray-400 text-sm">
              Create a new person or project
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-cyan-400 font-tech text-xs uppercase">Type</Label>
            <Select value={nodeType} onValueChange={setNodeType}>
              <SelectTrigger 
                className="bg-black/30 border-cyan-500/30 text-white"
                data-testid="select-node-type"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#14183b] border-cyan-500/30">
                <SelectItem value="person" className="text-white">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-cyan-400" />
                    Person
                  </div>
                </SelectItem>
                <SelectItem value="project" className="text-white">
                  <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4 text-purple-400" />
                    Project
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-cyan-400 font-tech text-xs uppercase">Name</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={nodeType === 'person' ? 'John Doe' : 'Project Name'}
              className="bg-black/30 border-cyan-500/30 text-white placeholder:text-gray-500"
              data-testid="input-node-name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-cyan-400 font-tech text-xs uppercase">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={nodeType === 'person' ? 'Role and expertise...' : 'Project description...'}
              className="bg-black/30 border-cyan-500/30 text-white placeholder:text-gray-500 min-h-[80px]"
              data-testid="input-node-description"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-gray-600 text-gray-400 hover:bg-gray-800"
              data-testid="button-cancel-add"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!displayName.trim() || isLoading}
              className="flex-1 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30"
              data-testid="button-confirm-add"
            >
              {isLoading ? 'Adding...' : 'Add Node'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
