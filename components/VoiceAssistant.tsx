import React, { useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob, FunctionDeclaration, Type } from '@google/genai';
import { useKernel } from '../store/kernel';
import { encode, decode, decodeAudioData, playAudio } from '../lib/audioUtils';
import { speakText } from '../services/geminiService';
import { Mic, MicOff } from 'lucide-react';
import { AppId } from '../types';
import { APPS } from '../apps.config';
import { nanoid } from 'nanoid';

const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;
const BUFFER_SIZE = 4096;

const appIdsList = APPS.map(app => `'${app.id}' ('${app.name}')`).join(', ');

// Tool Definitions for Voice Commands
const openWindowTool: FunctionDeclaration = {
    name: 'openWindow',
    description: 'Opens a specified application window on the desktop.',
    parameters: {
        type: Type.OBJECT,
        properties: { appId: { type: Type.STRING, description: `The unique identifier for the application to open. Available apps are: ${appIdsList}.`,}, },
        required: ['appId'],
    },
};

const closeWindowTool: FunctionDeclaration = {
    name: 'closeWindow',
    description: 'Closes a specified application window on the desktop.',
    parameters: {
        type: Type.OBJECT,
        properties: { appId: { type: Type.STRING, description: `The unique identifier of the application to close. Available apps are: ${appIdsList}.`, }, },
        required: ['appId'],
    },
};

const toggleMatrixTool: FunctionDeclaration = {
    name: 'toggleMatrixEffect',
    description: 'Toggles a full-screen matrix rain effect.',
    parameters: {
        type: Type.OBJECT,
        properties: { status: { type: Type.BOOLEAN, description: 'Whether to turn the effect on (true) or off (false). Example: "enter the matrix" should be true.', }, },
        required: ['status'],
    },
};

const changeWallpaperTool: FunctionDeclaration = {
    name: 'changeWallpaper',
    description: 'Changes the desktop wallpaper to a new random image.',
    parameters: { type: Type.OBJECT, properties: {} },
};


