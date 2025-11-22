import React, { useState } from "react";
import { useKernel } from "../store/kernel";
import { motion } from "framer-motion";
import "./WelcomeScreen.css";

import { APPS } from "../apps.config";
import { Mic } from "lucide-react";
import AnimatedGenerateButton from "./animated-generate-button-shadcn-tailwind";

// Dynamically import all audio files from assets/audio/
const audioModules = import.meta.glob("../assets/audio/*.mp3", { eager: true });
const audioUrls = Object.values(audioModules).map(
  (module: any) => module.default
);

const WelcomeScreen: React.FC = () => {
  const setHasWelcomed = useKernel((state) => state.setHasWelcomed);
  const addEmail = useKernel((state) => state.addEmail);
  const setInitialGreetingSpoken = useKernel(
    (state) => state.setInitialGreetingSpoken
  );
  const setMicPermissionGranted = useKernel(
    (state) => state.setMicPermissionGranted
  );

  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [showMicPermission, setShowMicPermission] = useState(false);
  const [welcomeAudioPlaying, setWelcomeAudioPlaying] = useState(false);

  const isValidEmail = (email: string) => {
    if (email.toLowerCase() === "trad34") return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isAdminAccess = (email: string) => {
    return email.toLowerCase() === "trad34";
  };

  const canContinue = () => {
    return isValidEmail(email);
  };

  const requestMicPermission = async () => {
    try {
      console.log("Requesting microphone permission...");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      console.log("Microphone permission granted!");
      setMicPermissionGranted(true);
      // Immediately stop the stream - we don't need it yet
      stream.getTracks().forEach((track) => track.stop());
      // Start fade out immediately after mic permission is granted
      setIsFadingOut(true);
    } catch (error) {
      console.log("Mic permission denied or not available:", error);
      // Still allow TTS to work - just won't have voice input
      setMicPermissionGranted(false);
      // Still proceed to desktop
      setIsFadingOut(true);
    }
  };

  const skipMicPermission = () => {
    console.log("User skipped microphone permission");
    setMicPermissionGranted(false);
    setIsFadingOut(true);
  };

  const proceedWithWelcome = () => {
    if (email) {
      addEmail(email);
    }
    // Don't speak here - let VoiceAssistant handle the greeting
    setHasWelcomed(true);
    // Don't set initialGreetingSpoken here - let VoiceAssistant do it
  };

  const onFadeOutComplete = () => {
    proceedWithWelcome();
  };

  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFirstName(e.target.value);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleContinue = () => {
    if (canContinue()) {
      // Start welcome message immediately
      startWelcomeMessage();
      // Show mic permission popup
      setShowMicPermission(true);
      // Don't start fade out yet - wait for mic permission
    }
  };

  const startWelcomeMessage = () => {
    const welcomeAudioUrls = audioUrls.filter((url) => url.includes("welcome"));
    if (welcomeAudioUrls.length > 0) {
      const randomIndex = Math.floor(Math.random() * welcomeAudioUrls.length);
      const selectedUrl = welcomeAudioUrls[randomIndex];

      // Use Web Audio API for volume control and compression
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audio = new Audio(selectedUrl);

      // Create source node and connect to compressor for volume normalization
      const source = audioContext.createMediaElementSource(audio);
      const compressor = audioContext.createDynamicsCompressor();

      // Configure compressor to prevent volume spikes
      compressor.threshold.setValueAtTime(-24, audioContext.currentTime); // dB
      compressor.knee.setValueAtTime(30, audioContext.currentTime); // dB
      compressor.ratio.setValueAtTime(12, audioContext.currentTime); // ratio
      compressor.attack.setValueAtTime(0.003, audioContext.currentTime); // seconds
      compressor.release.setValueAtTime(0.25, audioContext.currentTime); // seconds

      // Gain node to control overall volume
      const gainNode = audioContext.createGain();
      gainNode.gain.setValueAtTime(0.4, audioContext.currentTime); // Overall volume at 40%

      // Connect: source -> compressor -> gain -> destination
      source.connect(compressor);
      compressor.connect(gainNode);
      gainNode.connect(audioContext.destination);

      setWelcomeAudioPlaying(true);

      // Start audio playback
      audio.play();

      audio.onended = () => {
        setWelcomeAudioPlaying(false);
        // Clean up audio context
        audioContext.close();
      };
    }
  };

  return (
    <motion.div
      className="h-screen w-screen bg-cover bg-center flex items-center justify-center p-4 welcome-screen-background"
      animate={{ opacity: isFadingOut ? 0 : 1 }}
      transition={{ duration: 3 }}
      onAnimationComplete={isFadingOut ? onFadeOutComplete : undefined}
    >
      <div className="bg-black/20 backdrop-blur-md rounded-xl p-8 shadow-2xl border border-white/20 w-full max-w-md flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-4"
        >
          <h1 className="text-4xl font-bold text-white">The Youniverse</h1>
        </motion.div>

        <div className="space-y-4 w-full">
          <div>
            <input
              type="text"
              value={firstName}
              onChange={handleFirstNameChange}
              placeholder="First Name"
              className="w-full px-4 py-2 bg-black/50 border border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder:text-zinc-400"
            />
          </div>
          <div>
            <input
              type="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="you@example.com"
              className="w-full px-4 py-2 bg-black/50 border border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder:text-zinc-400"
            />
          </div>
          <div className="relative">
            <AnimatedGenerateButton
              labelIdle="Enter the OS"
              onClick={handleContinue}
              className="w-full"
            />

            {showMicPermission && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-black/90 backdrop-blur-md rounded-lg p-4 shadow-xl border border-white/20 min-w-[280px] z-50"
              >
                <p className="text-white text-sm mb-3 text-center font-medium">
                  Enable Voice Assistant?
                </p>
                <p className="text-zinc-400 text-xs mb-4 text-center">
                  Microphone access allows voice commands (optional)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={skipMicPermission}
                    className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-md font-medium transition-colors text-sm"
                  >
                    Skip
                  </button>
                  <button
                    onClick={requestMicPermission}
                    className="flex-1 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-md font-semibold transition-colors text-sm"
                  >
                    Allow
                  </button>
                </div>
                <p className="text-zinc-500 text-[10px] mt-2 text-center">
                  Voice responses work without a microphone
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default WelcomeScreen;
