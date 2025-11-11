import React, { useMemo } from 'react';
import { useKernel } from '../../store/kernel';
import { APPS } from '../../apps.config';
import { AppId } from '../../types';
import { ShoppingCart, HardDrive, Zap, Download } from 'lucide-react';
import { motion } from 'framer-motion';

// --- New Custom Icons for App Variety ---

const CalculatorIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
        <line x1="8" y1="6" x2="16" y2="6"></line>
        <line x1="8" y1="10" x2="8" y2="10"></line>
        <line x1="12" y1="10" x2="12" y2="10"></line>
        <line x1="16" y1="10" x2="16" y2="10"></line>
        <line x1="8" y1="14" x2="8" y2="14"></line>
        <line x1="12" y1="14" x2="12" y2="14"></line>
        <line x1="16" y1="14" x2="16" y2="14"></line>
        <line x1="8" y1="18" x2="12" y2="18"></line>
        <line x1="16" y1="18" x2="16" y2="18"></line>
    </svg>
);

const WeatherIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path>
      <path d="M22 10a3 3 0 0 0-3-3h-2.207a5.502 5.502 0 0 0-10.702.5"></path>
    </svg>
);

const MusicIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10"></circle>
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M12 12L17 10"></path>
        <path d="M9 9l-2.5-1.5"></path>
    </svg>
);

const CodeEditorIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M7 8l-4 4 4 4"></path>
        <path d="M17 8l4 4-4 4"></path>
        <path d="M14 4l-4 16"></path>
    </svg>
);

const ModelViewerIcon = ({ className }: { className?: string }) => (
     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
        <line x1="12" y1="22.08" x2="12" y2="12"></line>
     </svg>
);

const ZenGardenIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M3 12a9 9 0 0 1 9-9 9 9 0 0 1 9 9 9 9 0 0 1-9 9 9 9 0 0 1-9-9Z"></path>
        <path d="M20.2 16.5A4.5 4.5 0 0 0 15.7 12a4.5 4.5 0 0 0-4.5 4.5"></path>
        <path d="M3.8 7.5A4.5 4.5 0 0 1 8.3 12a4.5 4.5 0 0 1-4.5 4.5"></path>
    </svg>
);


const COMING_SOON_APPS = [
  { id: 'calculator', name: 'Calculator', icon: CalculatorIcon, description: 'A simple calculator for your daily needs.', isPlaceholder: true },
  { id: 'weather', name: 'Weather', icon: WeatherIcon, description: 'Get the latest weather forecast for your location.', isPlaceholder: true },
  { id: 'music', name: 'Music Player', icon: MusicIcon, description: 'Listen to your favorite tunes.', isPlaceholder: true },
  { id: 'codeEditor', name: 'Code Editor', icon: CodeEditorIcon, description: 'A lightweight editor for your coding projects.', isPlaceholder: true },
  { id: 'modelViewer', name: '3D Model Viewer', icon: ModelViewerIcon, description: 'Explore 3D models in real-time.', isPlaceholder: true },
  { id: 'zenGarden', name: 'Zen Garden', icon: ZenGardenIcon, description: 'A relaxing sandbox to find your calm.', isPlaceholder: true },
];

const allApps = [...APPS, ...COMING_SOON_APPS];

const AppStore: React.FC = () => {
  const openWindow = useKernel(state => state.openWindow);
  const windows = useKernel(state => state.windows);
  const openAppIds = useMemo(() => new Set(windows.map(w => w.appId)), [windows]);

  return (
    <div className="p-8 bg-[hsl(var(--card-hsl))] h-full overflow-y-auto">
      <header className="flex items-center gap-4 mb-8">
        <ShoppingCart size={40} className="text-[hsl(var(--accent-hsl))]" />
        <div>
          <h1 className="text-3xl font-bold text-[hsl(var(--card-foreground-hsl))]">App Store</h1>
          <p className="text-[hsl(var(--muted-foreground-hsl))]">Discover and launch applications for Portfolio OS.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allApps.filter(app => app.id !== 'appStore').map((app, index) => {
          const isInstalled = !('isPlaceholder' in app);
          const isRunning = openAppIds.has(app.id as AppId);
          const Icon = app.icon;

          return (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-[hsl(var(--secondary-hsl))] p-4 rounded-lg flex flex-col justify-between border border-[hsl(var(--border-hsl))] hover:border-[hsl(var(--accent-hsl))] transition-colors"
            >
              <div className="flex items-center gap-4 mb-4">
                <Icon className="w-12 h-12 text-[hsl(var(--foreground-hsl))]" />
                <div className="overflow-hidden">
                  <h2 className="text-lg font-semibold truncate text-[hsl(var(--secondary-foreground-hsl))]">{app.name}</h2>
                  <p className="text-sm text-[hsl(var(--muted-foreground-hsl))] h-10">{app.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-auto">
                {isInstalled ? (
                  <button
                    onClick={() => openWindow(app.id as AppId)}
                    className={`w-full p-2 rounded-md text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                      isRunning ? 'bg-[hsl(var(--muted-hsl))] text-[hsl(var(--muted-foreground-hsl))] cursor-default' : 'bg-[hsl(var(--accent-strong-hsl))] text-[hsl(var(--accent-foreground-hsl))] hover:brightness-90'
                    }`}
                    disabled={isRunning}
                  >
                    {isRunning ? <><Zap size={14}/> Running</> : 'Open'}
                  </button>
                ) : (
                  <button
                    className="w-full p-2 rounded-md text-sm font-semibold bg-[hsl(var(--accent-hsl))] text-[hsl(var(--accent-foreground-hsl))] cursor-not-allowed flex items-center justify-center gap-2 opacity-70"
                    disabled
                  >
                    <Download size={14}/> Get
                  </button>
                )}
                 <div className="flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground-hsl))] bg-[hsl(var(--muted-hsl))] px-2 py-1 rounded-md shrink-0">
                    <HardDrive size={12}/>
                    <span>{isInstalled ? 'INSTALLED' : 'REMOTE'}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default AppStore;
