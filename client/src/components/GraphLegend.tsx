import { User, Folder } from 'lucide-react';

interface LegendItem {
  type: string;
  label: string;
  color: string;
  icon: typeof User;
}

const LEGEND_ITEMS: LegendItem[] = [
  { type: 'person', label: 'Person', color: '#00ffff', icon: User },
  { type: 'project', label: 'Project', color: '#b026ff', icon: Folder },
];

interface GraphLegendProps {
  onFilterType?: (type: string | null) => void;
  activeFilter?: string | null;
}

export default function GraphLegend({ onFilterType, activeFilter }: GraphLegendProps) {
  return (
    <div 
      className="absolute bottom-0 left-0 right-0 h-20 z-40"
      style={{
        background: 'rgba(10, 14, 39, 0.95)',
        borderTop: '2px solid rgba(0, 255, 255, 0.3)',
        boxShadow: '0 -4px 30px rgba(0, 255, 255, 0.1)',
      }}
      data-testid="legend-bar"
    >
      <div className="h-full flex items-center justify-center gap-8 px-6">
        <span className="font-tech text-xs text-cyan-400 uppercase tracking-widest">
          Legend
        </span>
        
        <div className="flex items-center gap-6">
          {LEGEND_ITEMS.map((item) => {
            const isActive = activeFilter === item.type;
            const Icon = item.icon;
            
            return (
              <button
                key={item.type}
                onClick={() => onFilterType?.(isActive ? null : item.type)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                  isActive 
                    ? 'border-cyan-400 bg-cyan-500/10' 
                    : 'border-transparent hover:border-cyan-500/30 hover:bg-cyan-500/5'
                }`}
                data-testid={`button-filter-${item.type}`}
              >
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ 
                    backgroundColor: item.color,
                    boxShadow: `0 0 8px ${item.color}`,
                  }}
                />
                <Icon 
                  className="w-4 h-4" 
                  style={{ color: item.color }}
                />
                <span className="text-sm text-gray-300 font-medium">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onFilterType?.(null)}
          className={`text-xs font-tech uppercase tracking-wide px-3 py-1.5 rounded border transition-all ${
            activeFilter === null
              ? 'text-cyan-400 border-cyan-500/50'
              : 'text-gray-500 border-gray-600 hover:text-gray-300'
          }`}
          data-testid="button-filter-all"
        >
          Show All
        </button>
      </div>
    </div>
  );
}
