import HelpOverlay from '../HelpOverlay';

export default function HelpOverlayExample() {
  return (
    <div className="w-full h-[500px] relative">
      <HelpOverlay onClose={() => console.log('Close help overlay')} />
    </div>
  );
}
