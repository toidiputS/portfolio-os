import React, { useMemo, useRef, useEffect } from "react";
import { motion, PanInfo, useMotionValue, useSpring } from "framer-motion";
import { X, Square, Minus, Copy } from "lucide-react";
import { useKernel } from "../store/kernel";
import { WindowInstance } from "../types";
import { APPS } from "../apps.config";

const windowVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0 },
  minimized: { opacity: 0, scale: 0.8, y: 300, transition: { duration: 0.2 } },
};

const Window: React.FC<WindowInstance & { children: React.ReactNode }> = ({
  id,
  appId,
  title,
  position,
  size,
  zIndex,
  minimized,
  snapState,
  preSnapSize,
  children,
}) => {
  const focusWindow = useKernel((state) => state.focusWindow);
  const closeWindow = useKernel((state) => state.closeWindow);
  const minimizeWindow = useKernel((state) => state.minimizeWindow);
  const snapWindow = useKernel((state) => state.snapWindow);
  const updateWindowPosition = useKernel((state) => state.updateWindowPosition);
  const updateWindowSize = useKernel((state) => state.updateWindowSize);
  const isMatrixEffectActive = useKernel((state) => state.isMatrixEffectActive);

  const app = useMemo(() => APPS.find((a) => a.id === appId), [appId]);

  // Motion values for direct manipulation without re-renders
  const x = useMotionValue(position.x);
  const y = useMotionValue(position.y);
  const width = useMotionValue(size.width);
  const height = useMotionValue(size.height);

  // Sync motion values when props change (e.g. from store updates or snapping)
  useEffect(() => {
    x.set(position.x);
    y.set(position.y);
  }, [position.x, position.y, x, y]);

  useEffect(() => {
    width.set(size.width);
    height.set(size.height);
  }, [size.width, size.height, width, height]);

  const isSnapped = snapState !== "none";

  const handleDragStart = (e: MouseEvent | TouchEvent | PointerEvent) => {
    focusWindow(id);
    if (isSnapped && preSnapSize) {
      const pointerX = "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;

      // Restore size immediately for visual feedback
      width.set(preSnapSize.width);
      height.set(preSnapSize.height);

      // Calculate new X to keep mouse relative position proportional
      const currentWidth = size.width; // Snapped width (e.g. screen width)
      const relativeX = pointerX - position.x;
      const ratio = relativeX / currentWidth;
      const newX = pointerX - (ratio * preSnapSize.width);

      x.set(newX);
      // Keep Y as is (usually 0 if maximized), or maybe adjust to keep titlebar under mouse?
      // For now, keeping Y as is (0) is fine, the drag will add delta to it.
    }
  };

  const handleDrag = (
    e: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (isSnapped) {
      // If dragging while snapped, unsnap but keep relative position
      // This is complex to do perfectly without a store update, 
      // so we might just let the user drag and it will feel "stuck" until they move enough?
      // Or better: calculate where it WOULD be.
      // For now, let's just allow dragging to update the visual position
      // and unsnap on end if moved significantly.
      // Actually, standard OS behavior: dragging a maximized window unsnaps it immediately.
      // But we can't easily update store mid-drag without freezing.
      // So we'll just update local x/y.
    }

    const currentX = x.get();
    const currentY = y.get();
    x.set(currentX + info.delta.x);
    y.set(currentY + info.delta.y);
  };

  const handleDragEnd = (
    e: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const currentX = x.get();
    const currentY = y.get();
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // Check for snap zones
    const pointerX = "touches" in e ? e.changedTouches[0].clientX : (e as MouseEvent).clientX;
    const pointerY = "touches" in e ? e.changedTouches[0].clientY : (e as MouseEvent).clientY;

    // Maximise (Top edge)
    if (pointerY < 10) return snapWindow(id, "maximized");

    // Side snap
    if (pointerX < 10) return snapWindow(id, "left");
    if (pointerX > screenWidth - 10) return snapWindow(id, "right");

    // Corner snap
    const cornerSnapZone = 20;
    const isTopCorner = pointerY < cornerSnapZone;
    const isBottomCorner = pointerY > screenHeight - 48 - cornerSnapZone; // 48 is taskbar height

    if (pointerX < cornerSnapZone && isTopCorner) return snapWindow(id, "topLeft");
    if (pointerX > screenWidth - cornerSnapZone && isTopCorner) return snapWindow(id, "topRight");
    if (pointerX < cornerSnapZone && isBottomCorner) return snapWindow(id, "bottomLeft");
    if (pointerX > screenWidth - cornerSnapZone && isBottomCorner) return snapWindow(id, "bottomRight");

    // If we get here, we are NOT snapping to a zone.
    if (isSnapped) {
      // We moved but didn't snap to a new zone -> Unsnap
      snapWindow(id, "none");
    }

    // Always update position (if not snapped to a zone)
    updateWindowPosition(id, { x: currentX, y: currentY });
  };

  const handleMaximizeToggle = () => {
    snapWindow(id, snapState === "maximized" ? "none" : "maximized");
  };

  const handleResize = (info: PanInfo, direction: string) => {
    const currentWidth = width.get();
    const currentHeight = height.get();
    const currentX = x.get();
    const currentY = y.get();

    let newWidth = currentWidth;
    let newHeight = currentHeight;
    let newX = currentX;
    let newY = currentY;

    const minWidth = 300;
    const minHeight = 200;

    if (direction.includes("right")) {
      newWidth = Math.max(minWidth, currentWidth + info.delta.x);
    }
    if (direction.includes("bottom")) {
      newHeight = Math.max(minHeight, currentHeight + info.delta.y);
    }
    if (direction.includes("left")) {
      const updatedWidth = currentWidth - info.delta.x;
      if (updatedWidth >= minWidth) {
        newWidth = updatedWidth;
        newX = currentX + info.delta.x;
      }
    }
    if (direction.includes("top")) {
      const updatedHeight = currentHeight - info.delta.y;
      if (updatedHeight >= minHeight) {
        newHeight = updatedHeight;
        newY = currentY + info.delta.y;
      }
    }

    width.set(newWidth);
    height.set(newHeight);
    x.set(newX);
    y.set(newY);
  };

  const handleResizeEnd = () => {
    updateWindowSize(id, { width: width.get(), height: height.get() });
    updateWindowPosition(id, { x: x.get(), y: y.get() });
  };

  const Icon = app?.icon;

  return (
    <motion.div
      layout={false} // Disable layout animation to prevent conflicts with manual sizing
      variants={windowVariants}
      initial="hidden"
      animate={minimized ? "minimized" : "visible"}
      exit="hidden"
      transition={{ type: "spring", stiffness: 700, damping: 40 }}
      className="absolute bg-[hsl(var(--window-bg-hsl)/0.8)] backdrop-blur-xl rounded-lg border border-[hsl(var(--border-hsl))] window-shadow overflow-hidden flex flex-col"
      style={{
        zIndex,
        filter: isMatrixEffectActive ? "blur(8px)" : "none",
        width,
        height,
        x, // Use motion value for x
        y, // Use motion value for y
        // Remove top/left from style as we use x/y transform
      }}
      onMouseDownCapture={() => focusWindow(id)}
    >
      <motion.header
        onPanStart={handleDragStart}
        onPan={handleDrag}
        onPanEnd={handleDragEnd}
        onDoubleClick={handleMaximizeToggle}
        className="h-8 bg-black/20 flex items-center justify-between pl-2 select-none shrink-0"
        style={{ cursor: "grab", touchAction: "none" }}
      >
        <div className="flex items-center gap-2 pointer-events-none text-[hsl(var(--foreground-hsl))]">
          {Icon && <Icon className="w-4 h-4" />}
          <span className="text-sm font-medium">{title}</span>
        </div>
        <div className="flex items-center h-full text-[hsl(var(--foreground-hsl))]">
          <button
            type="button"
            onClick={() => minimizeWindow(id)}
            className="px-3 h-full hover:bg-[hsl(var(--secondary-hsl))] transition-colors"
            aria-label="Minimize window"
          >
            <Minus size={16} />
          </button>
          <button
            type="button"
            onClick={handleMaximizeToggle}
            className="px-3 h-full hover:bg-[hsl(var(--secondary-hsl))] transition-colors"
            aria-label={
              snapState === "maximized" ? "Restore window" : "Maximize window"
            }
          >
            {snapState === "maximized" ? (
              <Copy size={14} />
            ) : (
              <Square size={14} />
            )}
          </button>
          <button
            type="button"
            onClick={() => closeWindow(id)}
            className="px-3 h-full hover:bg-[hsl(var(--destructive-hsl))] hover:text-[hsl(var(--destructive-foreground-hsl))] transition-colors"
            aria-label="Close window"
          >
            <X size={16} />
          </button>
        </div>
      </motion.header>
      <main className="flex-1 overflow-auto bg-transparent text-[hsl(var(--foreground-hsl))] relative">
        {children}
      </main>

      {!isSnapped && (
        <>
          {/* Resize Handles */}
          <motion.div
            onPan={(e, info) => handleResize(info, "left")}
            onPanEnd={handleResizeEnd}
            className="absolute -left-1 top-0 bottom-0 w-3 cursor-ew-resize z-20"
          />
          <motion.div
            onPan={(e, info) => handleResize(info, "right")}
            onPanEnd={handleResizeEnd}
            className="absolute -right-1 top-0 bottom-0 w-3 cursor-ew-resize z-20"
          />
          <motion.div
            onPan={(e, info) => handleResize(info, "top")}
            onPanEnd={handleResizeEnd}
            className="absolute -top-1 left-0 right-0 h-3 cursor-ns-resize z-20"
          />
          <motion.div
            onPan={(e, info) => handleResize(info, "bottom")}
            onPanEnd={handleResizeEnd}
            className="absolute -bottom-1 left-0 right-0 h-3 cursor-ns-resize z-20"
          />
          <motion.div
            onPan={(e, info) => handleResize(info, "topLeft")}
            onPanEnd={handleResizeEnd}
            className="absolute -top-1 -left-1 w-4 h-4 cursor-nwse-resize z-30"
          />
          <motion.div
            onPan={(e, info) => handleResize(info, "topRight")}
            onPanEnd={handleResizeEnd}
            className="absolute -top-1 -right-1 w-4 h-4 cursor-nesw-resize z-30"
          />
          <motion.div
            onPan={(e, info) => handleResize(info, "bottomLeft")}
            onPanEnd={handleResizeEnd}
            className="absolute -bottom-1 -left-1 w-4 h-4 cursor-nesw-resize z-30"
          />
          <motion.div
            onPan={(e, info) => handleResize(info, "bottomRight")}
            onPanEnd={handleResizeEnd}
            className="absolute -bottom-1 -right-1 w-4 h-4 cursor-nwse-resize z-30"
          />
        </>
      )}
    </motion.div>
  );
};

export default Window;
