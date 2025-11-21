import { ChatMessage, GeminiModel, GroundingChunk, AppId } from '../types';
import { APPS } from "../apps.config";
import { buildTreeView } from '../lib/filesystemUtils';

const API_BASE = '/api'; // API base URL

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
  // updated to forward the `generationConfig` and `systemInstruction` properties to the Google API.
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

const openFileTool = {
  functionDeclarations: [{
    name: 'openFile',
    description: 'Opens a specific file in the appropriate viewer.',
    parameters: {
      type: 'OBJECT',
      properties: {
        fileId: {
          type: 'STRING',
          description: 'The ID of the file to open (e.g., "about-md", "resume-pdf").',
        },
      },
      required: ['fileId'],
    },
  }]
};

const getSystemInstruction = () => {
  const tree = buildTreeView('/');
  const fsContext = tree.join('\n');

  return {
    parts: [{
      text: `You are the OS Assistant for the user's Portfolio OS. 
    
    You have access to a virtual filesystem that represents the user's projects and skills. 
    Here is the current structure of the filesystem:
    
    ${fsContext}
    
    Your goal is to help the user navigate this portfolio.
    - If the user asks about a specific project, check if there is a file for it (e.g., README.md) and suggest opening it.
    - You can use the 'openWindow' tool to open applications.
    - You can use the 'openFile' tool to open specific files (use the ID, not the path).
    - Be concise, helpful, and immersive. You are part of this "Matrix-like" system.
    - Use Markdown for formatting your responses.
    `}]
  };
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

    const tools: any[] = [openWindowTool, openFileTool];
    if (useGrounding) {
      tools.push({ googleSearch: {} });
    }

    const response = await generateContent({
      model: model,
      contents: contents,
      tools,
      systemInstruction: getSystemInstruction(),
    });

    const candidate = response.candidates?.[0];
    if (!candidate) return { text: "No response from model." };

    const text = candidate.content?.parts?.find((p): p is { text: string } => 'text' in p)?.text || "";
    const functionCalls = candidate.content?.parts?.filter(p => 'functionCall' in p).map(p => (p as any).functionCall);
    const groundingChunks = candidate.groundingMetadata?.groundingChunks;

    return { text, groundingChunks, functionCalls };
  } catch (error: any) {
    console.error("Error generating response from Gemini:", error);
    const message = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("Full error object:", error);
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
