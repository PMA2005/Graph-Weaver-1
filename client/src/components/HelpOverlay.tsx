import { X, MousePointer2, Move, ZoomIn, RotateCcw, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HelpOverlayProps {
  onClose: () => void;
  onStartTour?: () => void;
}

const HELP_ITEMS = [
  {
    icon: MousePointer2,
    title: 'Click a Node',
    description: 'Click on any glowing shape to see its details in the sidebar',
  },
  {
    icon: Move,
    title: 'Drag to Rotate',
    description: 'Click and drag anywhere to rotate the entire graph view',
  },
  {
    icon: ZoomIn,
    title: 'Scroll to Zoom',
    description: 'Use your mouse wheel or pinch gesture to zoom in and out',
  },
  {
    icon: RotateCcw,
    title: 'Reset View',
    description: 'Click the reset button in the top bar to return to the starting view',
  },
];

export default function HelpOverlay({ onClose, onStartTour }: HelpOverlayProps) {
  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-8"
      style={{ background: 'rgb(0, 0, 0)' }}
      onClick={onClose}
      data-testid="overlay-help"
    >
      <div 
        className="relative max-w-lg w-full rounded-xl p-8 border border-cyan-500/30"
        style={{
          background: 'rgb(20, 24, 59)',
          boxShadow: '0 0 50px rgba(0, 255, 255, 0.2)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <Button
          size="icon"
          variant="ghost"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          data-testid="button-close-help"
        >
          <X className="w-4 h-4" />
        </Button>

        <div className="text-center mb-8">
          <h2 
            className="font-display text-2xl font-bold text-white mb-2"
            style={{ textShadow: '0 0 20px rgba(0, 255, 255, 0.5)' }}
          >
            How to Navigate
          </h2>
          <p className="text-gray-400 text-sm">
            Explore the network graph with these simple controls
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {HELP_ITEMS.map((item, i) => (
            <div 
              key={i}
              className="p-4 rounded-lg border border-cyan-500/20"
              style={{ background: 'rgb(25, 30, 70)' }}
            >
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                style={{
                  background: 'rgba(0, 255, 255, 0.1)',
                  border: '1px solid rgba(0, 255, 255, 0.3)',
                }}
              >
                <item.icon className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="font-display text-sm font-semibold text-white mb-1">
                {item.title}
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-center gap-3">
          {onStartTour && (
            <Button
              onClick={onStartTour}
              variant="outline"
              className="px-6 border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
              data-testid="button-start-tour"
            >
              <Play className="w-4 h-4 mr-2" />
              Take Guided Tour
            </Button>
          )}
          <Button
            onClick={onClose}
            className="px-8 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30"
            data-testid="button-got-it"
          >
            Got it, let me explore!
          </Button>
        </div>
      </div>
    </div>
  );
}
