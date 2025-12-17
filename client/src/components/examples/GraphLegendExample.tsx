import GraphLegend from '../GraphLegend';
import { useState } from 'react';

export default function GraphLegendExample() {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  return (
    <div 
      className="relative w-full h-32" 
      style={{ background: 'linear-gradient(180deg, #0a0e27 0%, #1a1e3f 100%)' }}
    >
      <GraphLegend 
        onFilterType={setActiveFilter}
        activeFilter={activeFilter}
      />
    </div>
  );
}
