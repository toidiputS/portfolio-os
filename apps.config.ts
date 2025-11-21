import React, { lazy } from 'react';
import { AppId, BuiltInAppId, AppDefinition, ProjectFolder } from './types';
import { MessageCircle, FileText, Settings, Store, Terminal, Mail, Folder, FolderOpen } from 'lucide-react';

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
  fileManager: {
    id: 'fileManager',
    name: 'File Manager',
    icon: Folder,
    component: lazy(() => import('./apps/FileManager')),
    description: 'Browse files and manage project folders.',
  },
  fileViewer: {
    id: 'fileViewer',
    name: 'File Viewer',
    icon: FileText,
    component: lazy(() => import('./apps/FileViewer')),
    description: 'View file contents.',
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