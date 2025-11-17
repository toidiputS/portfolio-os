import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useKernel } from "../store/kernel";
import { CloudSun, Thermometer, Wind } from "lucide-react";

const WeatherWidget: React.FC = () => {
  return (
    <div className="bg-[hsl(var(--secondary-hsl))] p-4 rounded-lg border border-[hsl(var(--border-hsl))]">
      <h3 className="font-bold mb-2 flex items-center gap-2">
        <CloudSun className="text-yellow-400" /> Weather
      </h3>
      <div className="text-center">
        <p className="text-4xl font-bold">72°F</p>
        <p className="text-[hsl(var(--muted-foreground-hsl))]">Partly Cloudy</p>
      </div>
      <div className="mt-4 flex justify-around text-sm">
        <div className="text-center">
          <p className="font-bold">H: 75°</p>
          <p className="text-[hsl(var(--muted-foreground-hsl))]">High</p>
        </div>
        <div className="text-center">
          <p className="font-bold">L: 65°</p>
          <p className="text-[hsl(var(--muted-foreground-hsl))]">Low</p>
        </div>
        <div className="text-center">
          <p className="font-bold">10mph</p>
          <p className="text-[hsl(var(--muted-foreground-hsl))]">Wind</p>
        </div>
      </div>
    </div>
  );
};

const Sidebar: React.FC = () => {
  const isSidebarOpen = useKernel((state) => state.isSidebarOpen);

  return (
    <AnimatePresence>
      {isSidebarOpen && (
        <motion.div
          initial={{ opacity: 0, x: -300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -300 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="absolute top-0 left-0 bottom-12 w-80 bg-[hsl(var(--taskbar-bg-hsl)/0.7)] taskbar-blur border-r border-[hsl(var(--border-hsl))] p-4 shadow-2xl z-50 flex flex-col gap-4"
        >
          <h2 className="text-xl font-semibold">Widgets</h2>
          <WeatherWidget />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;
