import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft, ChevronRight, Search, MousePointer, Eye, Layers, ZoomIn, Maximize2, PartyPopper, History } from 'lucide-react';

interface TourStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  icon: ReactNode;
  isFinal?: boolean;
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Network Graph',
    description: 'This interactive visualization shows connections between people and projects. Let\'s take a quick tour of the key features.',
    position: 'center',
    icon: <Layers className="w-6 h-6" />,
  },
  {
    id: 'search',
    title: 'Search Bar',
    description: 'Quickly find any person or project by typing their name. Click a result to focus on that node in the graph.',
    targetSelector: '[data-testid="input-search"]',
    position: 'bottom',
    icon: <Search className="w-6 h-6" />,
  },
  {
    id: 'nodes',
    title: 'Graph Nodes',
    description: 'Click any node to select it and see its details. Cyan circles are people, purple rectangles are projects. Hold Ctrl/Cmd and click to select multiple nodes.',
    targetSelector: 'svg',
    position: 'center',
    icon: <MousePointer className="w-6 h-6" />,
  },
  {
    id: 'layout',
    title: 'Layout Controls',
    description: 'Switch between Force (dynamic) and Spiral (organized) layouts. Filter by node type using the People/Projects buttons at the bottom.',
    targetSelector: '[data-testid="graph-legend"]',
    position: 'center',
    icon: <Eye className="w-6 h-6" />,
  },
  {
    id: 'zoom',
    title: 'Pan & Zoom',
    description: 'Scroll to zoom in/out. Click and drag the background to pan. Use the +/- buttons for precise control.',
    targetSelector: '[data-testid="zoom-controls"]',
    position: 'center',
    icon: <ZoomIn className="w-6 h-6" />,
  },
  {
    id: 'focus',
    title: 'Focus View',
    description: 'When you select nodes, click "View Focused" to see only those nodes and their connections. Great for exploring relationships!',
    position: 'center',
    icon: <Maximize2 className="w-6 h-6" />,
  },
  {
    id: 'history',
    title: 'Data History',
    description: 'Click the clock icon to view and restore previous data versions. Your data is automatically saved before each import, so you can always go back!',
    targetSelector: '[data-testid="button-history"]',
    position: 'bottom',
    icon: <History className="w-6 h-6" />,
  },
  {
    id: 'complete',
    title: 'Tour Complete!',
    description: 'You\'re all set to explore the network graph! Click on nodes, try different layouts, and discover connections between people and projects.',
    position: 'center',
    icon: <PartyPopper className="w-6 h-6" />,
    isFinal: true,
  },
];

interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function GuidedTour({ isOpen, onClose, onComplete }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isReady, setIsReady] = useState(false);

  const step = tourSteps[currentStep];
  const isFirstStep = currentStep === 0;

  // Reset step when tour opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setTargetRect(null);
      const timer = setTimeout(() => setIsReady(true), 100);
      return () => clearTimeout(timer);
    } else {
      setIsReady(false);
    }
  }, [isOpen]);

  // Try to find and highlight target element (non-blocking)
  useEffect(() => {
    if (!isOpen || !isReady) return;
    
    setTargetRect(null);
    
    const findElement = () => {
      if (step?.targetSelector) {
        const element = document.querySelector(step.targetSelector);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            setTargetRect(rect);
            return true;
          }
        }
      }
      return false;
    };

    // Try immediately and with retries
    const timer1 = setTimeout(findElement, 50);
    const timer2 = setTimeout(findElement, 150);
    const timer3 = setTimeout(findElement, 300);
    
    const handleResize = () => findElement();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize);
    };
  }, [isOpen, isReady, currentStep, step?.targetSelector]);

  // Navigation handlers - bounds checking inside state updater for race safety
  const goNext = useCallback(() => {
    setCurrentStep(prev => {
      const nextStep = prev + 1;
      if (prev === tourSteps.length - 1) {
        setTimeout(() => onComplete(), 0);
        return prev;
      }
      if (nextStep < tourSteps.length) {
        return nextStep;
      }
      return prev;
    });
  }, [onComplete]);

  const goPrev = useCallback(() => {
    setCurrentStep(prev => {
      if (prev > 0) {
        return prev - 1;
      }
      return prev;
    });
  }, []);

  const skipTour = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!isOpen || !isReady || !step) return null;

  const getTooltipPosition = (): React.CSSProperties => {
    const isMobile = window.innerWidth < 640;
    
    if (step.position === 'center' || !targetRect || isMobile) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const padding = 20;

    switch (step.position) {
      case 'top':
        return {
          bottom: `${window.innerHeight - targetRect.top + padding}px`,
          left: `${Math.max(16, Math.min(targetRect.left + targetRect.width / 2, window.innerWidth - 200))}px`,
          transform: 'translateX(-50%)',
        };
      case 'bottom':
        return {
          top: `${targetRect.bottom + padding}px`,
          left: `${Math.max(16, Math.min(targetRect.left + targetRect.width / 2, window.innerWidth - 200))}px`,
          transform: 'translateX(-50%)',
        };
      case 'left':
        return {
          top: `${targetRect.top + targetRect.height / 2}px`,
          right: `${window.innerWidth - targetRect.left + padding}px`,
          transform: 'translateY(-50%)',
        };
      case 'right':
        return {
          top: `${targetRect.top + targetRect.height / 2}px`,
          left: `${targetRect.right + padding}px`,
          transform: 'translateY(-50%)',
        };
      default:
        return {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        };
    }
  };

  return (
    <div className="fixed inset-0 z-[100]" data-testid="guided-tour">
      {/* Overlay with spotlight effect - pointer-events:none so clicks pass through to tooltip */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'rgba(0, 0, 0, 0.60)',
        }}
      />

      {/* Spotlight on target element - show whenever target exists */}
      {targetRect && (
        <div
          className="absolute pointer-events-none"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            borderRadius: '8px',
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.60), 0 0 30px rgba(0, 255, 255, 0.5)',
            border: '2px solid rgba(0, 255, 255, 0.6)',
          }}
        />
      )}

      {/* Tooltip - pointer-events:auto ensures buttons receive clicks */}
      <div
        className="absolute w-[calc(100vw-32px)] sm:w-[360px] max-w-[360px] p-4 sm:p-6 rounded-lg mx-4 sm:mx-0 z-[101] pointer-events-auto"
        style={{
          ...getTooltipPosition(),
          background: 'linear-gradient(135deg, rgba(20, 24, 59, 0.98) 0%, rgba(10, 14, 39, 0.98) 100%)',
          border: '2px solid rgba(0, 255, 255, 0.4)',
          boxShadow: '0 0 40px rgba(0, 255, 255, 0.3), 0 20px 60px rgba(0, 0, 0, 0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
        data-testid="tour-tooltip"
      >
        {/* Close button */}
        <button
          onClick={(e) => { e.stopPropagation(); skipTour(); }}
          className="absolute top-3 right-3 text-gray-400 hover:text-cyan-400 transition-colors z-[102]"
          data-testid="button-tour-close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div 
          className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
          style={{
            background: 'rgba(0, 255, 255, 0.15)',
            border: '1px solid rgba(0, 255, 255, 0.3)',
          }}
        >
          <span className="text-cyan-400">{step.icon}</span>
        </div>

        {/* Content */}
        <h3 
          className="text-lg sm:text-xl font-bold text-white mb-2"
          style={{ textShadow: '0 0 10px rgba(0, 255, 255, 0.3)' }}
        >
          {step.title}
        </h3>
        <p className="text-gray-300 text-xs sm:text-sm leading-relaxed mb-4 sm:mb-6">
          {step.description}
        </p>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {tourSteps.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentStep 
                  ? 'bg-cyan-400 w-4' 
                  : index < currentStep 
                    ? 'bg-cyan-600' 
                    : 'bg-gray-600'
              }`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className={`flex items-center gap-3 ${step.isFinal ? 'justify-center' : 'justify-between'}`}>
          {!step.isFinal && (
            <Button
              variant="ghost"
              onClick={(e) => { e.stopPropagation(); skipTour(); }}
              className="text-gray-400 hover:text-white hover:bg-gray-800 z-[102]"
              data-testid="button-tour-skip"
            >
              Skip Tour
            </Button>
          )}

          <div className="flex items-center gap-2">
            {!isFirstStep && (
              <Button
                variant="outline"
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 z-[102]"
                data-testid="button-tour-prev"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            )}
            <Button
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              className="bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30 z-[102]"
              data-testid="button-tour-next"
            >
              {step.isFinal ? 'Start Exploring' : 'Next'}
              {!step.isFinal && <ChevronRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
