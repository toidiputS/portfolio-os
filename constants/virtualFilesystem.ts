import { VirtualFile } from '../types';

/**
 * Virtual Portfolio Filesystem
 * 
 * This mock filesystem contains portfolio content organized as files and folders.
 * Navigate via File Manager GUI or Terminal commands.
 */
export const VIRTUAL_FILESYSTEM: VirtualFile[] = [
    // === ROOT ===
    {
        id: 'root',
        name: '/',
        type: 'folder',
        path: '/',
        parentPath: '',
        createdAt: '2025-01-01T00:00:00.000Z',
        modifiedAt: '2025-01-01T00:00:00.000Z',
    },

    // === PROJECTS FOLDER ===
    {
        id: 'projects',
        name: 'Projects',
        type: 'folder',
        path: '/projects',
        parentPath: '/',
        color: '#3b82f6',
        createdAt: '2025-01-01T00:00:00.000Z',
        modifiedAt: '2025-01-01T00:00:00.000Z',
    },

    // Web Apps subfolder
    {
        id: 'web-apps',
        name: 'Web-Apps',
        type: 'folder',
        path: '/projects/web-apps',
        parentPath: '/projects',
        color: '#8b5cf6',
        createdAt: '2025-01-01T00:00:00.000Z',
        modifiedAt: '2025-01-01T00:00:00.000Z',
    },

    // Portfolio OS Project
    {
        id: 'portfolio-os',
        name: 'Portfolio-OS',
        type: 'folder',
        path: '/projects/web-apps/portfolio-os',
        parentPath: '/projects/web-apps',
        createdAt: '2025-01-01T00:00:00.000Z',
        modifiedAt: '2025-01-01T00:00:00.000Z',
    },
    {
        id: 'portfolio-os-readme',
        name: 'README.md',
        type: 'markdown',
        path: '/projects/web-apps/portfolio-os/README.md',
        parentPath: '/projects/web-apps/portfolio-os',
        size: '2.4 KB',
        createdAt: '2025-01-01T00:00:00.000Z',
        modifiedAt: '2025-01-01T00:00:00.000Z',
        content: {
            markdown: `# Portfolio OS

An interactive portfolio website disguised as a Windows-like operating system.

## 🌟 Features

- **3D App Sphere**: Navigate applications in an immersive 3D environment
- **Virtual Filesystem**: Browse projects like exploring a real file system
- **Integrated Terminal**: Full command-line access with Unix-like commands
- **Window Management**: Drag, resize, snap windows with smooth animations
- **AI Assistant**: Coming soon - interactive guide to showcase work

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Animations**: Framer Motion
- **3D Graphics**: Three.js / React Three Fiber
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **AI**: Google Gemini API

## 🚀 Performance Optimizations

- Optimized window rendering with \`useMotionValue\`
- Memoized heavy 3D components
- Lazy-loaded applications
- Split code by route

## 📦 Project Structure

\`\`\`
portfolio-os/
├── apps/          # Individual applications
├── components/    # Reusable UI components
├── store/         # Zustand state management
├── constants/     # Configuration and data
└── lib/           # Utility functions
\`\`\`

## 🎨 Design Philosophy

Portfolio OS reimagines the traditional portfolio website as an interactive operating system, making the browsing experience memorable and engaging.

## 🔗 Links

- [Live Demo](https://portfolio-os.vercel.app)
- [GitHub Repository](https://github.com/username/portfolio-os)

---

**Status**: ✅ In Production  
**Last Updated**: January 2025
`
        },
    },
    {
        id: 'portfolio-os-demo',
        name: 'Live-Demo.link',
        type: 'link',
        path: '/projects/web-apps/portfolio-os/Live-Demo.link',
        parentPath: '/projects/web-apps/portfolio-os',
        createdAt: '2025-01-01T00:00:00.000Z',
        modifiedAt: '2025-01-01T00:00:00.000Z',
        content: {
            url: 'https://portfolio-os.vercel.app',
        },
    },
    {
        id: 'portfolio-os-github',
        name: 'GitHub.link',
        type: 'link',
        path: '/projects/web-apps/portfolio-os/GitHub.link',
        parentPath: '/projects/web-apps/portfolio-os',
        createdAt: '2025-01-01T00:00:00.000Z',
        modifiedAt: '2025-01-01T00:00:00.000Z',
        content: {
            url: 'https://github.com/username/portfolio-os',
        },
    },

    // === ABOUT FOLDER ===
    {
        id: 'about',
        name: 'About',
        type: 'folder',
        path: '/about',
        parentPath: '/',
        color: '#10b981',
        createdAt: '2025-01-01T00:00:00.000Z',
        modifiedAt: '2025-01-01T00:00:00.000Z',
    },
    {
        id: 'bio',
        name: 'bio.md',
        type: 'markdown',
        path: '/about/bio.md',
        parentPath: '/about',
        size: '1.2 KB',
        createdAt: '2025-01-01T00:00:00.000Z',
        modifiedAt: '2025-01-01T00:00:00.000Z',
        content: {
            markdown: `# About Me

Hi! I'm a full-stack developer passionate about creating unique and engaging web experiences.

## Background

I specialize in building interactive web applications that push the boundaries of what's possible in the browser. My work combines technical expertise with creative design to deliver memorable user experiences.

## What I Do

- **Frontend Development**: React, TypeScript, Next.js
- **3D Graphics**: Three.js, WebGL
- **Animation**: Framer Motion, GSAP
- **Backend**: Node.js, Python
- **AI Integration**: Google Gemini, OpenAI

## Philosophy

I believe the web should be more than just functional—it should be delightful. Every project is an opportunity to create something that surprises and engages users.

## Get in Touch

Check out the /contact folder for all my links!
`
        },
    },

    // === SKILLS FOLDER ===
    {
        id: 'skills',
        name: 'Skills',
        type: 'folder',
        path: '/skills',
        parentPath: '/',
        color: '#f59e0b',
        createdAt: '2025-01-01T00:00:00.000Z',
        modifiedAt: '2025-01-01T00:00:00.000Z',
    },
    {
        id: 'frontend',
        name: 'frontend.md',
        type: 'markdown',
        path: '/skills/frontend.md',
        parentPath: '/skills',
        size: '800 B',
        createdAt: '2025-01-01T00:00:00.000Z',
        modifiedAt: '2025-01-01T00:00:00.000Z',
        content: {
            markdown: `# Frontend Skills

## Frameworks & Libraries
- ⚛️ React / Next.js
- 📘 TypeScript
- 🎨 Tailwind CSS
- 🎭 Framer Motion
- 🌐 Three.js / React Three Fiber

## State Management
- Zustand
- Redux Toolkit
- React Query

## Tools & Workflow
- Vite / Webpack
- Git / GitHub
- VS Code
- Figma (design handoff)

## Currently Learning
- WebGPU
- Advanced GLSL shaders
- AI-powered interfaces
`
        },
    },
    {
        id: 'backend',
        name: 'backend.md',
        type: 'markdown',
        path: '/skills/backend.md',
        parentPath: '/skills',
        size: '650 B',
        createdAt: '2025-01-01T00:00:00.000Z',
        modifiedAt: '2025-01-01T00:00:00.000Z',
        content: {
            markdown: `# Backend Skills

## Languages & Runtimes
- 🟢 Node.js / Express
- 🐍 Python / FastAPI
- 📜 TypeScript

## Databases
- PostgreSQL
- MongoDB
- Redis

## APIs & Integration
- REST API design
- GraphQL
- WebSocket real-time communication
- Google Gemini API
- OpenAI API

## DevOps & Deployment
- Vercel
- Docker basics
- GitHub Actions CI/CD
`
        },
    },

    // === CONTACT FOLDER ===
    {
        id: 'contact',
        name: 'Contact',
        type: 'folder',
        path: '/contact',
        parentPath: '/',
        color: '#ec4899',
        createdAt: '2025-01-01T00:00:00.000Z',
        modifiedAt: '2025-01-01T00:00:00.000Z',
    },
    {
        id: 'email-link',
        name: 'Email.link',
        type: 'link',
        path: '/contact/Email.link',
        parentPath: '/contact',
        createdAt: '2025-01-01T00:00:00.000Z',
        modifiedAt: '2025-01-01T00:00:00.000Z',
        content: {
            url: 'mailto:your.email@example.com',
        },
    },
    {
        id: 'linkedin-link',
        name: 'LinkedIn.link',
        type: 'link',
        path: '/contact/LinkedIn.link',
        parentPath: '/contact',
        createdAt: '2025-01-01T00:00:00.000Z',
        modifiedAt: '2025-01-01T00:00:00.000Z',
        content: {
            url: 'https://linkedin.com/in/yourprofile',
        },
    },
    {
        id: 'github-link',
        name: 'GitHub.link',
        type: 'link',
        path: '/contact/GitHub.link',
        parentPath: '/contact',
        createdAt: '2025-01-01T00:00:00.000Z',
        modifiedAt: '2025-01-01T00:00:00.000Z',
        content: {
            url: 'https://github.com/yourusername',
        },
    },
    {
        id: 'twitter-link',
        name: 'Twitter.link',
        type: 'link',
        path: '/contact/Twitter.link',
        parentPath: '/contact',
        createdAt: '2025-01-01T00:00:00.000Z',
        modifiedAt: '2025-01-01T00:00:00.000Z',
        content: {
            url: 'https://twitter.com/yourusername',
        },
    },
];

/**
 * Get the root folder
 */
export const getRootFolder = (): VirtualFile => {
    return VIRTUAL_FILESYSTEM.find(f => f.id === 'root')!;
};

/**
 * Get all files in a specific path
 */
export const getFilesInPath = (path: string): VirtualFile[] => {
    return VIRTUAL_FILESYSTEM.filter(f => f.parentPath === path);
};

/**
 * Get a file by its full path
 */
export const getFileByPath = (path: string): VirtualFile | undefined => {
    return VIRTUAL_FILESYSTEM.find(f => f.path === path);
};

/**
 * Get a file by its ID
 */
export const getFileById = (id: string): VirtualFile | undefined => {
    return VIRTUAL_FILESYSTEM.find(f => f.id === id);
};
