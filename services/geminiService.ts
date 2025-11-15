
import { ChatMessage, GeminiModel, GroundingChunk, AppId } from '../types';
import { APPS } from "../apps.config";

const API_BASE = '/api'; // API base URL
const DEFAULT_MODEL = 'gemini-2.5-flash';

type GeminiPart = { text: string } | { functionCall: any } | { inlineData: { mimeType: string; data: string } };

interface GeminiApiResponse {
  candidates?: Array<{
    content?: {
      parts?: GeminiPart[];
      role?: string;
    };
    finishReason?: string;
    groundingMetadata?: {
      groundingChunks?: GroundingChunk[];
    };
  }>;
  error?: {
    code?: number;
    message?: string;
  };
}

async function generateContent(payload: { model: string; contents: any[]; generationConfig?: any; tools?: any[]; systemInstruction?: any }): Promise<GeminiApiResponse> {
  // NOTE: This client assumes the user's server-side proxy (`server/proxy.js`) will be
  // updated to forward the `generationConfig` and `systemInstruction` properties to the Google API,
  // as they are required for summarization, title generation, and text-to-speech.
  const res = await fetch(`${API_BASE}/gemini:generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  let data: GeminiApiResponse;
  try {
    data = await res.json();
  } catch (e) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }

  if (!res.ok || data.error) {
    const errorMsg = data.error?.message || (typeof data.error === 'string' ? data.error : 'Unknown API proxy error');
    console.error("Error from Gemini proxy:", errorMsg, data);
    throw new Error(errorMsg);
  }
  return data;
}

const appIdsList = APPS.map(app => `'${app.id}' ('${app.name}')`).join(', ');

const openWindowTool = {
    functionDeclarations: [{
        name: 'openWindow',
        description: 'Opens a specified application window on the desktop.',
        parameters: {
            type: 'OBJECT',
            properties: {
                appId: {
                    type: 'STRING',
                    description: `The unique identifier for the application to open. Available apps are: ${appIdsList}.`,
                },
            },
            required: ['appId'],
        },
    }]
};

export const generateResponse = async (
  prompt: string,
  model: GeminiModel,
  history: ChatMessage[],
  useGrounding: boolean
): Promise<{ text: string; groundingChunks?: GroundingChunk[]; functionCalls?: any[] }> => {
  try {
    const contents = [
      ...history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }],
      })),
      { role: "user", parts: [{ text: prompt }] },
    ];

    const tools: any[] = [openWindowTool];
    if (useGrounding) {
        tools.push({googleSearch: {}});
    }

    const response = await generateContent({
      model: model,
      contents: contents,
      tools,
    });
    
    const candidate = response.candidates?.[0];
    if (!candidate) return { text: "No response from model." };

    // FIX: Use a type guard to safely access the 'text' property from the parts array.
    const text = candidate.content?.parts?.find((p): p is { text: string } => 'text' in p)?.text || "";
    const functionCalls = candidate.content?.parts?.filter(p => 'functionCall' in p).map(p => (p as any).functionCall);
    const groundingChunks = candidate.groundingMetadata?.groundingChunks;
    
    return { text, groundingChunks, functionCalls };
  } catch (error: any) {
    console.error("Error generating response from Gemini:", error);
    const message = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("Full error object:", error); // Log the full error object
    return { text: `Sorry, I encountered an error: ${message}` };
  }
};

export const summarizeHistory = async (history: ChatMessage[]): Promise<string> => {
    if (history.length === 0) return "";
    try {
        const conversationText = history.map(m => `${m.role}: ${m.content}`).join('\n');
        const prompt = `Please provide a very concise, one-sentence summary of the following conversation to use as context for the next prompt. The summary should capture the main topic or last key point. Conversation:\n\n${conversationText}`;

        const response = await generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              maxOutputTokens: 50,
            }
        });
        
        // FIX: Safely access the 'text' property after checking the part type.
        const part = response.candidates?.[0]?.content?.parts?.[0];
        const text = (part && 'text' in part) ? part.text : "";
        return `(Context: ${text.trim()})`;
    } catch (error: any) {
          console.error("Error summarizing history:", error);
          console.error("Full error object:", error);
          return "";
      }
};

export const generateTitleForSession = async (history: ChatMessage[]): Promise<string> => {
    if (history.length < 2) return "New Chat";
    try {
        const conversationText = history.map(m => `${m.role}: ${m.content}`).join('\n').substring(0, 1000);
        const prompt = `Based on this conversation, create a short, descriptive title (3-5 words max).\n\n${conversationText}`;
        
        const response = await generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                maxOutputTokens: 20,
            }
        });

        // FIX: Safely access the 'text' property after checking the part type.
        const part = response.candidates?.[0]?.content?.parts?.[0];
        const text = (part && 'text' in part) ? part.text : "Chat Summary";
        let title = text.trim().replace(/["']/g, "");
        if (title.length > 50) title = title.substring(0, 47) + "...";
        return title;
    } catch (error: any) {
          console.error("Error generating title:", error);
          console.error("Full error object:", error);
          return "Chat Summary";
      }
};
