// components/SphereImageGrid.tsx
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { LaunchIconWrapper } from "./LaunchIconWrapper";
import "./SphereImageGrid.css";

type AppIconComponent = React.ComponentType<{ className?: string }>;

interface AppDefinition {
  id: string;
  title?: string;
  icon?: AppIconComponent;
}

export interface SphereImageGridProps {
  apps?: AppDefinition[];
  onAppClick?: (appId: string) => void;
  containerSize?: number;
  sphereRadius?: number;
  dragSensitivity?: number;
  momentumDecay?: number;
  maxRotationSpeed?: number;
  baseImageScale?: number;
  perspective?: number;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  className?: string;
}

interface Position3D {
  x: number;
  y: number;
  z: number;
}

interface SphericalPosition {
  theta: number;
  phi: number;
  radius: number;
}

interface WorldPosition extends Position3D {
  scale: number;
  zIndex: number;
  isVisible: boolean;
  fadeOpacity: number;
  originalIndex: number;
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

const SPHERE_MATH = {
  degreesToRadians: (degrees: number): number => degrees * (Math.PI / 180),
  normalizeAngle: (angle: number): number => {
    while (angle > 180) angle -= 360;
    while (angle < -180) angle += 360;
    return angle;
  },
};

const SphereImageGrid: React.FC<SphereImageGridProps> = ({
  apps = [],
  onAppClick,
  containerSize = 500,
  sphereRadius = 220,
  dragSensitivity = 0.5,
  momentumDecay = 0.95,
  maxRotationSpeed = 5,
  baseImageScale = 0.14,
  perspective = 1000,
  autoRotate = false,
  autoRotateSpeed = 0.3,
  className = "",
}) => {
  const [isFlareActive, setIsFlareActive] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [rotation, setRotation] = useState<RotationState>({
    x: -1,
    y: 0,
    z: 0,
  });
  const [velocity, setVelocity] = useState<VelocityState>({ x: 0, y: 0 });
  const [imagePositions, setImagePositions] = useState<SphericalPosition[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const lastMousePos = useRef<MousePosition>({ x: 0, y: 0 });
  const animationFrame = useRef<number | null>(null);

  const flarePortal = () => {
    setIsFlareActive(true);
    setTimeout(() => setIsFlareActive(false), 350);
  };

  const sphereImageGridClass =
    "sphere-image-grid" + (isFlareActive ? " sphere-image-grid--flare" : "");

  const actualSphereRadius = sphereRadius || containerSize * 0.5;
  const baseImageSize = containerSize * baseImageScale;

  const generateSpherePositions = useCallback((): SphericalPosition[] => {
    const positions: SphericalPosition[] = [];
    const count = apps.length;
    if (count === 0) return positions;

    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    const angleIncrement = (2 * Math.PI) / goldenRatio;

    for (let i = 0; i < count; i++) {
      const t = i / count;
      const inclination = Math.acos(1 - 2 * t);
      const azimuth = angleIncrement * i;

      let phi = (inclination * 180) / Math.PI;
      let theta = (azimuth * 180) / Math.PI;

      const poleBonus = Math.pow(Math.abs(phi - 90) / 90, 0.6) * 35;
      if (phi < 90) {
        phi = Math.max(5, phi - poleBonus);
      } else {
        phi = Math.min(175, phi + poleBonus);
      }

      phi = 15 + (phi / 180) * 150;
      const randomOffset = (Math.random() - 0.5) * 20;
      theta = (theta + randomOffset) % 360;
      phi = Math.max(0, Math.min(180, phi + (Math.random() - 0.5) * 10));

      positions.push({
        theta,
        phi,
        radius: actualSphereRadius,
      });
    }

    return positions;
  }, [apps.length, actualSphereRadius]);

  const calculateWorldPositions = useCallback(
    (): WorldPosition[] => {
      const positions = imagePositions.map((pos, index) => {
        const thetaRad = SPHERE_MATH.degreesToRadians(pos.theta);
        const phiRad = SPHERE_MATH.degreesToRadians(pos.phi);
        const rotXRad = SPHERE_MATH.degreesToRadians(rotation.x);
        const rotYRad = SPHERE_MATH.degreesToRadians(rotation.y);

        let x = pos.radius * Math.sin(phiRad) * Math.cos(thetaRad);
        let y = pos.radius * Math.cos(phiRad);
        let z = pos.radius * Math.sin(phiRad) * Math.sin(thetaRad);

        const x1 = x * Math.cos(rotYRad) + z * Math.sin(rotYRad);
        const z1 = -x * Math.sin(rotYRad) + z * Math.cos(rotYRad);
        x = x1;
        z = z1;

        const y2 = y * Math.cos(rotXRad) - z * Math.sin(rotXRad);
        const z2 = y * Math.sin(rotXRad) + z * Math.cos(rotXRad);
        y = y2;
        z = z2;

        const fadeZoneStart = -10;
        const fadeZoneEnd = -30;
        const isVisible = z > fadeZoneEnd;

        let fadeOpacity = 1;
        if (z <= fadeZoneStart) {
          fadeOpacity = Math.max(
            0,
            (z - fadeZoneEnd) / (fadeZoneStart - fadeZoneEnd)
          );
        }

        const distanceFromCenter = Math.sqrt(x * x + y * y);
        const maxDistance = actualSphereRadius;
        const distanceRatio = Math.min(distanceFromCenter / maxDistance, 1);

        const distancePenalty = 0.7;
        const centerScale = Math.max(0.3, 1 - distanceRatio * distancePenalty);

        const depthScale =
          (z + actualSphereRadius) / (2 * actualSphereRadius);
        const scale = centerScale * Math.max(0.5, 0.8 + depthScale * 0.3);

        return {
          x,
          y,
          z,
          scale,
          zIndex: Math.round(1000 + z),
          isVisible,
          fadeOpacity,
          originalIndex: index,
        };
      });

      return positions;
    },
    [imagePositions, rotation, actualSphereRadius, baseImageSize]
  );

  const clampRotationSpeed = useCallback(
    (speed: number): number =>
      Math.max(-maxRotationSpeed, Math.min(maxRotationSpeed, speed)),
    [maxRotationSpeed]
  );

  const updateMomentum = useCallback(() => {
    if (isDragging) return;

    setVelocity((prev) => {
      const newVelocity = {
        x: prev.x * momentumDecay,
        y: prev.y * momentumDecay,
      };

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

      if (autoRotate) {
        newY += autoRotateSpeed;
      }

      newY += clampRotationSpeed(velocity.y);

      return {
        x: SPHERE_MATH.normalizeAngle(
          prev.x + clampRotationSpeed(velocity.x)
        ),
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

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(true);
      setVelocity({ x: 0, y: 0 });
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    },
    []
  );

  const handleMouseMove = useCallback<
    React.MouseEventHandler<HTMLDivElement>
  >(
    (e) => {
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

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      e.preventDefault();
      const touch = e.touches[0];
      setIsDragging(true);
      setVelocity({ x: 0, y: 0 });
      lastMousePos.current = { x: touch.clientX, y: touch.clientY };
    },
    []
  );

  const handleTouchMove = useCallback<
    React.TouchEventHandler<HTMLDivElement>
  >(
    (e) => {
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

  useEffect(() => {
    setImagePositions(generateSpherePositions());
  }, [generateSpherePositions]);

  useEffect(() => {
    const animate = () => {
      updateMomentum();
      animationFrame.current = requestAnimationFrame(animate);
    };

    animationFrame.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrame.current != null) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [updateMomentum]);

  const worldPositions = calculateWorldPositions();

  return (
    <div
      className={`relative ${sphereImageGridClass} ${className}`}
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        width: containerSize,
        height: containerSize,
        perspective,
      }}
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseLeave={handleMouseUp}
    >
      {worldPositions.map((worldPos, index) => {
        const app = apps[index];
        if (!app || !worldPos.isVisible) return null;

        const imageSize = baseImageSize * worldPos.scale;
        const adjustedX = worldPos.x - imageSize / 2;
        const adjustedY = worldPos.y - imageSize / 2;

        return (
          <LaunchIconWrapper
            key={app.id}
            onLaunchComplete={() => onAppClick?.(app.id)}
            triggerPortalFlare={flarePortal}
            style={{
              position: "absolute",
              left: adjustedX,
              top: adjustedY,
              zIndex: worldPos.zIndex,
              opacity: worldPos.fadeOpacity,
              transform: `translateZ(${worldPos.z}px)`,
              cursor: "pointer",
              width: imageSize,
              height: imageSize,
            }}
          >
            {app.icon && <app.icon className="h-full w-full" />}
          </LaunchIconWrapper>
        );
      })}
    </div>
  );
};

export default SphereImageGrid;
