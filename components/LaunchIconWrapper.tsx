// components/LaunchIconWrapper.tsx
import React, { useEffect, useRef, useState } from "react";
import "./PortalLaunchAnimations.css";

interface LaunchIconWrapperProps {
  children: React.ReactNode;          // your icon (svg etc.)
  onLaunchComplete: () => void;       // called after animation, open window
  triggerPortalFlare?: () => void;    // tells portal to flare
  animationDurationMs?: number;       // default 300ms
  style?: React.CSSProperties;        // external positioning + size
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
}) => {
  const [launching, setLaunching] = useState(false);
  const [warp, setWarp] = useState<WarpState | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!launching) return;

    const totalDuration = animationDurationMs + 80;

    const timeout = setTimeout(() => {
      onLaunchComplete();
      setLaunching(false);
      setWarp(null);
    }, totalDuration);

    return () => clearTimeout(timeout);
  }, [launching, animationDurationMs, onLaunchComplete]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (launching) return;

    if (triggerPortalFlare) {
      triggerPortalFlare();
    }

    const rect = wrapperRef.current?.getBoundingClientRect();
    if (rect) {
      const startX = rect.left + rect.width / 2;
      const startY = rect.top + rect.height / 2;

      const endX = window.innerWidth / 2;
      const endY = window.innerHeight / 2;

      // start particle at icon
      setWarp({
        x: startX,
        y: startY,
        scale: 0.8,
        opacity: 1,
      });

      // next frame: fly to center
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
      {warp && (
        <div
          className="launch-warp-particle"
          style={{
            transform: `translate3d(${warp.x}px, ${warp.y}px, 0) scale(${warp.scale})`,
            opacity: warp.opacity,
          }}
        />
      )}

      <div
        ref={wrapperRef}
        className={
          "launch-icon-wrapper" +
          (launching ? " launch-icon-wrapper--launching" : "")
        }
        style={style}
        onClick={handleClick}
      >
        <div className="launch-icon-inner">{children}</div>
      </div>
    </>
  );
};
