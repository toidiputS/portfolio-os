import React, { lazy } from 'react';
import { AppId, BuiltInAppId, AppDefinition, ProjectFolder } from './types';
import { MessageCircle, FileText, Settings, Store, Terminal, Mail, Folder, FolderOpen } from 'lucide-react';

// --- Custom Icons for Games ---
// Fix: Rewrote custom icon components using React.createElement to be valid in a .ts file.
const MinesweeperIcon = ({ className }: { className?: string }) => (
  React.createElement('svg', {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className: className
  },
    React.createElement('path', { d: "M14 22s-1-2-4-2-4 2-4 2M4 9a7.44 7.44 0 0 1 4-2.43M4 9h0a3.5 3.5 0 0 0 0 7c.46 0 .9-.06 1.32-.18" }),
    React.createElement('path', { d: "M19.32 13.82c.42.12.86.18 1.32.18a3.5 3.5 0 0 0 0-7c-.85 0-1.64.25-2.29.68" }),
    React.createElement('path', { d: "M20 9c-1.3-4.3-5.3-7.43-10-7.43S1.3 4.7 0 9" }),
    React.createElement('path', { d: "M12 2a1 1 0 0 1 1 1v2a1 1 0 0 1-2 0V3a1 1 0 0 1 1-1Z" }),
    React.createElement('path', { d: "M12 11.5a2.5 2.5 0 0 1 0 5 2.5 2.5 0 0 1 0-5Z" })
  )
);

const SolitaireIcon = ({ className }: { className?: string }) => (
  React.createElement('svg', {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className: className
  },
    React.createElement('path', { d: "M20 9.69a3.07 3.07 0 0 0-5.82 1.44 3.07 3.07 0 0 0-5.82 1.44 3.07 3.07 0 0 0-5.82 1.44c0 1.69 2.61 3.06 5.82 3.06s5.82-1.37 5.82-3.06a3.07 3.07 0 0 0-5.82-1.44 3.07 3.07 0 0 0-5.82-1.44" }),
    React.createElement('path', { d: "M20 6.1a3.07 3.07 0 0 0-5.82 1.44 3.07 3.07 0 0 0-5.82 1.44A3.07 3.07 0 0 0 2.54 7.54" }),
    React.createElement('path', { d: "m7.66 16.51 1.08-2.7a2.16 2.16 0 0 0-2.8-2.8L3.24 12.09" }),
    React.createElement('path', { d: "m16.34 16.51-1.08-2.7a2.16 2.16 0 0 1 2.8-2.8l2.7 1.08" })
  )
);

const SnakeIcon = ({ className }: { className?: string }) => (
  React.createElement('svg', {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className: className
  },
    React.createElement('path', { d: "M12 12H12" }),
    React.createElement('path', { d: "M16 8H16" }),
    React.createElement('path', { d: "M12 16H12" }),
    React.createElement('path', { d: "M12 8H12" }),
    React.createElement('path', { d: "M8 12H8" }),
    React.createElement('path', { d: "M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2" }),
    React.createElement('path', { d: "M18 12c0 3.314-2.686 6-6 6s-6-2.686-6-6 2.686-6 6-6" })
  )
);


export const APPS_CONFIG: Record<BuiltInAppId, AppDefinition> = {
  geminiChat: {
    id: 'geminiChat',
    name: 'Gemini Chat',
    icon: MessageCircle,
    component: lazy(() => import('./apps/GeminiChat')),
    description: "Chat with Google's powerful Gemini AI models.",
  },
  terminal: {
    id: 'terminal',
    name: 'Terminal',
    icon: Terminal,
    component: lazy(() => import('./apps/Terminal')),
    description: "Access the command-line interface.",
  },
  contact: {
    id: 'contact',
    name: 'Contact Me',
    icon: Mail,
    component: lazy(() => import('./apps/Contact')),
    description: "Send me a message.",
  },
  markdownEditor: {
    id: 'markdownEditor',
    name: 'Markdown Editor',
    icon: FileText,
    component: lazy(() => import('./apps/MarkdownEditor')),
    description: 'A simple, persistent markdown notes application.',
  },
  settings: {
    id: 'settings',
    name: 'Settings',
    icon: Settings,
    component: lazy(() => import('./apps/Settings')),
    description: 'Personalize your desktop environment.',
  },
  appStore: {
    id: 'appStore',
    name: 'App Store',
    icon: Store,
    component: lazy(() => import('./apps/AppStore')),
    description: 'Discover and launch applications.',
  },
  minesweeper: {
    id: 'minesweeper',
    name: 'Minesweeper',
    icon: MinesweeperIcon,
    component: lazy(() => import('./apps/Minesweeper')),
    description: 'The classic logic puzzle game. Avoid the mines!',
  },
  solitaire: {
    id: 'solitaire',
    name: 'Solitaire',
    icon: SolitaireIcon,
    component: lazy(() => import('./apps/Solitaire')),
    description: 'The timeless Klondike Solitaire card game.',
  },
  snake: {
    id: 'snake',
    name: 'Snake',
    icon: SnakeIcon,
    component: lazy(() => import('./apps/Snake')),
    description: 'The classic arcade game. Eat and grow!',
  },
  fileManager: {
    id: 'fileManager',
    name: 'File Manager',
    icon: Folder,
    component: lazy(() => import('./apps/FileManager')),
    description: 'Browse files and manage project folders.',
  }
};

export const APPS = Object.values(APPS_CONFIG);

/**
 * Get all apps including dynamic folder apps
 */
export const getAllApps = (projectFolders: ProjectFolder[]): AppDefinition[] => {
  const builtInApps = Object.values(APPS_CONFIG);

  const folderApps: AppDefinition[] = projectFolders.map(folder => ({
    id: folder.id as AppId,
    name: folder.name,
    icon: FolderOpen,
    component: lazy(() => import('./apps/FolderView')),
    description: `Project: ${folder.path}`,
    isCustom: true,
  }));

  return [...builtInApps, ...folderApps];
};