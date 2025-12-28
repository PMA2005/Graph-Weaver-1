import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { GraphEdge, GraphNode } from '@shared/schema';

interface EdgeEditDialogProps {
  edge: GraphEdge | null;
  nodes: GraphNode[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (edge: GraphEdge, newRelationshipType: string) => void;
  isPending?: boolean;
}

const RELATIONSHIP_TYPES = [
  { value: 'assigned_to', label: 'Assigned To' },
  { value: 'collaborates_with', label: 'Collaborates With' },
  { value: 'consults_on', label: 'Consults On' },
  { value: 'manages', label: 'Manages' },
  { value: 'reports_to', label: 'Reports To' },
  { value: 'custom', label: 'Custom' },
];

const RELATIONSHIP_COLORS: Record<string, string> = {
  assigned_to: '#22c55e',
  collaborates_with: '#3b82f6',
  consults_on: '#eab308',
  manages: '#f97316',
  reports_to: '#ec4899',
  custom: '#00ffff',
};

export default function EdgeEditDialog({
  edge,
  nodes,
  isOpen,
  onClose,
  onSave,
  isPending = false,
}: EdgeEditDialogProps) {
  const [selectedType, setSelectedType] = useState<string>('');

  useEffect(() => {
    if (edge) {
      setSelectedType(edge.relationship_type);
    }
  }, [edge]);

  if (!edge) return null;

  const sourceNode = nodes.find(n => n.node_id === edge.source_node);
  const targetNode = nodes.find(n => n.node_id === edge.target_node);

  const handleSave = () => {
    if (selectedType && selectedType !== edge.relationship_type) {
      onSave(edge, selectedType);
    } else {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-background border border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Edit Relationship</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{sourceNode?.display_name || edge.source_node}</span>
            <span className="text-muted-foreground">to</span>
            <span className="font-medium text-foreground">{targetNode?.display_name || edge.target_node}</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="relationship-type">Relationship Type</Label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger id="relationship-type" data-testid="select-relationship-type">
                <SelectValue placeholder="Select relationship type" />
              </SelectTrigger>
              <SelectContent>
                {RELATIONSHIP_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: RELATIONSHIP_COLORS[type.value] || '#00ffff' }}
                      />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Current type:</span>
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: RELATIONSHIP_COLORS[edge.relationship_type] || '#00ffff' }}
            />
            <span className="text-muted-foreground">{edge.relationship_type}</span>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} data-testid="button-cancel-edge-edit">
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isPending || !selectedType}
            data-testid="button-save-edge"
          >
            {isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
