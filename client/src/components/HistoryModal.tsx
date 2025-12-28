import { useState } from 'react';
import { History, RotateCcw, Trash2, Plus, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';

interface SnapshotInfo {
  id: number;
  name: string;
  description: string;
  node_count: number;
  edge_count: number;
  created_at: string;
}

interface HistoryModalProps {
  onClose: () => void;
  onRestored: () => void;
}

export default function HistoryModal({ onClose, onRestored }: HistoryModalProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSnapshotName, setNewSnapshotName] = useState('');
  const [newSnapshotDescription, setNewSnapshotDescription] = useState('');

  const { data: snapshots = [], isLoading } = useQuery<SnapshotInfo[]>({
    queryKey: ['/api/snapshots'],
  });

  const createSnapshotMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      return apiRequest('POST', '/api/snapshots', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/snapshots'] });
      setShowCreateForm(false);
      setNewSnapshotName('');
      setNewSnapshotDescription('');
    },
  });

  const restoreSnapshotMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('POST', `/api/snapshots/${id}/restore`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/graph'] });
      queryClient.invalidateQueries({ queryKey: ['/api/snapshots'] });
      onRestored();
    },
  });

  const deleteSnapshotMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/snapshots/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/snapshots'] });
    },
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCreate = () => {
    if (!newSnapshotName.trim()) return;
    createSnapshotMutation.mutate({
      name: newSnapshotName.trim(),
      description: newSnapshotDescription.trim() || undefined,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
      onClick={onClose}
      data-testid="modal-history"
    >
      <div
        className="relative w-full max-w-lg max-h-[80vh] overflow-hidden rounded-lg"
        style={{
          background: 'linear-gradient(180deg, rgba(10, 14, 39, 0.98) 0%, rgba(20, 24, 50, 0.98) 100%)',
          border: '2px solid rgba(0, 255, 255, 0.4)',
          boxShadow: '0 0 40px rgba(0, 255, 255, 0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-cyan-500/30">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{
                background: 'rgba(0, 255, 255, 0.1)',
                boxShadow: '0 0 15px rgba(0, 255, 255, 0.3)',
              }}
            >
              <History className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Data History</h2>
              <p className="text-sm text-cyan-400/70">View and restore previous data versions</p>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 160px)' }}>
          {!showCreateForm ? (
            <Button
              onClick={() => setShowCreateForm(true)}
              className="w-full mb-4 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30"
              data-testid="button-create-snapshot"
            >
              <Plus className="w-4 h-4 mr-2" />
              Save Current State
            </Button>
          ) : (
            <div className="mb-4 p-4 rounded-lg border border-cyan-500/30 bg-slate-900/50">
              <Input
                placeholder="Snapshot name"
                value={newSnapshotName}
                onChange={(e) => setNewSnapshotName(e.target.value)}
                className="mb-2 bg-slate-800/50 border-cyan-500/30 text-white placeholder:text-cyan-400/40"
                data-testid="input-snapshot-name"
              />
              <Input
                placeholder="Description (optional)"
                value={newSnapshotDescription}
                onChange={(e) => setNewSnapshotDescription(e.target.value)}
                className="mb-3 bg-slate-800/50 border-cyan-500/30 text-white placeholder:text-cyan-400/40"
                data-testid="input-snapshot-description"
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleCreate}
                  disabled={!newSnapshotName.trim() || createSnapshotMutation.isPending}
                  className="flex-1 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30"
                  data-testid="button-save-snapshot"
                >
                  {createSnapshotMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewSnapshotName('');
                    setNewSnapshotDescription('');
                  }}
                  variant="ghost"
                  className="text-gray-400 hover:text-white"
                  data-testid="button-cancel-snapshot"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-8 text-cyan-400/60">Loading snapshots...</div>
          ) : snapshots.length === 0 ? (
            <div className="text-center py-8">
              <Database className="w-12 h-12 mx-auto mb-3 text-cyan-400/30" />
              <p className="text-cyan-400/60">No saved snapshots yet</p>
              <p className="text-sm text-cyan-400/40 mt-1">
                Snapshots are automatically created before importing new data
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {snapshots.map((snapshot) => (
                <div
                  key={snapshot.id}
                  className="p-4 rounded-lg border border-cyan-500/20 bg-slate-900/30 hover:bg-slate-900/50 transition-colors"
                  data-testid={`snapshot-item-${snapshot.id}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium truncate">{snapshot.name}</h3>
                      {snapshot.description && (
                        <p className="text-sm text-cyan-400/60 mt-1 line-clamp-2">
                          {snapshot.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-cyan-400/50">
                        <span>{snapshot.node_count} nodes</span>
                        <span>{snapshot.edge_count} edges</span>
                        <span>{formatDate(snapshot.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => restoreSnapshotMutation.mutate(snapshot.id)}
                        disabled={restoreSnapshotMutation.isPending}
                        className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20"
                        title="Restore this snapshot"
                        data-testid={`button-restore-snapshot-${snapshot.id}`}
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteSnapshotMutation.mutate(snapshot.id)}
                        disabled={deleteSnapshotMutation.isPending}
                        className="text-red-400/70 hover:text-red-400 hover:bg-red-500/20"
                        title="Delete this snapshot"
                        data-testid={`button-delete-snapshot-${snapshot.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-cyan-500/30">
          <Button
            onClick={onClose}
            className="w-full bg-slate-800 border border-cyan-500/30 text-white hover:bg-slate-700"
            data-testid="button-close-history"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
