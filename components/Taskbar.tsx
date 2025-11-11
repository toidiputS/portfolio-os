import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence, Transition } from 'framer-motion';
import { useKernel } from '../store/kernel';
import { APPS } from '../apps.config';
import { LayoutGrid, Volume2, Wifi, Bell } from 'lucide-react';

const indicatorTransition: Transition = { type: 'spring', stiffness: 500, damping: 30 };
const animateVisible = { opacity: 1 };
const animateHidden = { opacity: 0 };

const useClickOutside = <T extends HTMLElement>(ref: React.RefObject<T | null>, handler: () => void) => {
    useEffect(() => {
        const listener = (event: MouseEvent | TouchEvent) => {
            if (!ref.current || ref.current.contains(event.target as Node)) {
                return;
            }
            handler();
        };
        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);
        return () => {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [ref, handler]);
};

const Taskbar: React.FC = () => {
  const windows = useKernel(state => state.windows);
  const activeWindowId = useKernel(state => state.activeWindowId);
  const toggleStartMenu = useKernel(state => state.toggleStartMenu);
  const focusWindow = useKernel(state => state.focusWindow);
  const toggleSidebar = useKernel(state => state.toggleSidebar);
  const hasNewMessage = useKernel(state => state.hasNewMessage);
  const setHasNewMessage = useKernel(state => state.setHasNewMessage);
  
  const [time, setTime] = useState(new Date());
  const [volume, setVolume] = useState(50);
  const [showVolume, setShowVolume] = useState(false);
  const volumeRef = useRef<HTMLDivElement>(null);
  
  const closeVolumeSlider = useCallback(() => {
      setShowVolume(false);
  }, []);
  
  useClickOutside(volumeRef, closeVolumeSlider);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const openApps = useMemo(() => {
    return windows.map(win => ({
        win,
        app: APPS.find(app => app.id === win.appId)
    })).filter(item => item.app);
  }, [windows]);

  return (
    <footer className="absolute bottom-0 left-0 right-0 h-12 flex justify-center items-center z-9999">
      <div className="flex items-center justify-between px-2 bg-black/90 text-white border-t border-white/20 rounded-lg shadow-lg">
        <div className="flex items-center gap-1">
           <button
            type="button"
            title="Show Applications"
            onClick={(e) => { e.stopPropagation(); toggleSidebar(); }}
            className="p-2 hover:bg-[hsl(var(--secondary-hsl))] rounded"
          >
             <LayoutGrid className="w-5 h-5" />
          </button>
           <button
            type="button"
            title="Start Menu"
            onClick={(e) => { e.stopPropagation(); toggleStartMenu(); }}
            className="p-2 hover:bg-[hsl(var(--secondary-hsl))] rounded"
          >
             <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 48 48" className="w-5 h-5 text-[hsl(var(--accent-strong-hsl))]"><path d="M22.5 38V25.5H10V38h12.5Zm0-15V10H10v12.5h12.5ZM38 38V25.5H25.5V38H38Zm0-15V10H25.5v12.5H38Z"/></svg>
          </button>
          {openApps.map(({ win, app }) => {
            if (!app) return null;
            const Icon = app.icon;
            const isActive = win.id === activeWindowId && !win.minimized;
            return (
              <button key={win.id} type="button" title={app.name} onClick={() => focusWindow(win.id)} className="relative p-2 h-12 w-12 flex items-center justify-center">
                <Icon className={`w-6 h-6 transition-transform duration-200 ${isActive ? 'scale-110' : 'scale-100'}`}/>
                <motion.div
                  layoutId={`taskbar_indicator_${win.id}`}
                  className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-1 rounded-full bg-[hsl(var(--accent-hsl))] ${win.minimized ? 'w-3' : 'w-6'}`}
                  initial={false}
                  animate={isActive || win.minimized ? animateVisible : animateHidden}
                  transition={indicatorTransition}
                />
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 pr-2">
            <div className="relative" ref={volumeRef}>
              <button type="button" title="Volume" onClick={() => setShowVolume(!showVolume)} className="p-2 hover:bg-[hsl(var(--secondary-hsl))] rounded">
                <Volume2 size={18} />
              </button>
              <AnimatePresence>
              {showVolume && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-12 right-0 bg-[hsl(var(--popover-hsl)/0.8)] taskbar-blur p-4 rounded-lg shadow-lg border border-[hsl(var(--border-hsl))]"
                  >
                    <div className="flex items-center gap-2">
                        <span>{volume}</span>
                        <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={volume} 
                            onChange={(e) => setVolume(Number(e.target.value))}
                            className="w-24 h-1 bg-[hsl(var(--muted-hsl))] rounded-lg appearance-none cursor-pointer"
                            title="Volume control"
                        />
                    </div>
                  </motion.div>
              )}
              </AnimatePresence>
            </div>
            <div title="Connected: Excellent" className="p-2 hover:bg-[hsl(var(--secondary-hsl))] rounded">
                <Wifi size={18} />
            </div>
            <button type="button" title="Notifications" onClick={() => setHasNewMessage(false)} className="p-2 hover:bg-[hsl(var(--secondary-hsl))] rounded relative">
                <Bell size={18} />
                {hasNewMessage && <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"/>}
            </button>
            <div className="text-xs text-center pl-2 border-l border-[hsl(var(--border-hsl))]">
              <div>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              <div>{time.toLocaleDateString([], { month: '2-digit', day: '2-digit', year: 'numeric' })}</div>
            </div>
        </div>
      </div>
    </footer>
  );
};

export default Taskbar;
