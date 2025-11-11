import React, { lazy, Suspense, useEffect, useRef } from 'react';
import './index.css';
import { useKernel } from './store/kernel';
import Desktop from './components/Desktop';
import Taskbar from './components/Taskbar';
import Window from './components/Window';
import WelcomeScreen from './components/WelcomeScreen';
import Sidebar from './components/Sidebar';
import { APPS_CONFIG } from './apps.config';
import VoiceAssistant from './components/VoiceAssistant';
import { motion, AnimatePresence } from 'framer-motion';
import { Analytics } from '@vercel/analytics/react';

const ConversationTranscript: React.FC = () => {
    const transcript = useKernel(state => state.conversationTranscript);
    const endOfMessagesRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript]);
    
    // Hide transcript if there are no messages
    if (transcript.length === 0) {
        return null;
    }

    return (
        <div className="fixed top-0 right-0 bottom-12 w-96 p-4 pointer-events-none z-40">
            <div className="h-full w-full flex flex-col justify-end gap-3 overflow-y-auto no-scrollbar pr-2">
                <AnimatePresence>
                    {transcript.map((msg, index) => (
                        <motion.div
                            key={index}
                            layout
                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            className={`flex ${msg.source === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className="bg-black/80 backdrop-blur-sm border-2 border-[hsl(var(--foreground-hsl))] rounded-lg p-3 max-w-xs pointer-events-auto shadow-lg">
                                <p className="text-white whitespace-pre-wrap text-sm">{msg.text}</p>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                <div ref={endOfMessagesRef} />
            </div>
             <style>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
};


const App: React.FC = () => {
  const windows = useKernel(state => state.windows);
  const hasWelcomed = useKernel(state => state.hasWelcomed);
  const setHasWelcomed = useKernel(state => state.setHasWelcomed);
  const setMicPermissionGranted = useKernel(state => state.setMicPermissionGranted);
  const setInitialGreetingSpoken = useKernel(state => state.setInitialGreetingSpoken);
  const theme = useKernel(state => state.theme);

  useEffect(() => {
    // Reset welcome state on every app load to show microphone prompt
    setHasWelcomed(false);
    setMicPermissionGranted(false);
    setInitialGreetingSpoken(false);
  }, [setHasWelcomed, setMicPermissionGranted, setInitialGreetingSpoken]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return (
    <AnimatePresence mode="wait">
      {!hasWelcomed ? (
        <WelcomeScreen key="welcome" />
      ) : (
        <motion.div
          key="main"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 3 }}
          className="h-screen w-screen overflow-hidden bg-black font-sans"
        >
          <Desktop>
            {windows.map(win => {
              const App = APPS_CONFIG[win.appId]?.component;
              if (!App) return null;
              return (
                <Window key={win.id} {...win}>
                  <Suspense fallback={<div className="p-4">Loading App...</div>}>
                    <App />
                  </Suspense>
                </Window>
              );
            })}
          </Desktop>
          <ConversationTranscript />
          <VoiceAssistant />
          <Sidebar />
          <Taskbar />
        </motion.div>
      )}
      <Analytics />
    </AnimatePresence>
  );
};

export default App;
