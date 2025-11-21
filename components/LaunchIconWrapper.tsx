import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./PortalLaunchAnimations.css";

interface LaunchIconWrapperProps {
  children: React.ReactNode; // icon svg
  onLaunchComplete: () => void; // call after animation finishes
  triggerPortalFlare?: () => void; // portal flare trigger
  animationDurationMs?: number; // default 300ms
  style?: React.CSSProperties; // positioning + size from parent
  warpTarget?: { x: number; y: number }; // ← portal/sphere center
  className?: string; // extra classes
  onMouseEnter?: (e: React.MouseEvent) => void;
  onMouseLeave?: (e: React.MouseEvent) => void;
}

interface WarpState {
  x: number;
  y: number;
  scale: number;
  opacity: number;
}

export const LaunchIconWrapper: React.FC<LaunchIconWrapperProps> = ({
  children,
  onLaunchComplete,
  triggerPortalFlare,
  animationDurationMs = 300,
  style,
  className,
  onMouseEnter,
  onMouseLeave,
  warpTarget,
}) => {
  const [launching, setLaunching] = useState(false);
  const [warp, setWarp] = useState<WarpState | null>(null);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const particleRef = useRef<HTMLDivElement | null>(null);
  const onLaunchCompleteRef = useRef(onLaunchComplete);

  useEffect(() => {
    onLaunchCompleteRef.current = onLaunchComplete;
  }, [onLaunchComplete]);

  //
  // 🔥 Finish animation
  //
  useEffect(() => {
    if (!launching) return;

    const totalDuration = animationDurationMs + 80;

    const timeout = setTimeout(() => {
      onLaunchCompleteRef.current();
      setLaunching(false);
      setWarp(null);
    }, totalDuration);

    return () => {
      clearTimeout(timeout);
    };
  }, [launching, animationDurationMs]);

  //
  // 🔥 Sync warp FX to CSS custom properties
  //
  useEffect(() => {
    if (particleRef.current && warp) {
      particleRef.current.style.setProperty("--warp-x", `${warp.x}px`);
      particleRef.current.style.setProperty("--warp-y", `${warp.y}px`);
      particleRef.current.style.setProperty(
        "--warp-scale",
        warp.scale.toString()
      );
      particleRef.current.style.setProperty(
        "--warp-opacity",
        warp.opacity.toString()
      );
    }
  }, [warp]);

  //
  // 🔥 Apply external inline positioning (size/XY) from SphereImageGrid
  //
  useEffect(() => {
    if (wrapperRef.current && style) {
      for (const [key, val] of Object.entries(style)) {
        wrapperRef.current.style.setProperty(key, val as string);
      }
    }
  }, [style]);

  //
  // 🔥 Icon click → warp to portal center
  //
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (launching) return;

    if (triggerPortalFlare) triggerPortalFlare();

    const rect = wrapperRef.current?.getBoundingClientRect();
    if (rect) {
      const startX = rect.left + rect.width / 2;
      const startY = rect.top + rect.height / 2;

      // Use real portal center if provided
      const endX = warpTarget?.x ?? window.innerWidth / 2;
      const endY = warpTarget?.y ?? window.innerHeight / 2;

      // start particle at the icon
      setWarp({
        x: startX,
        y: startY,
        scale: 0.8,
        opacity: 1,
      });

      // next frame → animate to portal center
      requestAnimationFrame(() => {
        setWarp({
          x: endX,
          y: endY,
          scale: 0.3,
          opacity: 0,
        });
      });
    }

    setLaunching(true);
  };

  return (
    <>
      {/* particle that shoots into the portal */}
      {warp &&
        createPortal(
          <div ref={particleRef} className="launch-warp-particle" />,
          document.body
        )}

      <div
        ref={wrapperRef}
        className={
          "launch-icon-wrapper" +
          (launching ? " launch-icon-wrapper--launching" : "") +
          (className ? ` ${className}` : "")
        }
        onClick={handleClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <div className="launch-icon-inner">{children}</div>
      </div>
    </>
  );
};