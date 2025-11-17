import React, { useMemo, useRef } from "react";
import { motion, PanInfo } from "framer-motion";
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
  const dragStartOffset = useRef({ x: 0, y: 0 });

  const isSnapped = snapState !== "none";

  const handleDragStart = (e: MouseEvent | TouchEvent | PointerEvent) => {
    focusWindow(id);
    if (isSnapped) {
      const pointerX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const pointerY = "touches" in e ? e.touches[0].clientY : e.clientY;
      const relativeX = pointerX - position.x;
      const restoredWidth = preSnapSize?.width || size.width;
      const newOffsetX = (relativeX / size.width) * restoredWidth;
      dragStartOffset.current = { x: newOffsetX, y: pointerY - position.y };
    }
  };

  const handleDrag = (
    e: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (isSnapped) {
      snapWindow(id, "none");
      updateWindowPosition(id, {
        x: info.point.x - dragStartOffset.current.x,
        y: info.point.y - dragStartOffset.current.y,
      });
    } else {
      updateWindowPosition(id, {
        x: position.x + info.delta.x,
        y: position.y + info.delta.y,
      });
    }
  };

  const handleDragEnd = (
    e: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const { x, y } = info.point;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // Maximise
    if (y < 1) return snapWindow(id, "maximized");

    // Side snap
    if (x < 1) return snapWindow(id, "left");
    if (x > screenWidth - 2) return snapWindow(id, "right");

    // Corner snap
    const cornerSnapZone = 20;
    const isTopCorner = y < cornerSnapZone;
    const isLeftCorner = x < cornerSnapZone;
    const isRightCorner = x > screenWidth - cornerSnapZone;
    const isBottomCorner = y > screenHeight - 48 - cornerSnapZone;

    if (isTopCorner && isLeftCorner) return snapWindow(id, "topLeft");
    if (isTopCorner && isRightCorner) return snapWindow(id, "topRight");
    if (isBottomCorner && isLeftCorner) return snapWindow(id, "bottomLeft");
    if (isBottomCorner && isRightCorner) return snapWindow(id, "bottomRight");
  };

  const handleMaximizeToggle = () => {
    snapWindow(id, snapState === "maximized" ? "none" : "maximized");
  };

  const handleResize = (info: PanInfo, corner: string) => {
    let newWidth = size.width;
    let newHeight = size.height;
    let newX = position.x;
    let newY = position.y;

    const minWidth = 300;
    const minHeight = 200;

    if (corner.includes("right"))
      newWidth = Math.max(minWidth, size.width + info.delta.x);
    if (corner.includes("bottom"))
      newHeight = Math.max(minHeight, size.height + info.delta.y);
    if (corner.includes("left")) {
      const updatedWidth = size.width - info.delta.x;
      if (updatedWidth >= minWidth) {
        newWidth = updatedWidth;
        newX = position.x + info.delta.x;
      }
    }
    if (corner.includes("top")) {
      const updatedHeight = size.height - info.delta.y;
      if (updatedHeight >= minHeight) {
        newHeight = updatedHeight;
        newY = position.y + info.delta.y;
      }
    }

    updateWindowSize(id, { width: newWidth, height: newHeight });
    updateWindowPosition(id, { x: newX, y: newY });
  };

  const Icon = app?.icon;

  return (
    <motion.div
      layout
      variants={windowVariants}
      initial="hidden"
      animate={minimized ? "minimized" : "visible"}
      exit="hidden"
      transition={{ type: "spring", stiffness: 700, damping: 40 }}
      className="absolute bg-[hsl(var(--window-bg-hsl)/0.8)] backdrop-blur-xl rounded-lg border border-[hsl(var(--border-hsl))] window-shadow overflow-hidden flex flex-col"
      style={{
        zIndex,
        filter: isMatrixEffectActive ? "blur(8px)" : "none",
        width: size.width,
        height: size.height,
        top: position.y,
        left: position.x,
        willChange: "transform, width, height, top, left",
      }}
      onMouseDownCapture={() => focusWindow(id)}
    >
      <motion.header
        onPanStart={handleDragStart}
        onPan={handleDrag}
        onPanEnd={handleDragEnd}
        onDoubleClick={handleMaximizeToggle}
        className="h-8 bg-black/20 flex items-center justify-between pl-2 select-none shrink-0"
        style={{ cursor: "grab" }}
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
          <motion.div
            onPan={(e, info) => handleResize(info, "left")}
            className="absolute -left-1 top-0 bottom-0 w-2 cursor-ew-resize"
          />
          <motion.div
            onPan={(e, info) => handleResize(info, "right")}
            className="absolute -right-1 top-0 bottom-0 w-2 cursor-ew-resize"
          />
          <motion.div
            onPan={(e, info) => handleResize(info, "top")}
            className="absolute -top-1 left-0 right-0 h-2 cursor-ns-resize"
          />
          <motion.div
            onPan={(e, info) => handleResize(info, "bottom")}
            className="absolute -bottom-1 left-0 right-0 h-2 cursor-ns-resize"
          />
          <motion.div
            onPan={(e, info) => handleResize(info, "topLeft")}
            className="absolute -top-1 -left-1 w-3 h-3 cursor-nwse-resize z-10"
          />
          <motion.div
            onPan={(e, info) => handleResize(info, "topRight")}
            className="absolute -top-1 -right-1 w-3 h-3 cursor-nesw-resize z-10"
          />
          <motion.div
            onPan={(e, info) => handleResize(info, "bottomLeft")}
            className="absolute -bottom-1 -left-1 w-3 h-3 cursor-nesw-resize z-10"
          />
          <motion.div
            onPan={(e, info) => handleResize(info, "bottomRight")}
            className="absolute -bottom-1 -right-1 w-3 h-3 cursor-nwse-resize z-10"
          />
        </>
      )}
    </motion.div>
  );
};

export default Window;
