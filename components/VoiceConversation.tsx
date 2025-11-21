import { useEffect, useState, useRef } from 'react';
import { useKernel } from '../store/kernel';
import { generateResponse } from '../services/geminiService';
import { speak } from './VoiceAssistant';
import { showSpeechBubble } from './VoiceAssistantOverlay';

// Speech Recognition types
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

interface SpeechRecognitionResultList {
    length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
    isFinal: boolean;
    length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    abort(): void;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: Event) => void) | null;
    onend: (() => void) | null;
}

declare global {
    interface Window {
        SpeechRecognition: new () => SpeechRecognition;
        webkitSpeechRecognition: new () => SpeechRecognition;
    }
}

/**
 * VoiceConversation - Handles voice input (STT) and creates AI conversations
 */
const VoiceConversation: React.FC = () => {
    const micPermissionGranted = useKernel(state => state.micPermissionGranted);
    const gemini = useKernel(state => state.gemini);
    const [isListening, setIsListening] = useState(false);
    const [conversationHistory, setConversationHistory] = useState<Array<{ role: 'user' | 'model', content: string }>>([]);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const isProcessingRef = useRef(false);

    useEffect(() => {
        if (!micPermissionGranted) return;

        // Initialize speech recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn('Speech recognition not supported');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = async (event: SpeechRecognitionEvent) => {
            if (isProcessingRef.current) return;

            const result = event.results[event.resultIndex];
            if (result.isFinal) {
                const transcript = result[0].transcript.trim();
                console.log('Heard:', transcript);

                // Check if it's a wake word or command
                if (transcript.toLowerCase().includes('hey assistant') ||
                    transcript.toLowerCase().includes('ok assistant') ||
                    transcript.toLowerCase().includes('assistant')) {

                    isProcessingRef.current = true;
                    setIsListening(false);

                    // Process the command
                    await handleVoiceCommand(transcript);

                    isProcessingRef.current = false;
                    setIsListening(true);
                }
            }
        };

        recognition.onerror = (event: Event) => {
            console.error('Speech recognition error:', event);
            setIsListening(false);
        };

        recognition.onend = () => {
            if (micPermissionGranted && !isProcessingRef.current) {
                // Auto-restart if still have permission
                try {
                    recognition.start();
                } catch (e) {
                    console.log('Recognition already started or errored');
                }
            }
        };

        recognitionRef.current = recognition;

        // Start listening after a delay
        setTimeout(() => {
            try {
                recognition.start();
                setIsListening(true);
                console.log('Voice recognition started - say "Hey Assistant" to activate');
            } catch (e) {
                console.error('Failed to start recognition:', e);
            }
        }, 2000);

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [micPermissionGranted]);

    const handleVoiceCommand = async (userInput: string) => {
        // Remove wake words from the command
        const cleanedInput = userInput
            .replace(/hey assistant/gi, '')
            .replace(/ok assistant/gi, '')
            .replace(/assistant/gi, '')
            .trim();

        if (!cleanedInput) {
            speak("I'm listening. How can I help you?");
            return;
        }

        console.log('Processing command:', cleanedInput);

        // Add to conversation history
        const userMessage = { role: 'user' as const, content: cleanedInput };
        const newHistory = [...conversationHistory, userMessage];
        setConversationHistory(newHistory);

        try {
            // Get AI response
            const { text: responseText } = await generateResponse(
                cleanedInput,
                gemini.model,
                newHistory,
                false // Don't use grounding for voice to keep it fast
            );

            if (responseText) {
                // Add to history
                const modelMessage = { role: 'model' as const, content: responseText };
                setConversationHistory([...newHistory, modelMessage]);

                // Speak the response
                speak(responseText);
            }
        } catch (error) {
            console.error('Error processing voice command:', error);
            speak("Sorry, I encountered an error processing your request.");
        }
    };

    return null; // This component is invisible
};

export default VoiceConversation;
