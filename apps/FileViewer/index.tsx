
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { FileText, Image as ImageIcon, ExternalLink, AlertCircle } from 'lucide-react';
import { VirtualFile } from '../../types';
import { getFileById } from '../../lib/filesystemUtils';

interface FileViewerProps {
    metadata?: {
        fileId: string;
    };
}

const FileViewer: React.FC<FileViewerProps> = ({ metadata }) => {
    if (!metadata?.fileId) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-[hsl(var(--destructive-hsl))]">
                <AlertCircle className="w-12 h-12 mb-4" />
                <p>Error: No file specified</p>
            </div>
        );
    }

    const file = getFileById(metadata.fileId);

    if (!file) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-[hsl(var(--destructive-hsl))]">
                <AlertCircle className="w-12 h-12 mb-4" />
                <p>Error: File not found</p>
            </div>
        );
    }

    // Render content based on file type
    // Render content based on file type
    const renderContent = () => {
        switch (file.type) {
            case 'markdown':
                return (
                    <div className="prose prose-invert max-w-none p-6">
                        <ReactMarkdown>{file.content?.markdown || ''}</ReactMarkdown>
                    </div>
                );

            case 'image':
                return (
                    <div className="h-full flex flex-col items-center justify-center p-4 bg-black/20">
                        {file.content?.imageUrl ? (
                            <img
                                src={file.content.imageUrl}
                                alt={file.content.alt || file.name}
                                className="max-w-full max-h-full object-contain rounded shadow-lg"
                            />
                        ) : (
                            <div className="flex flex-col items-center text-[hsl(var(--muted-foreground-hsl))]">
                                <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
                                <p>No image source</p>
                            </div>
                        )}
                    </div>
                );

            case 'link':
                return (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                        <ExternalLink className="w-16 h-16 mb-6 text-[hsl(var(--accent-strong-hsl))]" />
                        <h2 className="text-2xl font-bold mb-2">{file.name}</h2>
                        <p className="text-[hsl(var(--muted-foreground-hsl))] mb-6 break-all max-w-md">
                            {file.content?.url}
                        </p>
                        <a
                            href={file.content?.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-6 py-3 bg-[hsl(var(--accent-strong-hsl))] text-[hsl(var(--accent-foreground-hsl))] rounded-lg hover:brightness-110 transition-all font-medium flex items-center gap-2"
                        >
                            Open Link <ExternalLink size={16} />
                        </a>
                    </div>
                );

            case 'text':
                return (
                    <div className="h-full p-4 font-mono text-sm whitespace-pre-wrap overflow-auto">
                        {file.content?.text || ''}
                    </div>
                );

            case 'pdf':
                return (
                    <div className="h-full flex flex-col">
                        {file.content?.pdfUrl ? (
                            <iframe
                                src={`${file.content.pdfUrl}#toolbar=0`}
                                className="w-full h-full border-none"
                                title={file.name}
                            />
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                                <FileText className="w-16 h-16 mb-6 text-[hsl(var(--accent-strong-hsl))]" />
                                <h2 className="text-2xl font-bold mb-2">{file.name}</h2>
                                <p className="text-[hsl(var(--muted-foreground-hsl))] mb-6">
                                    No PDF source found.
                                </p>
                            </div>
                        )}
                    </div>
                );

            default:
                return (
                    <div className="h-full flex flex-col items-center justify-center text-[hsl(var(--muted-foreground-hsl))]">
                        <FileText className="w-16 h-16 mb-4 opacity-50" />
                        <p>Cannot preview this file type</p>
                    </div>
                );
        }
    };

    return (
        <div className="h-full bg-[hsl(var(--background-hsl))] text-[hsl(var(--foreground-hsl))] overflow-auto">
            {renderContent()}
        </div>
    );
};

export default FileViewer;

