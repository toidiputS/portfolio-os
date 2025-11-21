import React from 'react';
import { useKernel } from '../../store/kernel';
import { Folder, ExternalLink, Trash2 } from 'lucide-react';

interface FolderViewProps {
    folderId?: string;
}

const FolderView: React.FC<FolderViewProps> = () => {
    const windows = useKernel(state => state.windows);
    const projectFolders = useKernel(state => state.projectFolders);
    const removeProjectFolder = useKernel(state => state.removeProjectFolder);
    const openWindow = useKernel(state => state.openWindow);
    const closeWindow = useKernel(state => state.closeWindow);

    // Find the current window to get which folder this is
    const currentWindow = windows.find(w => w.appId.startsWith('folder:'));
    const folder = projectFolders.find(f => f.id === currentWindow?.appId);

    if (!folder) {
        return (
            <div className="h-full flex items-center justify-center bg-[hsl(var(--background-hsl))] text-[hsl(var(--foreground-hsl))] p-6">
                <div className="text-center">
                    <Folder className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Folder not found</p>
                </div>
            </div>
        );
    }

    const handleRemoveFolder = () => {
        if (confirm(`Remove "${folder.name}" from desktop?`)) {
            removeProjectFolder(folder.id);
            if (currentWindow) {
                closeWindow(currentWindow.id);
            }
        }
    };

    const handleOpenInManager = () => {
        openWindow('fileManager');
    };

    return (
        <div className="h-full flex flex-col bg-[hsl(var(--background-hsl))] text-[hsl(var(--foreground-hsl))] p-6">
            <div className="flex items-start gap-4 mb-6">
                <Folder
                    className="w-16 h-16 shrink-0"
                    style={{ color: folder.color || '#3b82f6' }}
                />
                <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-bold mb-2">{folder.name}</h1>
                    <p className="text-sm text-[hsl(var(--muted-foreground-hsl))] break-all">
                        {folder.path}
                    </p>
                    <p className="text-xs text-[hsl(var(--muted-foreground-hsl))] mt-2">
                        Created {new Date(folder.createdAt).toLocaleString()}
                    </p>
                </div>
            </div>

            <div className="space-y-3">
                <button
                    onClick={handleOpenInManager}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[hsl(var(--accent-strong-hsl))] text-[hsl(var(--accent-foreground-hsl))] rounded-md hover:brightness-90 transition-all"
                >
                    <ExternalLink size={18} />
                    Open in File Manager
                </button>

                <button
                    onClick={handleRemoveFolder}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[hsl(var(--destructive-hsl))] text-[hsl(var(--destructive-foreground-hsl))] rounded-md hover:brightness-90 transition-all"
                >
                    <Trash2 size={18} />
                    Remove from Desktop
                </button>
            </div>

            <div className="mt-6 p-4 bg-[hsl(var(--muted-hsl)/0.5)] rounded-lg">
                <h2 className="font-semibold mb-2">Quick Info</h2>
                <div className="space-y-1 text-sm text-[hsl(var(--muted-foreground-hsl))]">
                    <p><strong>Type:</strong> Project Folder</p>
                    <p><strong>Color:</strong> <span className="inline-block w-4 h-4 rounded" style={{ backgroundColor: folder.color || '#3b82f6' }} /></p>
                    <p><strong>ID:</strong> <code className="text-xs bg-[hsl(var(--background-hsl))] px-1 py-0.5 rounded">{folder.id}</code></p>
                </div>
            </div>

            <div className="mt-auto pt-6 text-xs text-[hsl(var(--muted-foreground-hsl))]">
                This is a desktop shortcut to your project folder. Click "Open in File Manager" to manage your folders or "Remove from Desktop" to delete this shortcut.
            </div>
        </div>
    );
};

export default FolderView;
