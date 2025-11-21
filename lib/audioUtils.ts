export const playAudio = (src: string, sampleRate?: number) => {
    const audio = new Audio(src);
    audio.play().catch(err => console.error("Failed to play audio:", err));
};
