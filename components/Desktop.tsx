import React, { useState, useEffect, useRef } from 'react';
import './Desktop.css';
import { useKernel } from '../store/kernel';
import SphereImageGrid from './SphereImageGrid'; // Import SphereImageGrid
import ContextMenu from './ContextMenu';
import MatrixRain from './MatrixRain';
import VoiceAssistant from './VoiceAssistant';
import Taskbar from './Taskbar';
import { APPS } from '../apps.config';

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
}

const Desktop: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const wallpaper = useKernel(state => state.wallpaper);
  const openWindow = useKernel(state => state.openWindow);
  const closeStartMenu = useKernel(state => state.closeStartMenu);
  const gemini = useKernel(state => state.gemini);
  const isMatrixEffectActive = useKernel(state => state.isMatrixEffectActive);
  const toggleMatrixEffect = useKernel(state => state.toggleMatrixEffect);
  const closeSidebar = useKernel(state => state.closeSidebar);
  const theme = useKernel(state => state.theme);

  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ visible: false, x: 0, y: 0 });
  const wallpaperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (wallpaperRef.current) {
      wallpaperRef.current.style.setProperty('--wallpaper-url', `url(${wallpaper})`);
    }
  }, [wallpaper]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!wallpaperRef.current || isMatrixEffectActive) return;
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      const moveX = ((clientX / innerWidth) - 0.5) * 30;
      const moveY = ((clientY / innerHeight) - 0.5) * 30;
      wallpaperRef.current.style.transform = `translate(${-moveX}px, ${-moveY}px) scale(1.05)`;
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isMatrixEffectActive]);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && isMatrixEffectActive) {
            toggleMatrixEffect(false);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMatrixEffectActive, toggleMatrixEffect]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY });
    closeStartMenu();
    closeSidebar();
  };

  const handleClick = () => {
    setContextMenu({ visible: false, x: 0, y: 0 });
    closeStartMenu();
    closeSidebar();
  };

  return (
    <main
      className={`absolute inset-0 h-full w-full ${theme}`}
      onContextMenu={handleContextMenu}
      onClick={handleClick}
    >
      {isMatrixEffectActive && <MatrixRain />}
      <div
        ref={wallpaperRef}
        className={`wallpaper absolute inset-[-20px] bg-cover bg-center transition-transform duration-300 ease-out ${isMatrixEffectActive ? 'matrix-effect' : ''}`}
      />
      
      <div className="absolute inset-0">
        <SphereImageGrid
            apps={APPS}
            onAppClick={openWindow}
            containerSize={Math.min(window.innerWidth, window.innerHeight) * 0.6}
            sphereRadius={Math.min(window.innerWidth, window.innerHeight) * 0.25}
            autoRotate={true}
          />
      </div>

      {children}

      {contextMenu.visible && <ContextMenu x={contextMenu.x} y={contextMenu.y} onClose={() => setContextMenu({ ...contextMenu, visible: false })} />}

      {/* AI Presence Indicator */}
      <div
        className={`ai-indicator fixed top-4 right-4 h-6 w-6 rounded-full bg-[hsl(var(--accent-hsl))] transition-all duration-500 ease-in-out z-30 ${
          gemini.isLoading ? 'opacity-100 scale-100 loading' : 'opacity-0 scale-0'
        }`}
      />

      <VoiceAssistant />
      <Taskbar />
    </main>
  );
};

export default Desktop;
