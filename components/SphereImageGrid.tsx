import React, { useState, useEffect, useRef, useCallback } from "react";
import { LaunchIconWrapper } from "../src/components/LaunchIconWrapper";
import { AppDefinition, AppId } from "../types"; // Import AppDefinition and AppId
import "./SphereImageGrid.css";

/**
 * SphereImageGrid - Interactive 3D Image Sphere Component
 *
 * A React TypeScript component that displays images arranged in a 3D sphere layout.
 * Images are distributed using Fibonacci sphere distribution for optimal coverage.
 * Supports drag-to-rotate, momentum physics, auto-rotation, and modal image viewing.
 *
 * Features:
 * - 3D sphere layout with Fibonacci distribution for even image placement
 * - Smooth drag-to-rotate interaction with momentum physics
 * - Auto-rotation capability with configurable speed
 * - Dynamic scaling based on position and visibility
 * - Collision detection to prevent image overlap
 * - Modal view for enlarged image display
 * - Touch support for mobile devices
 * - Customizable appearance and behavior
 * - Performance optimized with proper z-indexing and visibility culling
 *
 * Usage:
 * ```tsx
 * <SphereImageGrid
 *   images={imageArray}
 *   containerSize={600}
 *   sphereRadius={200}
 *   autoRotate={true}
 *   dragSensitivity={0.8}
 * />
 * ```
 */

// ==========================================
// TYPES & INTERFACES
// ==========================================

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface SphericalPosition {
  theta: number; // Azimuth angle in degrees
  phi: number; // Polar angle in degrees
  radius: number; // Distance from center
}

export interface WorldPosition extends Position3D {
  scale: number;
  zIndex: number;
  isVisible: boolean;
  fadeOpacity: number;
  originalIndex: number;
}

// ImageData is no longer needed

export interface SphereImageGridProps {
  apps?: AppDefinition[]; // Changed from images to apps
  onAppClick?: (appId: AppId) => void; // Changed to use AppId
  containerSize?: number;
  sphereRadius?: number;
  dragSensitivity?: number;
  momentumDecay?: number;
  maxRotationSpeed?: number;
  baseImageScale?: number;
  hoverScale?: number;
  perspective?: number;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  className?: string;
}

interface RotationState {
  x: number;
  y: number;
  z: number;
}

interface VelocityState {
  x: number;
  y: number;
}

interface MousePosition {
  x: number;
  y: number;
}

// ==========================================
// CONSTANTS & CONFIGURATION
// ==========================================

const SPHERE_MATH = {
  degreesToRadians: (degrees: number): number => degrees * (Math.PI / 180),
  radiansToDegrees: (radians: number): number => radians * (180 / Math.PI),

  sphericalToCartesian: (
    radius: number,
    theta: number,
    phi: number
  ): Position3D => ({
    x: radius * Math.sin(phi) * Math.cos(theta),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.sin(theta),
  }),

  calculateDistance: (
    pos: Position3D,
    center: Position3D = { x: 0, y: 0, z: 0 }
  ): number => {
    const dx = pos.x - center.x;
    const dy = pos.y - center.y;
    const dz = pos.z - center.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  },

  normalizeAngle: (angle: number): number => {
    while (angle > 180) angle -= 360;
    while (angle < -180) angle += 360;
    return angle;
  },
};

// ==========================================
// MAIN COMPONENT
// ==========================================

