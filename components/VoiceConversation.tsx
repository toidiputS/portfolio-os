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

/**
 * VoiceConversation - DISABLED for now to prevent infinite loop
 * To re-enable, user needs to implement proper error handling
 */
const VoiceConversation: React.FC = () => {
    // DISABLED - This component is currently inactive to prevent errors
    // Uncomment the code below to re-enable voice conversation

    /*
    const micPermissionGranted = useKernel(state => state.micPermissionGranted);
    const gemini = useKernel(state => state.gemini);
    const [conversationHistory, setConversationHistory] = useState<Array<{role: 'user' | 'model', content: string}>>([]);
    
    // Voice conversation logic would go here
    */

    return null; // This component is invisible and currently disabled
};

export default VoiceConversation;
