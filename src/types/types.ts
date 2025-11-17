export type AppId =
  | "geminiChat"
  | "terminal"
  | "contact"
  | "markdownEditor"
  | "settings"
  | "appStore"
  | "minesweeper"
  | "solitaire"
  | "snake";

export interface AppDefinition {
  id: AppId;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  component: React.LazyExoticComponent<React.ComponentType<any>>;
  description: string;
}

export interface WindowInstance {
  id: string;
  appId: AppId;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  minimized: boolean;
  snapState:
    | "none"
    | "maximized"
    | "topLeft"
    | "topRight"
    | "bottomLeft"
    | "bottomRight"
    | "left"
    | "right";
  preSnapPosition?: { x: number; y: number };
  preSnapSize?: { width: number; height: number };
}

export type GeminiModel =
  | "gemini-2.5-flash"
  | "gemini-2.5-pro"
  | "gemini-1.5-flash"
  | "gemini-1.5-pro";

export interface ChatMessage {
  role: "user" | "model";
  content: string;
  timestamp?: number;
  groundingChunks?: GroundingChunk[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export type Theme = "light" | "dark";
