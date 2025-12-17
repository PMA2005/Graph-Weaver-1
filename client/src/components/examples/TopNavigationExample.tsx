import TopNavigation from '../TopNavigation';

export default function TopNavigationExample() {
  return (
    <div 
      className="relative w-full h-20" 
      style={{ background: 'linear-gradient(180deg, #0a0e27 0%, #1a1e3f 100%)' }}
    >
      <TopNavigation
        onResetView={() => console.log('Reset view')}
        onExport={() => console.log('Export data')}
        onHelp={() => console.log('Show help')}
        onSettings={() => console.log('Open settings')}
      />
    </div>
  );
}
