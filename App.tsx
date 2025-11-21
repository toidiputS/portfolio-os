import React, { lazy, Suspense, useEffect, useRef } from "react";
import "./index.css";
import { useKernel } from "./store/kernel";
import Desktop from "./components/Desktop";
import Taskbar from "./components/Taskbar";
import Window from "./components/Window";
import WelcomeScreen from "./components/WelcomeScreen";
import Sidebar from "./components/Sidebar";
import { getAllApps } from "./apps.config";

import { motion, AnimatePresence } from "framer-motion";
import { Analytics } from "@vercel/analytics/react";

const App: React.FC = () => {
  const windows = useKernel((state) => state.windows);
  const hasWelcomed = useKernel((state) => state.hasWelcomed);
  const setHasWelcomed = useKernel((state) => state.setHasWelcomed);
  const projectFolders = useKernel((state) => state.projectFolders);

  const theme = useKernel((state) => state.theme);

  useEffect(() => {
    // Reset welcome state on every app load
    setHasWelcomed(false);
  }, [setHasWelcomed]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  return (
    <AnimatePresence mode="sync">
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
            {windows.map((win) => {
              const allApps = getAllApps(projectFolders);
              const appDef = allApps.find(app => app.id === win.appId);
              const App = appDef?.component;
              if (!App) return null;
              return (
                <Window key={win.id} {...win}>
                  <Suspense
                    fallback={<div className="p-4">Loading App...</div>}
                  >
                    <App />
                  </Suspense>
                </Window>
              );
            })}
          </Desktop>

          <Sidebar />
          <Taskbar />
        </motion.div>
      )}
      <Analytics />
    </AnimatePresence>
  );
};

export default App;
