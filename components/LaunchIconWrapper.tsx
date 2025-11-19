// components/LaunchIconWrapper.tsx
import React, { useEffect, useRef, useState } from "react";
import "./PortalLaunchAnimations.css";

interface LaunchIconWrapperProps {
  children: React.ReactNode; // your icon (svg etc.)
  onLaunchComplete: () => void; // called after animation, open window
  triggerPortalFlare?: () => void; // tells portal to flare
  animationDurationMs?: number; // default 300ms
  style?: React.CSSProperties; // external positioning + size
  className?: string; // additional CSS classes
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
}) => {
  const [launching, setLaunching] = useState(false);
  const [warp, setWarp] = useState<WarpState | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const particleRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    if (wrapperRef.current && style) {
      Object.entries(style).forEach(([key, value]) => {
        wrapperRef.current!.style.setProperty(key, value as string);
      });
    }
  }, [style]);

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
      {warp && <div ref={particleRef} className="launch-warp-particle" />}

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
