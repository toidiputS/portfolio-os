// Built-in app IDs
export type BuiltInAppId =
  | "geminiChat"
  | "terminal"
  | "contact"
  | "markdownEditor"
  | "settings"
  | "appStore"
  | "minesweeper"
  | "solitaire"
  | "snake"
  | "fileManager";

// Allow dynamic folder IDs like "folder:my-project"
export type AppId = BuiltInAppId | `folder:${string}`;

// Project folder bookmark
export interface ProjectFolder {
  id: string; // e.g., "folder:my-portfolio"
  name: string; // Display name
  path: string; // Folder path or description
  color?: string; // Custom folder color
  createdAt: string;
}

// Virtual portfolio filesystem
export type VirtualFileType =
  | 'folder'
  | 'markdown'    // .md files - project READMEs
  | 'link'        // .link files - external URLs
  | 'image'       // .png, .jpg - screenshots
  | 'pdf'         // .pdf - resumes, docs
  | 'text';       // .txt - plain text

export interface VirtualFile {
  id: string;
  name: string;           // "README.md"
  type: VirtualFileType;
  path: string;           // "/projects/portfolio-os/README.md"
  parentPath: string;     // "/projects/portfolio-os"

  content?: {
    markdown?: string;
    url?: string;
    imageUrl?: string;
    pdfUrl?: string;
    text?: string;
  };

  size?: string;          // "2.4 KB" (for display)
  createdAt: string;
  modifiedAt: string;
  icon?: string;
  color?: string;         // For folders
}

export interface AppDefinition {
  id: AppId;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  component: React.LazyExoticComponent<React.ComponentType<any>>;
  description: string;
  isCustom?: boolean; // Flag for user-created folder shortcuts
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
