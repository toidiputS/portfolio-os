
// Base64 encoding function
export function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Base64 decoding function
export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Custom decoder for raw PCM audio data
export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

let audioContext: AudioContext | null = null;
const getAudioContext = async (sampleRate: number) => {
  if (!audioContext || audioContext.state === 'closed' || audioContext.sampleRate !== sampleRate) {
    if (audioContext && audioContext.state !== 'closed') {
        audioContext.close();
    }
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate });
  }
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }
  return audioContext;
};

export const playAudio = async (base64Audio: string, sampleRate: number): Promise<void> => {
    if (!base64Audio) return;

    try {
        const ctx = await getAudioContext(sampleRate);
        const audioBuffer = await decodeAudioData(
            decode(base64Audio),
            ctx,
            sampleRate,
            1,
        );

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.start();

        return new Promise(resolve => {
            source.onended = () => resolve();
        });
    } catch (error) {
        console.error("Error playing audio:", error);
    }
};
