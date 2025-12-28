import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { RotateCcw, Download, Upload, Settings, HelpCircle, Network, Plus, Search, User, FolderKanban, History, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ThemeToggle } from '@/components/ThemeProvider';
import type { GraphNode } from '@shared/schema';

interface TopNavigationProps {
  onResetView?: () => void;
  onExport?: () => void;
  onImport?: () => void;
  onHelp?: () => void;
  onSettings?: () => void;
  onAddNode?: () => void;
  onHistory?: () => void;
  onShare?: () => void;
  nodes?: GraphNode[];
  onNodeSelect?: (node: GraphNode) => void;
}

export default function TopNavigation({
  onResetView,
  onExport,
  onImport,
  onHelp,
  onSettings,
  onAddNode,
  onHistory,
  onShare,
  nodes = [],
  onNodeSelect,
}: TopNavigationProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);

  // Filter and sort nodes based on search query (Google-style ranking)
  const suggestions = searchQuery.length > 0
    ? nodes
        .filter(node => 
          node.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          node.node_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
          node.node_id.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
          const query = searchQuery.toLowerCase();
          const aName = a.display_name.toLowerCase();
          const bName = b.display_name.toLowerCase();
          
          const aStartsWith = aName.startsWith(query);
          const bStartsWith = bName.startsWith(query);
          
          // Names starting with query come first
          if (aStartsWith && !bStartsWith) return -1;
          if (!aStartsWith && bStartsWith) return 1;
          
          // Within same category, sort alphabetically
          return aName.localeCompare(bName);
        })
        .slice(0, 8)
    : [];

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset highlighted index when suggestions change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [suggestions.length, searchQuery]);

  const handleSelectNode = (node: GraphNode) => {
    onNodeSelect?.(node);
    setSearchQuery('');
    setShowSuggestions(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSelectNode(suggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  return (
    <header 
      className="fixed top-0 left-0 right-0 h-14 sm:h-16 z-50 flex items-center justify-between px-3 sm:px-6"
      style={{
        background: 'rgba(10, 14, 39, 0.95)',
        borderBottom: '2px solid rgba(0, 255, 255, 0.3)',
        boxShadow: '0 4px 30px rgba(0, 255, 255, 0.1)',
      }}
      data-testid="nav-top"
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <div 
          className="p-1.5 sm:p-2 rounded-lg"
          style={{
            background: 'rgba(0, 255, 255, 0.1)',
            boxShadow: '0 0 20px rgba(0, 255, 255, 0.3)',
          }}
        >
          <Network className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
        </div>
        <div className="hidden sm:block">
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

      {/* Search Bar */}
      <div ref={searchRef} className="relative flex-1 max-w-[180px] sm:max-w-md mx-2 sm:mx-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400/50" />
          <Input
            type="text"
            placeholder="Search people & projects..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            className="pl-10 bg-slate-900/80 border-cyan-500/30 text-white placeholder:text-cyan-400/40 focus:border-cyan-400 focus:ring-cyan-400/20"
            data-testid="input-search"
          />
        </div>
        
        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div 
            className="absolute top-full left-0 right-0 mt-1 rounded-md overflow-hidden z-50"
            style={{
              background: 'rgba(10, 14, 39, 0.98)',
              border: '1px solid rgba(0, 255, 255, 0.3)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
            }}
            data-testid="search-suggestions"
          >
            {suggestions.map((node, index) => (
              <button
                key={node.node_id}
                onClick={() => handleSelectNode(node)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors ${
                  index === highlightedIndex 
                    ? 'bg-cyan-500/20' 
                    : 'hover:bg-cyan-500/10'
                }`}
                data-testid={`search-result-${node.node_id}`}
              >
                <div 
                  className="p-1.5 rounded"
                  style={{
                    background: node.node_type.toLowerCase() === 'person' 
                      ? 'rgba(0, 255, 255, 0.2)' 
                      : 'rgba(139, 92, 246, 0.2)',
                  }}
                >
                  {node.node_type.toLowerCase() === 'person' ? (
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                  ) : (
                    <FolderKanban className="w-3.5 h-3.5 text-purple-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white font-medium truncate">
                    {node.display_name}
                  </div>
                  <div className="text-xs text-cyan-400/60 capitalize">
                    {node.node_type}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
        
        {/* No results message */}
        {showSuggestions && searchQuery.length > 0 && suggestions.length === 0 && (
          <div 
            className="absolute top-full left-0 right-0 mt-1 px-4 py-3 rounded-md text-sm text-cyan-400/60"
            style={{
              background: 'rgba(10, 14, 39, 0.98)',
              border: '1px solid rgba(0, 255, 255, 0.3)',
            }}
          >
            No matching people or projects found
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          onClick={onAddNode}
          size="icon"
          className="sm:hidden bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30"
          data-testid="button-add-node-mobile"
        >
          <Plus className="w-4 h-4" />
        </Button>
        <Button
          onClick={onAddNode}
          className="hidden sm:flex bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30"
          data-testid="button-add-node"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Node
        </Button>

        <div className="hidden sm:block w-px h-6 bg-cyan-500/30 mx-2" />

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

        <div className="hidden sm:block w-px h-6 bg-cyan-500/30 mx-2" />

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
              className="hidden sm:flex text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10"
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
              onClick={onHistory}
              className="hidden sm:flex text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10"
              data-testid="button-history"
            >
              <History className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Data History</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={onShare}
              className="text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10"
              data-testid="button-share"
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Export / Share</TooltipContent>
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
              className="hidden sm:flex text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10"
              data-testid="button-settings"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Settings</TooltipContent>
        </Tooltip>

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
