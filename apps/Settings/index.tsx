import React from 'react';
import { useKernel } from '../../store/kernel';
import { Sun, Moon } from 'lucide-react';

const WALLPAPERS = [
  'assets/images/welcome.png',
  ...Array.from({ length: 6 }, (_, i) => `https://picsum.photos/seed/win11-wallpaper-${i}/1920/1080`)
];

const Settings: React.FC = () => {
  const currentWallpaper = useKernel(state => state.wallpaper);
  const setWallpaper = useKernel(state => state.setWallpaper);
  const theme = useKernel(state => state.theme);
  const toggleTheme = useKernel(state => state.toggleTheme);

  return (
    <div className="p-8 h-full overflow-y-auto text-[hsl(var(--card-foreground-hsl))]">
      <h1 className="text-2xl font-bold mb-4">Personalization</h1>
      
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Theme</h2>
        <div className="flex items-center gap-2 p-1 bg-[hsl(var(--secondary-hsl))] rounded-lg">
            <button 
                onClick={() => theme !== 'light' && toggleTheme()}
                className={`flex-1 p-2 rounded-md text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                    theme === 'light' ? 'bg-[hsl(var(--background-hsl))] text-[hsl(var(--foreground-hsl))] shadow' : 'hover:bg-black/10'
                }`}
            >
                <Sun size={16} /> Light
            </button>
            <button 
                onClick={() => theme !== 'dark' && toggleTheme()}
                className={`flex-1 p-2 rounded-md text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                    theme === 'dark' ? 'bg-[hsl(var(--background-hsl))] text-[hsl(var(--foreground-hsl))] shadow' : 'hover:bg-white/10'
                }`}
            >
                <Moon size={16} /> Dark
            </button>
        </div>
      </div>
      
      <div>
        <h2 className="text-lg font-semibold mb-2">Change Background</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {WALLPAPERS.map(url => (
            <button
              key={url}
              onClick={() => setWallpaper(url)}
              className={`aspect-video rounded-lg overflow-hidden border-2 ${
                currentWallpaper === url ? 'border-[hsl(var(--accent-strong-hsl))]' : 'border-transparent'
              } transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring-hsl))]`}
            >
              <img src={url} alt="Wallpaper thumbnail" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Settings;
