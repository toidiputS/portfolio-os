import React, { useState } from 'react';
import { useKernel } from '../../store/kernel';
import { Folder, FolderPlus, Trash2, FolderOpen } from 'lucide-react';

const FileManager: React.FC = () => {
    const projectFolders = useKernel(state => state.projectFolders);
    const addProjectFolder = useKernel(state => state.addProjectFolder);
    const removeProjectFolder = useKernel(state => state.removeProjectFolder);
    const openWindow = useKernel(state => state.openWindow);

    const [showAddForm, setShowAddForm] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [newFolderPath, setNewFolderPath] = useState('');
    const [newFolderColor, setNewFolderColor] = useState('#3b82f6');

    const handleAddFolder = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFolderName.trim() || !newFolderPath.trim()) return;

        addProjectFolder({
            name: newFolderName.trim(),
            path: newFolderPath.trim(),
            color: newFolderColor,
        });

        // Reset form
        setNewFolderName('');
        setNewFolderPath('');
        setNewFolderColor('#3b82f6');
        setShowAddForm(false);
    };

    const handleOpenFolder = (folderId: string) => {
        openWindow(folderId as any); // Will open FolderView
    };

    return (
        <div className="h-full flex flex-col bg-[hsl(var(--background-hsl))] text-[hsl(var(--foreground-hsl))] p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Folder className="w-6 h-6" />
                    File Manager
                </h1>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--accent-strong-hsl))] text-[hsl(var(--accent-foreground-hsl))] rounded-md hover:brightness-90 transition-all"
                >
                    <FolderPlus size={18} />
                    Add Project Folder
                </button>
            </div>

            {showAddForm && (
                <div className="mb-6 p-4 bg-[hsl(var(--card-hsl))] border border-[hsl(var(--border-hsl))] rounded-lg">
                    <h2 className="text-lg font-semibold mb-4">New Project Folder</h2>
                    <form onSubmit={handleAddFolder} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Folder Name</label>
                            <input
                                type="text"
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                placeholder="My Awesome Project"
                                className="w-full px-3 py-2 bg-[hsl(var(--secondary-hsl))] border border-[hsl(var(--border-hsl))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring-hsl))]"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Folder Path</label>
                            <input
                                type="text"
                                value={newFolderPath}
                                onChange={(e) => setNewFolderPath(e.target.value)}
                                placeholder="C:/Projects/my-awesome-project"
                                className="w-full px-3 py-2 bg-[hsl(var(--secondary-hsl))] border border-[hsl(var(--border-hsl))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring-hsl))]"
                                required
                            />
                            <p className="text-xs text-[hsl(var(--muted-foreground-hsl))] mt-1">
                                Enter the full path to your project folder
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Folder Color</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={newFolderColor}
                                    onChange={(e) => setNewFolderColor(e.target.value)}
                                    className="w-12 h-10 rounded cursor-pointer"
                                />
                                <span className="text-sm text-[hsl(var(--muted-foreground-hsl))]">{newFolderColor}</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="px-4 py-2 bg-[hsl(var(--accent-strong-hsl))] text-[hsl(var(--accent-foreground-hsl))] rounded-md hover:brightness-90 transition-all"
                            >
                                Add Folder
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowAddForm(false)}
                                className="px-4 py-2 bg-[hsl(var(--secondary-hsl))] text-[hsl(var(--secondary-foreground-hsl))] rounded-md hover:brightness-90 transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="flex-1 overflow-auto">
                <h2 className="text-lg font-semibold mb-4">Project Folders</h2>
                {projectFolders.length === 0 ? (
                    <div className="text-center py-12 text-[hsl(var(--muted-foreground-hsl))]">
                        <Folder className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg mb-2">No project folders yet</p>
                        <p className="text-sm">Add a folder to create a desktop shortcut</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {projectFolders.map((folder) => (
                            <div
                                key={folder.id}
                                className="p-4 bg-[hsl(var(--card-hsl))] border border-[hsl(var(--border-hsl))] rounded-lg hover:shadow-lg transition-all"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-3 flex-1">
                                        <FolderOpen
                                            className="w-8 h-8 shrink-0"
                                            style={{ color: folder.color || '#3b82f6' }}
                                        />
                                        <div className="min-w-0">
                                            <h3 className="font-semibold truncate">{folder.name}</h3>
                                            <p className="text-sm text-[hsl(var(--muted-foreground-hsl))] truncate">
                                                {folder.path}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeProjectFolder(folder.id)}
                                        className="p-2 text-[hsl(var(--muted-foreground-hsl))] hover:text-[hsl(var(--destructive-hsl))] hover:bg-[hsl(var(--destructive-hsl)/0.1)] rounded transition-all"
                                        title="Remove folder"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                                <button
                                    onClick={() => handleOpenFolder(folder.id)}
                                    className="w-full mt-2 px-3 py-1.5 text-sm bg-[hsl(var(--secondary-hsl))] text-[hsl(var(--secondary-foreground-hsl))] rounded hover:bg-[hsl(var(--accent-strong-hsl))] hover:text-[hsl(var(--accent-foreground-hsl))] transition-all"
                                >
                                    Open Folder
                                </button>
                                <div className="mt-2 text-xs text-[hsl(var(--muted-foreground-hsl))]">
                                    Created {new Date(folder.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FileManager;
