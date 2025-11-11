import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useKernel } from '../store/kernel';
import Icon from './Icon';
import { APPS } from '../apps.config';

const StartMenu: React.FC = () => {
  const isStartMenuOpen = useKernel(state => state.isStartMenuOpen);
  const openWindow = useKernel(state => state.openWindow);

  return (
    <AnimatePresence>
      {isStartMenuOpen && (
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="absolute bottom-14 left-1/2 -translate-x-1/2 w-[500px] h-[600px] bg-[hsl(var(--popover-hsl)/0.7)] taskbar-blur border border-[hsl(var(--border-hsl))] rounded-lg p-6 shadow-2xl"
        >
          <div className="grid grid-cols-4 gap-4">
            {APPS.map(app => (
              <Icon key={app.id} app={app} onDoubleClick={() => openWindow(app.id)} />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StartMenu;