const VoiceAssistant: React.FC = () => {
    const liveSessionState = useKernel(state => state.liveSessionState);
    const setLiveSessionState = useKernel(state => state.setLiveSessionState);
    const openWindow = useKernel(state => state.openWindow);
    const closeWindowByAppId = useKernel(state => state.closeWindowByAppId);
    const toggleMatrixEffect = useKernel(state => state.toggleMatrixEffect);
    const setWallpaper = useKernel(state => state.setWallpaper);
    const addTranscriptMessage = useKernel(state => state.addTranscriptMessage);
    const resetTranscript = useKernel(state => state.resetTranscript);
    const hasWelcomed = useKernel(state => state.hasWelcomed);
    const micPermissionGranted = useKernel(state => state.micPermissionGranted);
    const hasInitialGreetingBeenSpoken = useKernel(state => state.hasInitialGreetingBeenSpoken);
    const setInitialGreetingSpoken = useKernel(state => state.setInitialGreetingSpoken);
    
    const sessionRef = useRef<any>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioSourcesRef = useRef(new Set<AudioBufferSourceNode>());
    const nextStartTimeRef = useRef(0);
    const transcriptionState = useRef({ input: '', output: '' });
    const hasStartedRef = useRef(false);
    const lastTurnCompleteRef = useRef(false);

    const stopAudioPlayback = useCallback(() => {
        audioSourcesRef.current.forEach(source => {
            try { source.stop(); } catch (e) { /* Ignore */ }
        });
        audioSourcesRef.current.clear();
        nextStartTimeRef.current = 0;
    }, []);

    const stopSession = useCallback(async () => {
        stopAudioPlayback();
        if (sessionRef.current) {
            try { sessionRef.current.close(); } catch (e) { console.warn("Error closing session:", e) }
            sessionRef.current = null;
        }
        if (scriptProcessorRef.current) {
            try { scriptProcessorRef.current.disconnect(); } catch (e) { console.warn("Error disconnecting script processor:", e) }
            scriptProcessorRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        if (inputAudioContextRef.current) {
            if (inputAudioContextRef.current.state !== 'closed') {
                await inputAudioContextRef.current.close().catch(e => console.warn("Error closing input audio context:", e));
            }
            inputAudioContextRef.current = null;
        }
        if (outputAudioContextRef.current) {
            if (outputAudioContextRef.current.state !== 'closed') {
                await outputAudioContextRef.current.close().catch(e => console.warn("Error closing output audio context:", e));
            }
            outputAudioContextRef.current = null;
        }
        hasStartedRef.current = false;
        setLiveSessionState('idle');
    }, [setLiveSessionState, stopAudioPlayback]);

    const startSession = useCallback(async () => {
        if (sessionRef.current || hasStartedRef.current) return; // Prevent multiple concurrent sessions
        hasStartedRef.current = true;

        resetTranscript();

        setLiveSessionState('connecting');

        if (!import.meta.env.VITE_GEMINI_API_KEY) {
            console.error("VITE_GEMINI_API_KEY is not set.");
            setLiveSessionState('error');
            return;
        }

        try {
            const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: OUTPUT_SAMPLE_RATE });
            if (outputAudioContextRef.current.state === 'suspended') {
                await outputAudioContextRef.current.resume();
            }

            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: async () => {
                        setLiveSessionState('listening');
                        try {
                            console.log('Creating AudioContext...');
                            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: INPUT_SAMPLE_RATE });
                            if (!inputAudioContextRef.current) {
                                throw new Error('Failed to create AudioContext - constructor returned null');
                            }
                            console.log('AudioContext created, state:', inputAudioContextRef.current.state);
                            if (inputAudioContextRef.current.state === 'suspended') {
                                console.log('Resuming AudioContext...');
                                await inputAudioContextRef.current.resume();
                                console.log('AudioContext resumed, new state:', inputAudioContextRef.current.state);
                            }
                            console.log('Requesting microphone permission...');
                            mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
                            console.log('Microphone permission granted');
                            if (!inputAudioContextRef.current) {
                                throw new Error('AudioContext became null after getUserMedia');
                            }
                            console.log('Creating media stream source...');
                            const source = inputAudioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
                            console.log('Creating script processor...');
                            scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(BUFFER_SIZE, 1, 1);

                            scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                                const pcmBlob: Blob = {
                                    data: encode(new Uint8Array(new Int16Array(inputData.map(x => x * 32768)).buffer)),
                                    mimeType: `audio/pcm;rate=${INPUT_SAMPLE_RATE}`,
                                };
                                if (sessionRef.current) sessionRef.current.sendRealtimeInput({ media: pcmBlob });
                            };
                            source.connect(scriptProcessorRef.current);
                            scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
                        } catch (err) {
                            console.error('Error setting up microphone:', err);
                            setLiveSessionState('error');
                            stopSession(); // Ensure cleanup on error
                        }
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (!sessionRef.current) return;

                        if (message.toolCall) {
                            const functionResponses = [];
                            for (const fc of message.toolCall.functionCalls ?? []) {
                                let result = 'Function not found.';
                                try {
                                    switch (fc.name) {
                                        case 'openWindow': openWindow(fc.args?.appId as AppId); result = `OK, opening ${fc.args?.appId}.`; break;
                                        case 'closeWindow': closeWindowByAppId(fc.args?.appId as AppId); result = `OK, closing ${fc.args?.appId}.`; break;
                                        case 'toggleMatrixEffect': toggleMatrixEffect(fc.args?.status as boolean); result = `Matrix effect set to ${fc.args?.status}.`; break;
                                        case 'changeWallpaper': setWallpaper(`https://picsum.photos/seed/${nanoid()}/1920/1080`); result = 'Wallpaper changed.'; break;
                                    }
                                } catch (e: any) { result = `Error: ${e.message}`; }
                                functionResponses.push({ id: fc.id, name: fc.name, response: { result: result } });
                            }
                            if (sessionRef.current) sessionRef.current.sendToolResponse({ functionResponses });
                        }
                        
                        if (message.serverContent?.outputTranscription) transcriptionState.current.output += message.serverContent.outputTranscription.text;
                        if (message.serverContent?.inputTranscription) transcriptionState.current.input += message.serverContent.inputTranscription.text;
                        
                        if (message.serverContent?.turnComplete) {
                            if (!lastTurnCompleteRef.current) {
                                // Process user input for AI but don't display in transcript
                                // if (transcriptionState.current.input.trim()) addTranscriptMessage({ source: 'user', text: transcriptionState.current.input.trim() });
                                if (transcriptionState.current.output.trim()) {
                                    const modelOutput = transcriptionState.current.output.trim();
                                    addTranscriptMessage({ source: 'model', text: modelOutput });
                                    speakText(modelOutput); // Accessibility: Speak the final output
                                }
                                transcriptionState.current = { input: '', output: '' };
                            }
                            lastTurnCompleteRef.current = true;
                        } else {
                            lastTurnCompleteRef.current = false;
                        }

                        const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (audioData && outputAudioContextRef.current) {
                            setLiveSessionState('speaking');
                            // Disconnect microphone input while AI is speaking to prevent feedback loop
                            if (scriptProcessorRef.current && inputAudioContextRef.current) {
                                try {
                                    scriptProcessorRef.current.disconnect(inputAudioContextRef.current.destination);
                                } catch (e) {
                                    console.warn("Error disconnecting script processor:", e);
                                }
                            }
                            const outputCtx = outputAudioContextRef.current;
                            const audioBuffer = await decodeAudioData(decode(audioData), outputCtx, OUTPUT_SAMPLE_RATE, 1);

                            const source = outputCtx.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputCtx.destination);

                            source.onended = () => {
                                audioSourcesRef.current.delete(source);
                                // Reconnect microphone input after AI speech ends
                                if (scriptProcessorRef.current && inputAudioContextRef.current && audioSourcesRef.current.size === 0) {
                                    try {
                                        scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
                                    } catch (e) {
                                        console.warn("Error reconnecting script processor:", e);
                                    }
                                    setLiveSessionState('listening');
                                }
                            };

                            const currentTime = outputCtx.currentTime;
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, currentTime);
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            audioSourcesRef.current.add(source);
                        }
                         if (message.serverContent?.interrupted) {
                            stopAudioPlayback();
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Live session error:', e);
                        setLiveSessionState('error');
                    },
                    onclose: () => {
                        console.log('Live session closed by server.');
                        stopSession();
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                    systemInstruction: 'You are a friendly and helpful OS assistant for Doors OS. You can open and close apps, change the wallpaper, and toggle special effects. Be concise.',
                    tools: [{ functionDeclarations: [openWindowTool, closeWindowTool, toggleMatrixTool, changeWallpaperTool] }],
                    outputAudioTranscription: { language: 'en' },
                    inputAudioTranscription: { language: 'en' },
                },
            });

            sessionRef.current = await sessionPromise;
        } catch (err) {
            console.error("Failed to start live session:", err);
            setLiveSessionState('error');
        }
    }, [setLiveSessionState, openWindow, closeWindowByAppId, toggleMatrixEffect, setWallpaper, stopAudioPlayback, resetTranscript]);

    useEffect(() => {
        return () => {
            stopSession(); // Cleanup on component unmount
        };
    }, [stopSession]);

    useEffect(() => {
        console.log('VoiceAssistant effect - hasWelcomed:', hasWelcomed, 'micPermissionGranted:', micPermissionGranted, 'liveSessionState:', liveSessionState, 'hasStarted:', hasStartedRef.current, 'hasInitialGreetingBeenSpoken:', hasInitialGreetingBeenSpoken);
        if (hasWelcomed && micPermissionGranted && liveSessionState === 'idle' && !hasStartedRef.current) {
            console.log('Starting VoiceAssistant session...');
            startSession();
        }
    }, [hasWelcomed, micPermissionGranted, liveSessionState, startSession]);

    useEffect(() => {
        if (hasWelcomed && micPermissionGranted && liveSessionState === 'listening' && !hasInitialGreetingBeenSpoken) {
            // Check if welcome audio is still playing
            const checkWelcomeAudio = () => {
                const welcomeAudio = document.querySelector('audio[src*="welcome"]') as HTMLAudioElement;
                if (!welcomeAudio || welcomeAudio.ended) {
                    console.log('Sending initial greeting message...');
                    setInitialGreetingSpoken(true);
                    // Send a text message to trigger the AI to speak the greeting
                    if (sessionRef.current) {
                        sessionRef.current.sendRealtimeInput({ text: 'Hello, how can I help you today?' });
                    }
                } else {
                    // Wait a bit and check again
                    setTimeout(checkWelcomeAudio, 100);
                }
            };
            checkWelcomeAudio();
        }
    }, [hasWelcomed, micPermissionGranted, liveSessionState, hasInitialGreetingBeenSpoken, setInitialGreetingSpoken]);

    const toggleVoiceAssistant = useCallback(() => {
        if (liveSessionState === 'idle' || liveSessionState === 'error') {
            hasStartedRef.current = false; // Reset flag to allow restart
            startSession();
        } else {
            stopSession();
        }
    }, [liveSessionState, startSession, stopSession]);

    const getStatusStyles = () => {
        switch (liveSessionState) {
            case 'connecting': return 'bg-yellow-500 animate-pulse';
            case 'listening': return 'bg-blue-500 animate-pulse';
            case 'speaking': return 'bg-cyan-400 scale-110 shadow-[0_0_20px_5px_rgba(0,255,255,0.7)]';
            case 'error': return 'bg-red-500';
            case 'idle': default: return 'bg-zinc-600';
        }
    };
    
    const getStatusText = () => {
         switch (liveSessionState) {
            case 'connecting': return 'Connecting...';
            case 'listening': return 'Listening...';
            case 'speaking': return 'Speaking...';
            case 'error': return 'Error - Click to Restart';
            default: return 'Click to Activate Assistant';
        }
    }

    const isActive = liveSessionState !== 'idle' && liveSessionState !== 'error';

    return (
        <div className="absolute bottom-12 right-6 z-9999 flex flex-col items-center group">
             <div className="absolute bottom-full mb-2 px-2 py-1 bg-black/70 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {getStatusText()}
            </div>
            <button
                onClick={toggleVoiceAssistant}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ease-in-out cursor-pointer border-2 border-white shadow-lg ${getStatusStyles()}`}
            >
                {isActive ? <Mic className="text-white w-6 h-6" /> : <MicOff className="text-white w-6 h-6" />}
            </button>
        </div>
    );
};

export default VoiceAssistant;
