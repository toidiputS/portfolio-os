import { useEffect, useState, useRef } from 'react';
import { useKernel } from '../store/kernel';
import { generateResponse } from '../services/geminiService';
import { speak } from './VoiceAssistant';

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
    onerror: ((event: any) => void) | null;
    onend: (() => void) | null;
}

declare global {
    interface Window {
        SpeechRecognition: new () => SpeechRecognition;
        webkitSpeechRecognition: new () => SpeechRecognition;
    }
}

let startListeningCallback: (() => void) | null = null;

/**
 * Export function to trigger push-to-talk from the overlay
 */
export const startPushToTalk = () => {
    if (startListeningCallback) {
        startListeningCallback();
    }
};

/**
 * VoiceConversation - Push-to-talk voice assistant
 */
const VoiceConversation: React.FC = () => {
    const micPermissionGranted = useKernel(state => state.micPermissionGranted);
    const gemini = useKernel(state => state.gemini);
    const [conversationHistory, setConversationHistory] = useState<Array<{ role: 'user' | 'model', content: string }>>([]);
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    useEffect(() => {
        if (!micPermissionGranted) return;

        // Initialize speech recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn('Speech recognition not supported');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false; // ONE command at a time
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = async (event: SpeechRecognitionEvent) => {
            const result = event.results[event.resultIndex];
            if (result.isFinal) {
                const transcript = result[0].transcript.trim();
                console.log('You said:', transcript);

                // Process the command
                await handleVoiceCommand(transcript);
            }
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
        };

        recognition.onend = () => {
            console.log('Listening stopped');
        };

        recognitionRef.current = recognition;

        // Register the callback for push-to-talk
        startListeningCallback = () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.start();
                    console.log('🎤 Listening... Speak now!');
                } catch (e) {
                    console.error('Failed to start recognition:', e);
                }
            }
        };

        return () => {
            startListeningCallback = null;
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch (e) {
                    // Ignore cleanup errors
                }
            }
        };
    }, [micPermissionGranted]);

    const handleVoiceCommand = async (userInput: string) => {
        if (!userInput) {
            speak("I didn't catch that. Please try again.");
            return;
        }

        console.log('Processing command:', userInput);

        // Add to conversation history
        const userMessage = { role: 'user' as const, content: userInput };
        const newHistory = [...conversationHistory, userMessage];
        setConversationHistory(newHistory);

        try {
            // Get AI response
            const { text: responseText } = await generateResponse(
                userInput,
                gemini.model,
                newHistory,
                false // Don't use grounding for voice (faster)
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