const SphereImageGrid: React.FC<SphereImageGridProps> = ({
  apps = [], // Changed from images to apps
  onAppClick,
  containerSize = 400,
  sphereRadius = 200,
  dragSensitivity = 0.5,
  momentumDecay = 0.95,
  maxRotationSpeed = 5,
  baseImageScale = 0.12,
  hoverScale = 1.2,
  perspective = 1000,
  autoRotate = false,
  autoRotateSpeed = 0.3,
  className = "",
}) => {
  // ==========================================
  // STATE & REFS
  // ==========================================

  const [isFlareActive, setIsFlareActive] = useState(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [rotation, setRotation] = useState<RotationState>({
    x: 15,
    y: 15,
    z: 0,
  });
  const [velocity, setVelocity] = useState<VelocityState>({ x: 0, y: 0 });
  // selectedImage state is no longer needed
  const [imagePositions, setImagePositions] = useState<SphericalPosition[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const lastMousePos = useRef<MousePosition>({ x: 0, y: 0 });
  const animationFrame = useRef<number | null>(null);

  const flarePortal = () => {
    setIsFlareActive(true);
    setTimeout(() => setIsFlareActive(false), 350);
  };

  // ==========================================
  // COMPUTED VALUES
  // ==========================================

  const actualSphereRadius = sphereRadius || containerSize * 0.5;
  const baseImageSize = containerSize * baseImageScale;

  // ==========================================
  // UTILITY FUNCTIONS
  // ==========================================

  const generateSpherePositions = useCallback((): SphericalPosition[] => {
    const positions: SphericalPosition[] = [];
    const imageCount = apps.length; // Use apps length

    // Use Fibonacci sphere distribution for even coverage
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    const angleIncrement = (2 * Math.PI) / goldenRatio;

    for (let i = 0; i < imageCount; i++) {
      // Fibonacci sphere distribution
      const t = i / imageCount;
      const inclination = Math.acos(1 - 2 * t);
      const azimuth = angleIncrement * i;

      // Convert to degrees and focus on front hemisphere
      let phi = inclination * (180 / Math.PI);
      let theta = (azimuth * (180 / Math.PI)) % 360;

      // Better pole coverage - reach poles but avoid extreme mathematical issues
      const poleBonus = Math.pow(Math.abs(phi - 90) / 90, 0.6) * 35; // Moderate boost toward poles
      if (phi < 90) {
        phi = Math.max(5, phi - poleBonus); // Reach closer to top pole (15° minimum)
      } else {
        phi = Math.min(175, phi + poleBonus); // Reach closer to bottom pole (165° maximum)
      }

      // Map to fuller vertical range - covers poles but avoids extremes
      phi = 15 + (phi / 180) * 150; // Map to 15-165 degrees for pole coverage with stability

      // Add slight randomization to prevent perfect patterns
      const randomOffset = (Math.random() - 0.5) * 20;
      theta = (theta + randomOffset) % 360;
      phi = Math.max(0, Math.min(180, phi + (Math.random() - 0.5) * 10));

      positions.push({
        theta: theta,
        phi: phi,
        radius: actualSphereRadius,
      });
    }

    return positions;
  }, [apps.length, actualSphereRadius]);

  const calculateWorldPositions = useCallback((): WorldPosition[] => {
    const positions = imagePositions.map((pos, index) => {
      // Apply rotation using proper 3D rotation matrices
      const thetaRad = SPHERE_MATH.degreesToRadians(pos.theta);
      const phiRad = SPHERE_MATH.degreesToRadians(pos.phi);
      const rotXRad = SPHERE_MATH.degreesToRadians(rotation.x);
      const rotYRad = SPHERE_MATH.degreesToRadians(rotation.y);

      // Initial position on sphere
      let x = pos.radius * Math.sin(phiRad) * Math.cos(thetaRad);
      let y = pos.radius * Math.cos(phiRad);
      let z = pos.radius * Math.sin(phiRad) * Math.sin(thetaRad);

      // Apply Y-axis rotation (horizontal drag)
      const x1 = x * Math.cos(rotYRad) + z * Math.sin(rotYRad);
      const z1 = -x * Math.sin(rotYRad) + z * Math.cos(rotYRad);
      x = x1;
      z = z1;

      // Apply X-axis rotation (vertical drag)
      const y2 = y * Math.cos(rotXRad) - z * Math.sin(rotXRad);
      const z2 = y * Math.sin(rotXRad) + z * Math.cos(rotXRad);
      y = y2;
      z = z2;

      const worldPos: Position3D = { x, y, z };

      // Calculate visibility with smooth fade zones
      const fadeZoneStart = -10; // Start fading out
      const fadeZoneEnd = -30; // Completely hidden
      const isVisible = worldPos.z > fadeZoneEnd;

      // Calculate fade opacity based on Z position
      let fadeOpacity = 1;
      if (worldPos.z <= fadeZoneStart) {
        // Linear fade from 1 to 0 as Z goes from fadeZoneStart to fadeZoneEnd
        fadeOpacity = Math.max(
          0,
          (worldPos.z - fadeZoneEnd) / (fadeZoneStart - fadeZoneEnd)
        );
      }

      // Check if this image originated from a pole position
      const isPoleImage = pos.phi < 30 || pos.phi > 150; // Images from extreme angles

      // Calculate distance from center for scaling (in 2D screen space)
      const distanceFromCenter = Math.sqrt(
        worldPos.x * worldPos.x + worldPos.y * worldPos.y
      );
      const maxDistance = actualSphereRadius;
      const distanceRatio = Math.min(distanceFromCenter / maxDistance, 1);

      // Scale based on distance from center - be more forgiving for pole images
      const distancePenalty = isPoleImage ? 0.4 : 0.7; // Less penalty for pole images
      const centerScale = Math.max(0.3, 1 - distanceRatio * distancePenalty);

      // Also consider Z-depth for additional scaling
      const depthScale =
        (worldPos.z + actualSphereRadius) / (2 * actualSphereRadius);
      const scale = centerScale * Math.max(0.5, 0.8 + depthScale * 0.3);

      return {
        ...worldPos,
        scale,
        zIndex: Math.round(1000 + worldPos.z),
        isVisible,
        fadeOpacity,
        originalIndex: index,
      };
    });

    // Apply collision detection to prevent overlaps
    const adjustedPositions = [...positions];

    for (let i = 0; i < adjustedPositions.length; i++) {
      const pos = adjustedPositions[i];
      if (!pos.isVisible) continue;

      let adjustedScale = pos.scale;
      const imageSize = baseImageSize * adjustedScale;

      // Check for overlaps with other visible images
      for (let j = 0; j < adjustedPositions.length; j++) {
        if (i === j) continue;

        const other = adjustedPositions[j];
        if (!other.isVisible) continue;

        const otherSize = baseImageSize * other.scale;

        // Calculate 2D distance between images on screen
        const dx = pos.x - other.x;
        const dy = pos.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Minimum distance to prevent overlap (with more generous padding)
        const minDistance = (imageSize + otherSize) / 2 + 25;

        if (distance < minDistance && distance > 0) {
          // More aggressive scale reduction to prevent overlap
          const overlap = minDistance - distance;
          const reductionFactor = Math.max(
            0.4,
            1 - (overlap / minDistance) * 0.6
          );
          adjustedScale = Math.min(
            adjustedScale,
            adjustedScale * reductionFactor
          );
        }
      }

      adjustedPositions[i] = {
        ...pos,
        scale: Math.max(0.25, adjustedScale), // Ensure minimum scale
      };
    }

    return adjustedPositions;
  }, [imagePositions, rotation, actualSphereRadius, baseImageSize]);

  const clampRotationSpeed = useCallback(
    (speed: number): number => {
      return Math.max(-maxRotationSpeed, Math.min(maxRotationSpeed, speed));
    },
    [maxRotationSpeed]
  );

  // ==========================================
  // PHYSICS & MOMENTUM
  // ==========================================

  const updateMomentum = useCallback(() => {
    if (isDragging) return;

    setVelocity((prev) => {
      const newVelocity = {
        x: prev.x * momentumDecay,
        y: prev.y * momentumDecay,
      };

      // Stop animation if velocity is too low and auto-rotate is off
      if (
        !autoRotate &&
        Math.abs(newVelocity.x) < 0.01 &&
        Math.abs(newVelocity.y) < 0.01
      ) {
        return { x: 0, y: 0 };
      }

      return newVelocity;
    });

    setRotation((prev) => {
      let newY = prev.y;

      // Add auto-rotation to Y axis (horizontal rotation)
      if (autoRotate) {
        newY += autoRotateSpeed;
      }

      // Add momentum-based rotation
      newY += clampRotationSpeed(velocity.y);

      return {
        x: SPHERE_MATH.normalizeAngle(prev.x + clampRotationSpeed(velocity.x)),
        y: SPHERE_MATH.normalizeAngle(newY),
        z: prev.z,
      };
    });
  }, [
    isDragging,
    momentumDecay,
    velocity,
    clampRotationSpeed,
    autoRotate,
    autoRotateSpeed,
  ]);

  // ==========================================
  // EVENT HANDLERS
  // ==========================================

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setVelocity({ x: 0, y: 0 });
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaX = e.clientX - lastMousePos.current.x;
      const deltaY = e.clientY - lastMousePos.current.y;

      const rotationDelta = {
        x: -deltaY * dragSensitivity,
        y: deltaX * dragSensitivity,
      };

      setRotation((prev) => ({
        x: SPHERE_MATH.normalizeAngle(
          prev.x + clampRotationSpeed(rotationDelta.x)
        ),
        y: SPHERE_MATH.normalizeAngle(
          prev.y + clampRotationSpeed(rotationDelta.y)
        ),
        z: prev.z,
      }));

      // Update velocity for momentum
      setVelocity({
        x: clampRotationSpeed(rotationDelta.x),
        y: clampRotationSpeed(rotationDelta.y),
      });

      lastMousePos.current = { x: e.clientX, y: e.clientY };
    },
    [isDragging, dragSensitivity, clampRotationSpeed]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    setIsDragging(true);
    setVelocity({ x: 0, y: 0 });
    lastMousePos.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging) return;
      e.preventDefault();

      const touch = e.touches[0];
      const deltaX = touch.clientX - lastMousePos.current.x;
      const deltaY = touch.clientY - lastMousePos.current.y;

      const rotationDelta = {
        x: -deltaY * dragSensitivity,
        y: deltaX * dragSensitivity,
      };

      setRotation((prev) => ({
        x: SPHERE_MATH.normalizeAngle(
          prev.x + clampRotationSpeed(rotationDelta.x)
        ),
        y: SPHERE_MATH.normalizeAngle(
          prev.y + clampRotationSpeed(rotationDelta.y)
        ),
        z: prev.z,
      }));

      setVelocity({
        x: clampRotationSpeed(rotationDelta.x),
        y: clampRotationSpeed(rotationDelta.y),
      });

      lastMousePos.current = { x: touch.clientX, y: touch.clientY };
    },
    [isDragging, dragSensitivity, clampRotationSpeed]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // ==========================================
  // EFFECTS & LIFECYCLE
  // ==========================================

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setImagePositions(generateSpherePositions());
  }, [generateSpherePositions]);

  useEffect(() => {
    const animate = () => {
      updateMomentum();
      animationFrame.current = requestAnimationFrame(animate);
    };

    if (isMounted) {
      animationFrame.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [isMounted, updateMomentum]);

  useEffect(() => {
    if (!isMounted) return;

    const container = containerRef.current;
    if (!container) return;

    // Mouse events
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    // Touch events
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [
    isMounted,
    handleMouseMove,
    handleMouseUp,
    handleTouchMove,
    handleTouchEnd,
  ]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.style.setProperty("--container-size", `${containerSize}px`);
      container.style.setProperty("--perspective", `${perspective}px`);
    }
  }, [containerSize, perspective]);

  // ==========================================
  // RENDER HELPERS
  // ==========================================

  // Calculate world positions once per render
  const worldPositions = calculateWorldPositions();

  const renderAppNode = useCallback(
    (app: AppDefinition, index: number) => {
      const position = worldPositions[index];

      if (!position || !position.isVisible) return null;

      const imageSize = baseImageSize * position.scale;
      const isHovered = hoveredIndex === index;
      const finalScale = isHovered ? Math.min(1.2, 1.2 / position.scale) : 1;
      const IconComponent = app.icon;

      const appNodeRef = (node: HTMLDivElement) => {
        if (node) {
          node.style.setProperty("--node-width", `${imageSize}px`);
          node.style.setProperty("--node-height", `${imageSize + 40}px`);
          node.style.setProperty("--node-opacity", `${position.fadeOpacity}`);
          node.style.setProperty(
            "--node-transform",
            `translateX(${window.innerWidth / 2 + position.x}px) translateY(${
              window.innerHeight / 2 + position.y
            }px) translate(-50%, -50%) scale(${finalScale})`
          );
          node.style.setProperty("--node-z-index", `${position.zIndex}`);
          node.style.setProperty("--icon-size", `${imageSize}px`);
          node.style.setProperty(
            "--name-transform",
            `scale(${Math.min(1, 10 / app.name.length)})`
          );
        }
      };

      return (
        <LaunchIconWrapper
          key={app.id}
          onLaunchComplete={() => onAppClick?.(app.id)}
          triggerPortalFlare={() => {
            // Define flarePortal function here or call an existing one
            const portalRing = document.querySelector(".portal-ring");
            portalRing?.classList.toggle("portal-ring--active");
          }}
        >
          <div
            className="sphere-app-node"
            ref={appNodeRef}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            onClick={() => onAppClick?.(app.id)}
          >
            <div className="sphere-app-icon-container">
              <IconComponent className="sphere-app-icon" />
            </div>
            <p className="sphere-app-name">{app.name}</p>
          </div>
        </LaunchIconWrapper>
      );
    },
    [worldPositions, baseImageSize, containerSize, hoveredIndex, onAppClick]
  );

  // renderSpotlightModal is no longer needed

  // ==========================================
  // EARLY RETURNS
  // ==========================================

  if (!isMounted) {
    return (
      <div className="sphere-loader-container">
        <div className="sphere-loader-text">Loading...</div>
      </div>
    );
  }

  if (!apps.length) {
    return (
      <div className="sphere-no-apps-container">
        <div className="sphere-no-apps-text">
          <p>No apps provided</p>
          <p className="sphere-no-apps-subtext">Add apps to the apps prop</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN RENDER
  // ==========================================

  return (
    <>
      <div
        ref={containerRef}
        className={`sphere-image-grid-container ${
          isDragging ? "grabbing" : ""
        } ${className}`}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div className="sphere-image-grid-inner">
          {apps.map((app, index) => renderAppNode(app, index))}
        </div>
      </div>

      {/* renderSpotlightModal is no longer needed */}
    </>
  );
};

export default SphereImageGrid;
