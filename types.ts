import {
  AppId,
  BuiltInAppId,
  AppDefinition,
  ChatMessage,
  ChatSession,
  GeminiModel,
  GroundingChunk,
  Theme,
  WindowInstance,
  VirtualFile,
  VirtualFileType,
  ProjectFolder,
} from "./src/types";

export type {
  AppId,
  BuiltInAppId,
  AppDefinition,
  ChatMessage,
  ChatSession,
  GeminiModel,
  GroundingChunk,
  Theme,
  WindowInstance,
  VirtualFile,
  VirtualFileType,
  ProjectFolder,
};

export interface KernelState {
  windows: WindowInstance[];
  activeWindowId: string | null;
  nextZIndex: number;
  wallpaper: string;
  isStartMenuOpen: boolean;

  gemini: {
    model: GeminiModel;
    sessions: Record<string, ChatSession>;
    currentSessionId: string | null;
    isLoading: boolean;
    useSmartContext: boolean;
    useGrounding: boolean;
  };

  hasWelcomed: boolean;
  collectedEmails: string[];
  isSidebarOpen: boolean;
  isMatrixEffectActive: boolean;
  hasNewMessage: boolean;
  theme: Theme;
  initialGreetingSpoken: boolean;
  micPermissionGranted: boolean;
  currentPath: string; // Current directory in virtual filesystem
  projectFolders: ProjectFolder[]; // User's project folder bookmarks

  setInitialGreetingSpoken: (status: boolean) => void;
  setMicPermissionGranted: (status: boolean) => void;

  openWindow: (appId: AppId, size?: { width: number; height: number }, metadata?: any) => void;
  closeWindow: (id: string) => void;
  closeWindowByAppId: (appId: AppId) => void;
  focusWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  snapWindow: (
    id: string,
    snapState:
      | "none"
      | "maximized"
      | "topLeft"
      | "topRight"
      | "bottomLeft"
      | "bottomRight"
      | "left"
      | "right"
  ) => void;
  updateWindowPosition: (
    id: string,
    position: { x: number; y: number }
  ) => void;
  updateWindowSize: (
    id: string,
    size: { width: number; height: number }
  ) => void;

  setWallpaper: (wallpaperUrl: string) => void;
  toggleStartMenu: () => void;
  closeStartMenu: () => void;

  startNewChat: () => void;
  selectChatSession: (sessionId: string) => void;
  addMessageToSession: (sessionId: string, message: ChatMessage) => void;
  setGeminiLoading: (isLoading: boolean) => void;
  setGeminiModel: (model: GeminiModel) => void;
  toggleSmartContext: () => void;
  toggleGrounding: () => void;
  deleteChatSession: (sessionId: string) => void;
  updateSessionTitle: (sessionId: string, title: string) => void;
  addEmail: (email: string) => void;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  toggleMatrixEffect: (status: boolean) => void;
  setHasNewMessage: (status: boolean) => void;
  toggleTheme: () => void;
  setHasWelcomed: (status: boolean) => void;

  // Project folder actions
  addProjectFolder: (folder: Omit<ProjectFolder, 'id' | 'createdAt'>) => void;
  removeProjectFolder: (id: string) => void;
  updateProjectFolder: (id: string, updates: Partial<ProjectFolder>) => void;

  // Virtual filesystem actions
  navigateToPath: (path: string) => void;
  openFile: (fileId: string) => void;
}
