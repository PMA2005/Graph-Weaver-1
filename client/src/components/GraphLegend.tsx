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

const RELATIONSHIP_COLORS: { type: string; label: string; color: string }[] = [
  { type: 'assigned_to', label: 'Assigned', color: '#22c55e' },
  { type: 'collaborates_with', label: 'Collaborates', color: '#3b82f6' },
  { type: 'consults_on', label: 'Consults', color: '#eab308' },
  { type: 'manages', label: 'Manages', color: '#f97316' },
  { type: 'reports_to', label: 'Reports', color: '#ec4899' },
  { type: 'works_on', label: 'Works On', color: '#a855f7' },
];

interface GraphLegendProps {
  onFilterType?: (type: string | null) => void;
  activeFilter?: string | null;
}

export default function GraphLegend({ onFilterType, activeFilter }: GraphLegendProps) {
  return (
    <div 
      className="absolute bottom-0 left-0 right-0 z-40"
      style={{
        background: 'rgba(10, 14, 39, 0.95)',
        borderTop: '2px solid rgba(0, 255, 255, 0.3)',
        boxShadow: '0 -4px 30px rgba(0, 255, 255, 0.1)',
      }}
      data-testid="legend-bar"
    >
      <div className="flex items-center justify-center gap-6 px-4 py-2">
        <div className="flex items-center gap-4">
          <span className="font-tech text-xs text-cyan-400 uppercase tracking-widest">
            Nodes
          </span>
          {LEGEND_ITEMS.map((item) => {
            const isActive = activeFilter === item.type;
            const Icon = item.icon;
            
            return (
              <button
                key={item.type}
                onClick={() => onFilterType?.(isActive ? null : item.type)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded border transition-all ${
                  isActive 
                    ? 'border-cyan-400 bg-cyan-500/10' 
                    : 'border-transparent hover:border-cyan-500/30 hover:bg-cyan-500/5'
                }`}
                data-testid={`button-filter-${item.type}`}
              >
                <Icon 
                  className="w-3.5 h-3.5" 
                  style={{ color: item.color }}
                />
                <span className="text-xs text-gray-300 font-medium">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="w-px h-6 bg-cyan-500/30" />

        <div className="flex items-center gap-3">
          <span className="font-tech text-xs text-cyan-400 uppercase tracking-widest">
            Relationships
          </span>
          {RELATIONSHIP_COLORS.map((rel) => (
            <div 
              key={rel.type}
              className="flex items-center gap-1.5"
              data-testid={`legend-relationship-${rel.type}`}
            >
              <div 
                className="w-4 h-0.5 rounded"
                style={{ 
                  backgroundColor: rel.color,
                  boxShadow: `0 0 4px ${rel.color}`,
                }}
              />
              <span className="text-xs text-gray-400">
                {rel.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
