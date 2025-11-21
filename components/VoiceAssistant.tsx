import { useEffect, useRef } from 'react';
import { useKernel } from '../store/kernel';

/**
 * VoiceAssistant - Handles Text-to-Speech for the AI assistant
 * This component is invisible and manages voice output
 */
const VoiceAssistant: React.FC = () => {
    const hasWelcomed = useKernel(state => state.hasWelcomed);
    const initialGreetingSpoken = useKernel(state => state.initialGreetingSpoken);
    const setInitialGreetingSpoken = useKernel(state => state.setInitialGreetingSpoken);
    const micPermissionGranted = useKernel(state => state.micPermissionGranted);

    const hasTriggeredGreeting = useRef(false);

    useEffect(() => {
        // Only trigger greeting once when:
        // 1. User has welcomed (transitioned to desktop)
        // 2. Initial greeting hasn't been spoken yet
        // 3. Mic permission was granted
        // 4. We haven't already triggered it (ref check)
        if (
            hasWelcomed &&
            !initialGreetingSpoken &&
            micPermissionGranted &&
            !hasTriggeredGreeting.current
        ) {
            hasTriggeredGreeting.current = true;

            // Small delay to let desktop render
            setTimeout(() => {
                speakGreeting();
                setInitialGreetingSpoken(true);
            }, 1000);
        }
    }, [hasWelcomed, initialGreetingSpoken, micPermissionGranted, setInitialGreetingSpoken]);

    const speakGreeting = () => {
        const greetings = [
            "Welcome to your digital reality.",
            "Hello. I am your OS assistant. How can I help you today?",
            "Greetings. Your portfolio is ready.",
            "Welcome back to the Matrix.",
        ];

        const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];

        speak(randomGreeting);
    };

    return null; // This component is invisible
};

/**
 * Speak text using Web Speech API
 */
export const speak = (text: string, rate: number = 1.0, pitch: number = 1.0) => {
    if (!('speechSynthesis' in window)) {
        console.warn('Speech synthesis not supported');
        return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = 0.8;

    // Try to use a specific voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice =>
        voice.name.includes('Google') ||
        voice.name.includes('Daniel') ||
        voice.name.includes('Samantha')
    );

    if (preferredVoice) {
        utterance.voice = preferredVoice;
    }

    window.speechSynthesis.speak(utterance);
};

/**
 * Stop any ongoing speech
 */
export const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
};

export default VoiceAssistant;
