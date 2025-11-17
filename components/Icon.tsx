import React from "react";
import { AppDefinition } from "../types";

interface IconProps {
  app: AppDefinition;
  onDoubleClick: () => void;
}

const Icon: React.FC<IconProps> = ({ app, onDoubleClick }) => {
  const IconComponent = app.icon;

  return (
    <button
      onDoubleClick={onDoubleClick}
      className="flex flex-col items-center p-2 rounded hover:bg-[hsl(var(--secondary-hsl))] w-24 h-24 text-center"
    >
      <IconComponent className="w-10 h-10 text-[hsl(var(--foreground-hsl))] mb-2" />
      <span className="text-[hsl(var(--foreground-hsl))] text-xs wrap-break-word leading-normal">
        {app.name}
      </span>
    </button>
  );
};

export default Icon;
