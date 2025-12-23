import { RotateCcw, Download, Upload, Settings, HelpCircle, Network, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ThemeToggle } from '@/components/ThemeProvider';

interface TopNavigationProps {
  onResetView?: () => void;
  onExport?: () => void;
  onImport?: () => void;
  onHelp?: () => void;
  onSettings?: () => void;
  onAddNode?: () => void;
}

export default function TopNavigation({
  onResetView,
  onExport,
  onImport,
  onHelp,
  onSettings,
  onAddNode,
}: TopNavigationProps) {
  return (
    <header 
      className="fixed top-0 left-0 right-0 h-16 z-50 flex items-center justify-between px-6"
      style={{
        background: 'rgba(10, 14, 39, 0.95)',
        borderBottom: '2px solid rgba(0, 255, 255, 0.3)',
        boxShadow: '0 4px 30px rgba(0, 255, 255, 0.1)',
      }}
      data-testid="nav-top"
    >
      <div className="flex items-center gap-3">
        <div 
          className="p-2 rounded-lg"
          style={{
            background: 'rgba(0, 255, 255, 0.1)',
            boxShadow: '0 0 20px rgba(0, 255, 255, 0.3)',
          }}
        >
          <Network className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
          <h1 
            className="font-display text-xl font-bold text-white"
            style={{ textShadow: '0 0 10px rgba(0, 255, 255, 0.5)' }}
          >
            Network Graph
          </h1>
          <p className="text-xs text-cyan-400/70 font-tech">
            Interactive Visualization
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          onClick={onAddNode}
          className="bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30"
          data-testid="button-add-node"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Node
        </Button>

        <div className="w-px h-6 bg-cyan-500/30 mx-2" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={onResetView}
              className="text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10"
              data-testid="button-reset-view"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Reset View</TooltipContent>
        </Tooltip>

        <div className="w-px h-6 bg-cyan-500/30 mx-2" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={onExport}
              className="text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10"
              data-testid="button-export"
            >
              <Download className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Export Data</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={onImport}
              className="text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10"
              data-testid="button-import"
            >
              <Upload className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Import Data</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={onHelp}
              className="text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10"
              data-testid="button-help"
            >
              <HelpCircle className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Help</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={onSettings}
              className="text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10"
              data-testid="button-settings"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Settings</TooltipContent>
        </Tooltip>

        <div className="w-px h-6 bg-cyan-500/30 mx-2" />

        <Tooltip>
          <TooltipTrigger asChild>
            <ThemeToggle />
          </TooltipTrigger>
          <TooltipContent>Toggle Theme</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
