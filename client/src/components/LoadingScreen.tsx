import { Network } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div 
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{ background: 'linear-gradient(180deg, #0a0e27 0%, #1a1e3f 100%)' }}
      data-testid="screen-loading"
    >
      <div className="relative">
        <div 
          className="w-20 h-20 rounded-full flex items-center justify-center animate-pulse"
          style={{
            background: 'rgba(0, 255, 255, 0.1)',
            boxShadow: '0 0 40px rgba(0, 255, 255, 0.4)',
          }}
        >
          <Network 
            className="w-10 h-10 text-cyan-400 animate-spin"
            style={{ animationDuration: '3s' }}
          />
        </div>
        <div 
          className="absolute inset-0 rounded-full animate-ping"
          style={{
            border: '2px solid rgba(0, 255, 255, 0.3)',
            animationDuration: '1.5s',
          }}
        />
      </div>
      
      <h2 
        className="mt-8 font-display text-xl font-bold text-white"
        style={{ textShadow: '0 0 20px rgba(0, 255, 255, 0.5)' }}
      >
        Loading Network
      </h2>
      <p className="mt-2 text-cyan-400/70 font-tech text-sm">
        Initializing graph visualization...
      </p>
    </div>
  );
}
