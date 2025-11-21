import React, { useState, useEffect } from 'react';
import { Mic, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SpeechBubble {
    id: string;
    text: string;
    timestamp: number;
}

let addBubbleCallback: ((text: string) => void) | null = null;

/**
 * Add a speech bubble to the overlay
 */
export const showSpeechBubble = (text: string) => {
    if (addBubbleCallback) {
        addBubbleCallback(text);
    }
};

const VoiceAssistantOverlay: React.FC = () => {
    const [bubbles, setBubbles] = useState<SpeechBubble[]>([]);
    const [isSpeaking, setIsSpeaking] = useState(false);

    useEffect(() => {
        // Register callback for adding bubbles
        addBubbleCallback = (text: string) => {
            const bubble: SpeechBubble = {
                id: `bubble-${Date.now()}`,
                text,
                timestamp: Date.now(),
            };

            setBubbles(prev => [...prev, bubble]);
            setIsSpeaking(true);

            // Auto-remove after 5 seconds
            setTimeout(() => {
                setBubbles(prev => prev.filter(b => b.id !== bubble.id));
            }, 5000);
        };

        // Listen to speech events to update speaking state
        if ('speechSynthesis' in window) {
            const checkSpeaking = setInterval(() => {
                setIsSpeaking(window.speechSynthesis.speaking);
            }, 100);

            return () => {
                clearInterval(checkSpeaking);
                addBubbleCallback = null;
            };
        }
    }, []);

    return (
        <div className="fixed bottom-4 right-4 z-9999 pointer-events-none">
            {/* Speech Bubbles */}
            <div className="flex flex-col items-end gap-2 mb-4 max-w-[300px]">
                <AnimatePresence>
                    {bubbles.map((bubble, index) => (
                        <motion.div
                            key={bubble.id}
                            initial={{ opacity: 0, x: 50, y: 20 }}
                            animate={{ opacity: 1, x: 0, y: 0 }}
                            exit={{ opacity: 0, x: 50, scale: 0.8 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            className="bg-black/80 backdrop-blur-md text-white px-4 py-2 rounded-lg shadow-lg border border-white/10 text-sm pointer-events-auto"
                            style={{ maxWidth: '300px' }}
                        >
                            <p className="leading-relaxed">{bubble.text}</p>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Mic Icon */}
            <motion.div
                className="bg-linear-to-br from-blue-500 to-purple-600 rounded-full p-3 shadow-lg border border-white/20 pointer-events-auto cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={isSpeaking ? {
                    scale: [1, 1.1, 1],
                    boxShadow: [
                        '0 10px 30px rgba(59, 130, 246, 0.3)',
                        '0 10px 40px rgba(139, 92, 246, 0.5)',
                        '0 10px 30px rgba(59, 130, 246, 0.3)',
                    ],
                } : {}}
                transition={isSpeaking ? {
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                } : {}}
            >
                {isSpeaking ? (
                    <Volume2 size={24} className="text-white" />
                ) : (
                    <Mic size={24} className="text-white" />
                )}
            </motion.div>
        </div>
    );
};

export default VoiceAssistantOverlay;
