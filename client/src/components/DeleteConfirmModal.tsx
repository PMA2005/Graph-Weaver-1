import { X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DeleteConfirmModalProps {
  title: string;
  message: string;
  itemName: string;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export default function DeleteConfirmModal({ 
  title,
  message,
  itemName,
  onClose, 
  onConfirm, 
  isLoading 
}: DeleteConfirmModalProps) {
  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
      style={{ background: 'rgba(0, 0, 0, 0.8)' }}
      onClick={onClose}
      data-testid="modal-delete-confirm"
    >
      <div 
        className="relative max-w-sm w-full rounded-xl p-4 sm:p-6 border border-red-500/30"
        style={{
          background: 'rgb(10, 14, 39)',
          boxShadow: '0 0 50px rgba(255, 0, 0, 0.1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <Button
          size="icon"
          variant="ghost"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          data-testid="button-close-delete-modal"
        >
          <X className="w-4 h-4" />
        </Button>

        <div className="flex items-center gap-3 mb-4">
          <div 
            className="p-2 rounded-lg"
            style={{
              background: 'rgba(255, 0, 0, 0.1)',
              border: '1px solid rgba(255, 0, 0, 0.3)',
            }}
          >
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <h2 className="font-display text-xl font-bold text-white">
            {title}
          </h2>
        </div>

        <p className="text-gray-300 mb-2">
          {message}
        </p>
        <p className="text-white font-semibold mb-6 p-2 bg-red-500/10 rounded border border-red-500/20">
          "{itemName}"
        </p>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 border-gray-600 text-gray-400 hover:bg-gray-800"
            data-testid="button-cancel-delete"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30"
            data-testid="button-confirm-delete"
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </div>
  );
}
