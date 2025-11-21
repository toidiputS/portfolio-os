import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useKernel } from '../../store/kernel';
import { ChatMessage, GeminiModel, ChatSession, AppId } from '../../types';
import { Send, Plus, Trash2, BrainCircuit, Bot, User, Globe } from 'lucide-react';
import { generateResponse, summarizeHistory, generateTitleForSession } from '../../services/geminiService';
import { APPS } from '../../apps.config';

const GeminiChat: React.FC = () => {
  const gemini = useKernel(state => state.gemini);
  const startNewChat = useKernel(state => state.startNewChat);
  const selectChatSession = useKernel(state => state.selectChatSession);
  const addMessageToSession = useKernel(state => state.addMessageToSession);
  const setGeminiLoading = useKernel(state => state.setGeminiLoading);
  const setGeminiModel = useKernel(state => state.setGeminiModel);
  const toggleSmartContext = useKernel(state => state.toggleSmartContext);
  const toggleGrounding = useKernel(state => state.toggleGrounding);
  const deleteChatSession = useKernel(state => state.deleteChatSession);
  const updateSessionTitle = useKernel(state => state.updateSessionTitle);
  const openWindow = useKernel(state => state.openWindow);

  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const currentSession = gemini.currentSessionId ? gemini.sessions[gemini.currentSessionId] : null;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);

  const handleSend = async () => {
    if (!input.trim() || !currentSession) return;

    const isNewChat = currentSession.messages.length === 0;

    setGeminiLoading(true);
    const userInput = input;
    setInput('');

    const userMessage: ChatMessage = { role: 'user', content: userInput };
    addMessageToSession(currentSession.id, userMessage);

    let finalPrompt = userInput;
    // Note: With the new proxy, history is sent but context summarization happens on the client
    const historyForAPI: ChatMessage[] = gemini.useSmartContext && currentSession.messages.length > 1
      ? [{ role: 'user', content: await summarizeHistory(currentSession.messages) }, userMessage]
      : [...currentSession.messages, userMessage];


    const { text: responseText, groundingChunks, functionCalls } = await generateResponse(userInput, gemini.model, historyForAPI, gemini.useGrounding);

    let modelMessage: ChatMessage | null = null;

    if (functionCalls && functionCalls.length > 0) {
      for (const fc of functionCalls) {
        if (fc.name === 'openWindow') {
          const { appId } = fc.args;
          if (appId && APPS.some(app => app.id === appId)) {
            openWindow(appId as AppId);
          } else {
            addMessageToSession(currentSession.id, { role: 'model', content: `Sorry, I can't find an application called "${appId}".` });
          }
        }
      }
    }

    if (responseText) {
      modelMessage = { role: 'model', content: responseText, groundingChunks };
      addMessageToSession(currentSession.id, modelMessage);
    } else if (functionCalls && functionCalls.length > 0) {
      const calledFunctions = functionCalls.map(fc => fc.name).join(', ');
      modelMessage = { role: 'model', content: `Understood. Executing action: ${calledFunctions}.` };
      addMessageToSession(currentSession.id, modelMessage);
    }

    if (isNewChat && modelMessage) {
      const newTitle = await generateTitleForSession([userMessage, modelMessage]);
      updateSessionTitle(currentSession.id, newTitle);
    }

    setGeminiLoading(false);
  };

  const sortedSessions = useMemo(() => {
    return Object.values(gemini.sessions).sort((a: ChatSession, b: ChatSession) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [gemini.sessions]);

  return (
    <div className="flex h-full bg-[hsl(var(--card-hsl))] text-[hsl(var(--card-foreground-hsl))]">
      {/* Sidebar */}
      <aside className="w-64 bg-[hsl(var(--background-hsl))] p-2 flex flex-col">
        <button onClick={startNewChat} className="flex items-center justify-center gap-2 w-full p-2 mb-4 text-sm bg-[hsl(var(--accent-strong-hsl))] text-[hsl(var(--accent-foreground-hsl))] hover:brightness-90 rounded-md transition-all">
          <Plus size={16} /> New Chat
        </button>
        <div className="grow overflow-y-auto pr-1">
          {sortedSessions.map((session: ChatSession) => (
            <div key={session.id} onClick={() => selectChatSession(session.id)}
              className={`flex justify-between items-center p-2 mb-1 text-sm rounded-md cursor-pointer transition-colors ${gemini.currentSessionId === session.id ? 'bg-[hsl(var(--muted-hsl))]' : 'hover:bg-[hsl(var(--secondary-hsl))]'
                }`}>
              <span className="truncate grow mr-2">{session.title}</span>
              <button type="button" title="Delete chat session" onClick={(e) => { e.stopPropagation(); deleteChatSession(session.id); }} className="p-1 text-[hsl(var(--muted-foreground-hsl))] hover:text-[hsl(var(--destructive-hsl))] opacity-50 hover:opacity-100 shrink-0">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col">
        <header className="flex items-center justify-between p-2 border-b border-[hsl(var(--border-hsl))]">
          <h2 className="text-lg font-semibold">{currentSession?.title || 'Gemini Chat'}</h2>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer" title="Use Google Search for up-to-date info">
              <Globe size={16} className={gemini.useGrounding ? 'text-[hsl(var(--accent-hsl))]' : 'text-[hsl(var(--muted-foreground-hsl))]'} />
              <span className={gemini.useGrounding ? '' : 'text-[hsl(var(--muted-foreground-hsl))]'}>Search</span>
              <input type="checkbox" checked={gemini.useGrounding} onChange={toggleGrounding} className="sr-only" />
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer" title="Summarize conversation for context">
              <BrainCircuit size={16} className={gemini.useSmartContext ? 'text-[hsl(var(--accent-hsl))]' : 'text-[hsl(var(--muted-foreground-hsl))]'} />
              <span className={gemini.useSmartContext ? '' : 'text-[hsl(var(--muted-foreground-hsl))]'}>Context</span>
              <input type="checkbox" checked={gemini.useSmartContext} onChange={toggleSmartContext} className="sr-only" />
            </label>
            <select
              title="Model"
              value={gemini.model}
              onChange={(e) => setGeminiModel(e.target.value as GeminiModel)}
              className="bg-[hsl(var(--secondary-hsl))] border border-[hsl(var(--border-hsl))] rounded-md p-1 text-sm focus:outline-none"
            >
              <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
              <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
            </select>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {currentSession?.messages.map((msg, index) => (
            <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'model' && <Bot className="w-6 h-6 shrink-0 text-[hsl(var(--accent-hsl))]" />}
              <div className={`max-w-xl p-3 rounded-lg ${msg.role === 'user' ? 'bg-[hsl(var(--accent-strong-hsl))] text-[hsl(var(--accent-foreground-hsl))]' : 'bg-[hsl(var(--secondary-hsl))]'}`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[hsl(var(--border-hsl))]">
                    <h4 className="text-xs font-semibold text-[hsl(var(--muted-foreground-hsl))] mb-1">Sources:</h4>
                    <ol className="list-decimal list-inside text-xs space-y-1">
                      {msg.groundingChunks.map((chunk, i) => (
                        chunk.web ? (
                          <li key={i}>
                            <a
                              href={chunk.web.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[hsl(var(--accent-hsl))] hover:underline truncate"
                              title={chunk.web.uri}
                            >
                              {chunk.web.title || chunk.web.uri}
                            </a>
                          </li>
                        ) : null
                      ))}
                    </ol>
                  </div>
                )}
              </div>
              {msg.role === 'user' && <User className="w-6 h-6 shrink-0" />}
            </div>
          ))}
          {gemini.isLoading && (
            <div className="flex items-start gap-3">
              <Bot className="w-6 h-6 shrink-0 text-[hsl(var(--accent-hsl))]" />
              <div className="max-w-xl p-3 rounded-lg bg-[hsl(var(--secondary-hsl))] animate-pulse">
                <div className="h-4 bg-[hsl(var(--muted-hsl))] rounded w-24"></div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="p-4 border-t border-[hsl(var(--border-hsl))]">
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Message Gemini..."
              className="w-full bg-[hsl(var(--secondary-hsl))] border border-[hsl(var(--border-hsl))] rounded-lg p-3 pr-12 resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring-hsl))]"
              rows={1}
              disabled={gemini.isLoading}
            />
            <button
              title="Send message"
              onClick={handleSend}
              disabled={gemini.isLoading || !input.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-[hsl(var(--accent-strong-hsl))] text-[hsl(var(--accent-foreground-hsl))] disabled:bg-[hsl(var(--muted-hsl))] hover:brightness-90 transition-all"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default GeminiChat;
