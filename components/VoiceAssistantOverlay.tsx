import React, { useState, useEffect } from 'react';
import { Mic, Volume2, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { startPushToTalk } from './VoiceConversation';
import { useKernel } from '../store/kernel';
import { GlowCard } from './GlowCard';

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
    const [isListening, setIsListening] = useState(false);
    const micPermissionGranted = useKernel(state => state.micPermissionGranted);

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

    const handleMicClick = () => {
        if (!micPermissionGranted) {
            alert('Microphone permission required. Please refresh and allow microphone access.');
            return;
        }

        if (isSpeaking) {
            // Stop current speech
            window.speechSynthesis.cancel();
            return;
        }

        // Start push-to-talk
        setIsListening(true);
        startPushToTalk();

        // Auto-stop listening indicator after 5 seconds
        setTimeout(() => {
            setIsListening(false);
        }, 5000);
    };

    return (
        <div className="fixed bottom-4 right-4 z-9999 pointer-events-none">
            {/* Speech Bubbles with Glow Effect */}
            <div className="flex flex-col items-end gap-3 mb-4 max-w-[350px]">
                <AnimatePresence>
                    {bubbles.map((bubble, index) => (
                        <motion.div
                            key={bubble.id}
                            initial={{ opacity: 0, x: 50, y: 20 }}
                            animate={{ opacity: 1, x: 0, y: 0 }}
                            exit={{ opacity: 0, x: 50, scale: 0.8 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            className="pointer-events-auto w-full"
                        >
                            <GlowCard
                                glowColor="purple"
                                customSize={true}
                                className="w-full p-3 aspect-auto! grid-rows-1!"
                            >
                                <p className="text-white text-sm leading-relaxed m-0">{bubble.text}</p>
                            </GlowCard>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Mic Icon - Clickable for Push-to-Talk */}
            <motion.div
                onClick={handleMicClick}
                className="bg-linear-to-br from-blue-500 to-purple-600 rounded-full p-3 shadow-lg border border-white/20 pointer-events-auto cursor-pointer relative"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={(isSpeaking || isListening) ? {
                    scale: [1, 1.1, 1],
                    boxShadow: [
                        '0 10px 30px rgba(59, 130, 246, 0.3)',
                        '0 10px 40px rgba(139, 92, 246, 0.5)',
                        '0 10px 30px rgba(59, 130, 246, 0.3)',
                    ],
                } : {}}
                transition={(isSpeaking || isListening) ? {
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                } : {}}
                title={isListening ? 'Listening... Speak now!' : isSpeaking ? 'Speaking... Click to stop' : micPermissionGranted ? 'Click to speak' : 'Microphone permission required'}
            >
                {isSpeaking ? (
                    <Volume2 size={24} className="text-white" />
                ) : isListening ? (
                    <Mic size={24} className="text-white animate-pulse" />
                ) : micPermissionGranted ? (
                    <Mic size={24} className="text-white" />
                ) : (
                    <MicOff size={24} className="text-white opacity-50" />
                )}

                {/* Listening indicator (red dot when actively listening) */}
                {isListening && (
                    <motion.div
                        className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full shadow-sm"
                        animate={{
                            scale: [1, 1.3, 1],
                            opacity: [1, 0.7, 1],
                        }}
                        transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    />
                )}
            </motion.div>
        </div>
    );
};

export default VoiceAssistantOverlay;
