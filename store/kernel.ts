
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import { AppId, ChatMessage, ChatSession, GeminiModel, KernelState, ProjectFolder, WindowInstance, Theme } from '../types';

const useKernelStore = create<KernelState>()(
  persist(
    (set, get) => ({
      windows: [],
      activeWindowId: null,
      nextZIndex: 100,
      wallpaper: 'assets/images/welcome.png',
      isStartMenuOpen: false,

      gemini: {
        model: 'gemini-2.5-flash',
        sessions: {},
        currentSessionId: null,
        isLoading: false,
        useSmartContext: true,
        useGrounding: false,
      },

      hasWelcomed: false,
      collectedEmails: [],
      isSidebarOpen: false,
      isMatrixEffectActive: false,
      hasNewMessage: false,
      theme: 'dark',
      initialGreetingSpoken: false,
      micPermissionGranted: false,
      projectFolders: [], // User's project folder bookmarks
      currentPath: '/', // Current directory in virtual filesystem

      openWindow: (appId, size = { width: 800, height: 600 }) => {
        const newWindow: WindowInstance = {
          id: nanoid(),
          appId,
          title: appId.charAt(0).toUpperCase() + appId.slice(1).replace(/([A-Z])/g, ' $1').trim(),
          position: { x: Math.random() * 200 + 50, y: Math.random() * 100 + 50 },
          size,
          zIndex: get().nextZIndex,
          minimized: false,
          snapState: 'none',
        };
        set(state => ({
          windows: [...state.windows, newWindow],
          nextZIndex: state.nextZIndex + 1,
          activeWindowId: newWindow.id,
          isStartMenuOpen: false,
          isSidebarOpen: false,
        }));
      },
      closeWindow: (id) => set(state => ({
        windows: state.windows.filter(w => w.id !== id),
      })),
      closeWindowByAppId: (appId) => {
        const windowToClose = get().windows
          .filter(w => w.appId === appId)
          .sort((a, b) => b.zIndex - a.zIndex)[0];

        if (windowToClose) {
          get().closeWindow(windowToClose.id);
        }
      },
      focusWindow: (id) => {
        const window = get().windows.find(w => w.id === id);
        if (window && window.zIndex !== get().nextZIndex - 1) {
          set(state => ({
            windows: state.windows.map(w => w.id === id ? { ...w, zIndex: state.nextZIndex, minimized: false } : w),
            nextZIndex: state.nextZIndex + 1,
            activeWindowId: id,
          }));
        } else if (window && window.minimized) {
          set(state => ({
            windows: state.windows.map(w => w.id === id ? { ...w, minimized: false } : w),
            activeWindowId: id,
          }));
        }
      },
      minimizeWindow: (id) => set(state => ({
        windows: state.windows.map(w => w.id === id ? { ...w, minimized: !w.minimized } : w),
        activeWindowId: id === state.activeWindowId ? null : state.activeWindowId,
      })),
      snapWindow: (id, snapState) => {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight - 48; // Account for taskbar

        set(state => {
          const windowIndex = state.windows.findIndex(w => w.id === id);
          if (windowIndex === -1) return state;

          const windows = [...state.windows];
          const currentWindow = { ...windows[windowIndex] };

          const isSnapping = snapState !== 'none';
          const wasSnapped = currentWindow.snapState !== 'none';

          if (isSnapping && !wasSnapped) {
            currentWindow.preSnapPosition = { ...currentWindow.position };
            currentWindow.preSnapSize = { ...currentWindow.size };
          }

          currentWindow.snapState = snapState;

          switch (snapState) {
            case 'maximized':
              currentWindow.position = { x: 0, y: 0 };
              currentWindow.size = { width: screenWidth, height: screenHeight };
              break;
            case 'topLeft':
              currentWindow.position = { x: 0, y: 0 };
              currentWindow.size = { width: Math.ceil(screenWidth / 2), height: Math.ceil(screenHeight / 2) };
              break;
            case 'topRight':
              currentWindow.position = { x: Math.floor(screenWidth / 2), y: 0 };
              currentWindow.size = { width: Math.floor(screenWidth / 2), height: Math.ceil(screenHeight / 2) };
              break;
            case 'bottomLeft':
              currentWindow.position = { x: 0, y: Math.floor(screenHeight / 2) };
              currentWindow.size = { width: Math.ceil(screenWidth / 2), height: Math.floor(screenHeight / 2) };
              break;
            case 'bottomRight':
              currentWindow.position = { x: Math.floor(screenWidth / 2), y: Math.floor(screenHeight / 2) };
              currentWindow.size = { width: Math.floor(screenWidth / 2), height: Math.floor(screenHeight / 2) };
              break;
            case 'left':
              currentWindow.position = { x: 0, y: 0 };
              currentWindow.size = { width: Math.ceil(screenWidth / 2), height: screenHeight };
              break;
            case 'right':
              currentWindow.position = { x: Math.floor(screenWidth / 2), y: 0 };
              currentWindow.size = { width: Math.floor(screenWidth / 2), height: screenHeight };
              break;
            case 'none':
              if (currentWindow.preSnapPosition && currentWindow.preSnapSize) {
                currentWindow.position = { ...currentWindow.preSnapPosition };
                currentWindow.size = { ...currentWindow.preSnapSize };
              }
              break;
          }

          windows[windowIndex] = currentWindow;
          return { windows };
        });
      },
      updateWindowPosition: (id, position) => set(state => ({
        windows: state.windows.map(w => w.id === id ? { ...w, position } : w),
      })),
      updateWindowSize: (id, size) => set(state => ({
        windows: state.windows.map(w => w.id === id ? { ...w, size } : w),
      })),

      setWallpaper: (wallpaperUrl) => set({ wallpaper: wallpaperUrl }),
      toggleStartMenu: () => set(state => ({ isStartMenuOpen: !state.isStartMenuOpen, isSidebarOpen: false })),
      closeStartMenu: () => set({ isStartMenuOpen: false }),

      startNewChat: () => {
        const newSessionId = nanoid();
        const newSession: ChatSession = {
          id: newSessionId,
          title: "New Chat",
          messages: [],
          createdAt: new Date().toISOString(),
        };
        set(state => ({
          gemini: {
            ...state.gemini,
            sessions: { ...state.gemini.sessions, [newSessionId]: newSession },
            currentSessionId: newSessionId,
          },
        }));
      },
      selectChatSession: (sessionId) => {
        if (get().gemini.sessions[sessionId]) {
          set(state => ({ gemini: { ...state.gemini, currentSessionId: sessionId } }));
        }
      },
      addMessageToSession: (sessionId, message) => {
        set(state => {
          const session = state.gemini.sessions[sessionId];
          if (!session) return state;
          const updatedSession = { ...session, messages: [...session.messages, message] };
          return {
            gemini: {
              ...state.gemini,
              sessions: { ...state.gemini.sessions, [sessionId]: updatedSession },
            },
          };
        });
      },
      setGeminiLoading: (isLoading) => set(state => ({ gemini: { ...state.gemini, isLoading } })),
      setGeminiModel: (model: GeminiModel) => set(state => ({ gemini: { ...state.gemini, model } })),
      toggleSmartContext: () => set(state => ({ gemini: { ...state.gemini, useSmartContext: !state.gemini.useSmartContext } })),
      toggleGrounding: () => set(state => ({ gemini: { ...state.gemini, useGrounding: !state.gemini.useGrounding } })),
      deleteChatSession: (sessionId: string) => {
        set(state => {
          const newSessions = { ...state.gemini.sessions };
          delete newSessions[sessionId];
          let newCurrentSessionId = state.gemini.currentSessionId;
          if (newCurrentSessionId === sessionId) {
            const remainingIds = Object.keys(newSessions);
            newCurrentSessionId = remainingIds.length > 0 ? remainingIds[0] : null;
          }
          return {
            gemini: { ...state.gemini, sessions: newSessions, currentSessionId: newCurrentSessionId }
          };
        });
      },
      updateSessionTitle: (sessionId: string, title: string) => {
        set(state => {
          const session = state.gemini.sessions[sessionId];
          if (!session) return state;
          const updatedSession = { ...session, title };
          return {
            gemini: {
              ...state.gemini,
              sessions: { ...state.gemini.sessions, [sessionId]: updatedSession },
            },
          };
        });
      },
      setHasWelcomed: (status) => set({ hasWelcomed: status }),
      setInitialGreetingSpoken: (status: boolean) => set({ initialGreetingSpoken: status }),
      setMicPermissionGranted: (status: boolean) => set({ micPermissionGranted: status }),
      addEmail: (email) => set(state => ({ collectedEmails: [...state.collectedEmails, email] })),
      toggleSidebar: () => set(state => ({ isSidebarOpen: !state.isSidebarOpen, isStartMenuOpen: false })),
      closeSidebar: () => set({ isSidebarOpen: false }),
      toggleMatrixEffect: (status) => set({ isMatrixEffectActive: status }),
      setHasNewMessage: (status) => set({ hasNewMessage: status }),
      toggleTheme: () => set(state => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

      // Project folder actions
      addProjectFolder: (folder) => {
        const id = `folder:${nanoid()}`;
        const newFolder: ProjectFolder = {
          ...folder,
          id,
          createdAt: new Date().toISOString(),
        };
        set(state => ({ projectFolders: [...state.projectFolders, newFolder] }));
      },
      removeProjectFolder: (id) => {
        set(state => ({ projectFolders: state.projectFolders.filter(f => f.id !== id) }));
      },
      updateProjectFolder: (id, updates) => {
        set(state => ({
          projectFolders: state.projectFolders.map(f => f.id === id ? { ...f, ...updates } : f)
        }));
      },

      // Virtual filesystem actions
      navigateToPath: (path) => {
        set({ currentPath: path });
      },
      openFile: (fileId) => {
        // Will be implemented to open file viewers
        // For now, just placeholder
        console.log('Opening file:', fileId);
      },
    }),
    {
      name: 'win11-portfolio-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        wallpaper: state.wallpaper,
        collectedEmails: state.collectedEmails,
        projectFolders: state.projectFolders, // Persist project folders
        gemini: {
          ...state.gemini,
          isLoading: false,
        },
      })
    }
  )
);

const initialState = useKernelStore.getState();
if (Object.keys(initialState.gemini.sessions).length === 0) {
  useKernelStore.getState().startNewChat();
}

export const useKernel = useKernelStore;
// FIX: Removed redundant interface declaration that conflicted with the imported KernelState type.
