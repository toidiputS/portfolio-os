import React from 'react';

export type AppId = 'geminiChat' | 'markdownEditor' | 'settings' | 'appStore' | 'terminal' | 'contact' | 'minesweeper' | 'solitaire' | 'snake';

export interface AppDefinition {
  id: AppId;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  component: React.ComponentType;
  description?: string;
}

export interface WindowInstance {
  id: string;
  appId: AppId;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  minimized: boolean;
  snapState: 'none' | 'maximized' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'left' | 'right';
  preSnapPosition?: { x: number; y: number };
  preSnapSize?: { width: number; height: number };
}

export interface GroundingChunk {
  web: {
    uri: string;
    title: string;
  };
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  groundingChunks?: GroundingChunk[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
}

export type GeminiModel = 'gemini-2.5-flash' | 'gemini-2.5-pro';



export interface GeminiState {
  model: GeminiModel;
  sessions: { [key: string]: ChatSession };
  currentSessionId: string | null;
  isLoading: boolean;
  useSmartContext: boolean;
  useGrounding: boolean;
}



export type Theme = 'dark' | 'light';

export interface KernelState {
  windows: WindowInstance[];
  activeWindowId: string | null;
  nextZIndex: number;
  wallpaper: string;
  isStartMenuOpen: boolean;
  gemini: GeminiState;
  
  hasWelcomed: boolean;
  collectedEmails: string[];
  isSidebarOpen: boolean;
  isMatrixEffectActive: boolean;
  hasNewMessage: boolean;
  theme: Theme;

  openWindow: (appId: AppId, size?: {width: number, height: number}) => void;
  closeWindow: (id: string) => void;
  closeWindowByAppId: (appId: AppId) => void;
  focusWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  snapWindow: (id: string, snapState: WindowInstance['snapState']) => void;
  updateWindowPosition: (id: string, position: { x: number; y: number }) => void;
  updateWindowSize: (id: string, size: { width: number; height: number }) => void;

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

  setHasWelcomed: (status: boolean) => void;
  addEmail: (email: string) => void;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  toggleMatrixEffect: (status: boolean) => void;
  setHasNewMessage: (status: boolean) => void;
  toggleTheme: () => void;
}
