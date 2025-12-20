import React, { useState, useEffect, useRef, useMemo } from "react";
import { useKernel } from "../../store/kernel";
import { ChatMessage, GeminiModel, ChatSession, AppId } from "../../types";
import {
  Send,
  Plus,
  Trash2,
  BrainCircuit,
  Bot,
  User,
  Globe,
  Sparkles,
  Terminal as TerminalIcon,
} from "lucide-react";
import {
  generateResponse,
  summarizeHistory,
  generateTitleForSession,
} from "../../services/geminiService";
import { APPS } from "../../apps.config";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { GlowCard } from "../../components/GlowCard";

const GeminiChat: React.FC = () => {
  const gemini = useKernel((state) => state.gemini);
  const startNewChat = useKernel((state) => state.startNewChat);
  const selectChatSession = useKernel((state) => state.selectChatSession);
  const addMessageToSession = useKernel((state) => state.addMessageToSession);
  const setGeminiLoading = useKernel((state) => state.setGeminiLoading);
  const setGeminiModel = useKernel((state) => state.setGeminiModel);
  const toggleSmartContext = useKernel((state) => state.toggleSmartContext);
  const toggleGrounding = useKernel((state) => state.toggleGrounding);
  const deleteChatSession = useKernel((state) => state.deleteChatSession);
  const updateSessionTitle = useKernel((state) => state.updateSessionTitle);
  const openWindow = useKernel((state) => state.openWindow);
  const openFile = useKernel((state) => state.openFile);

  const [input, setInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const currentSession = gemini.currentSessionId
    ? gemini.sessions[gemini.currentSessionId]
    : null;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentSession?.messages, gemini.isLoading]);

  const handleSend = async () => {
    if (!input.trim() || !currentSession) return;

    const isNewChat = currentSession.messages.length === 0;

    setGeminiLoading(true);
    const userInput = input;
    setInput("");

    const userMessage: ChatMessage = { role: "user", content: userInput };
    addMessageToSession(currentSession.id, userMessage);

    const historyForAPI: ChatMessage[] =
      gemini.useSmartContext && currentSession.messages.length > 1
        ? [
            {
              role: "user",
              content: await summarizeHistory(currentSession.messages),
            },
            userMessage,
          ]
        : [...currentSession.messages, userMessage];

    const {
      text: responseText,
      groundingChunks,
      functionCalls,
    } = await generateResponse(
      userInput,
      gemini.model,
      historyForAPI,
      gemini.useGrounding
    );

    let modelMessage: ChatMessage | null = null;

    if (functionCalls && functionCalls.length > 0) {
      for (const fc of functionCalls) {
        if (fc.name === "openWindow") {
          const { appId } = fc.args;
          if (appId && APPS.some((app) => app.id === appId)) {
            openWindow(appId as AppId);
          } else {
            addMessageToSession(currentSession.id, {
              role: "model",
              content: `Sorry, I can't find an application called "${appId}".`,
            });
          }
        } else if (fc.name === "openFile") {
          const { fileId } = fc.args;
          if (fileId) {
            openFile(fileId);
          }
        }
      }
    }

    if (responseText) {
      modelMessage = { role: "model", content: responseText, groundingChunks };
      addMessageToSession(currentSession.id, modelMessage);
    } else if (functionCalls && functionCalls.length > 0) {
      const calledFunctions = functionCalls.map((fc) => fc.name).join(", ");
      modelMessage = {
        role: "model",
        content: `Understood. Executing action: ${calledFunctions}.`,
      };
      addMessageToSession(currentSession.id, modelMessage);
    }

    if (isNewChat && modelMessage) {
      const newTitle = await generateTitleForSession([
        userMessage,
        modelMessage,
      ]);
      updateSessionTitle(currentSession.id, newTitle);
    }

    setGeminiLoading(false);
  };

  const sortedSessions = useMemo(() => {
    return Object.values(gemini.sessions).sort(
      (a: ChatSession, b: ChatSession) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [gemini.sessions]);

  return (
    <div className="flex h-full bg-[hsl(var(--card-hsl))] text-[hsl(var(--card-foreground-hsl))] font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-[hsl(var(--background-hsl))] border-r border-[hsl(var(--border-hsl))] flex flex-col">
        <div className="p-4 border-b border-[hsl(var(--border-hsl))]">
          <button
            onClick={startNewChat}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 text-sm font-medium bg-[hsl(var(--primary-hsl))] text-[hsl(var(--primary-foreground-hsl))] hover:brightness-110 rounded-lg transition-all shadow-sm"
          >
            <Plus size={16} /> New Chat
          </button>
        </div>
        <div className="grow overflow-y-auto p-2 space-y-1">
          {sortedSessions.map((session: ChatSession) => (
            <div
              key={session.id}
              onClick={() => selectChatSession(session.id)}
              className={`group flex justify-between items-center p-2.5 text-sm rounded-lg cursor-pointer transition-all ${
                gemini.currentSessionId === session.id
                  ? "bg-[hsl(var(--accent-hsl))/0.1] text-[hsl(var(--accent-hsl))] font-medium"
                  : "hover:bg-[hsl(var(--secondary-hsl))] text-[hsl(var(--muted-foreground-hsl))] hover:text-[hsl(var(--foreground-hsl))]"
              }`}
            >
              <span className="truncate grow mr-2">{session.title}</span>
              <button
                type="button"
                title="Delete chat session"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteChatSession(session.id);
                }}
                className="p-1.5 rounded-md text-[hsl(var(--muted-foreground-hsl))] hover:bg-[hsl(var(--destructive-hsl))/0.1] hover:text-[hsl(var(--destructive-hsl))] opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col bg-[hsl(var(--card-hsl))] relative">
        <header className="flex items-center justify-between px-6 py-3 border-b border-[hsl(var(--border-hsl))] bg-[hsl(var(--card-hsl))/0.8] backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[hsl(var(--accent-hsl))/0.1] text-[hsl(var(--accent-hsl))]">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold">
                {currentSession?.title || "New Conversation"}
              </h2>
              <p className="text-xs text-[hsl(var(--muted-foreground-hsl))] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>
                {gemini.model === "gemini-1.5-flash"
                  ? "Gemini Flash"
                  : gemini.model === "gemini-1.5-pro"
                  ? "Gemini Pro"
                  : gemini.model === "claude-haiku-4.5"
                  ? "Claude Haiku 4.5"
                  : gemini.model}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-[hsl(var(--secondary-hsl))] p-1 rounded-lg border border-[hsl(var(--border-hsl))]">
            <button
              onClick={toggleGrounding}
              className={`p-1.5 rounded-md transition-all ${
                gemini.useGrounding
                  ? "bg-[hsl(var(--background-hsl))] text-[hsl(var(--accent-hsl))] shadow-sm"
                  : "text-[hsl(var(--muted-foreground-hsl))] hover:text-[hsl(var(--foreground-hsl))]"
              }`}
              title="Web Search (Grounding)"
            >
              <Globe size={16} />
            </button>
            <button
              onClick={toggleSmartContext}
              className={`p-1.5 rounded-md transition-all ${
                gemini.useSmartContext
                  ? "bg-[hsl(var(--background-hsl))] text-[hsl(var(--accent-hsl))] shadow-sm"
                  : "text-[hsl(var(--muted-foreground-hsl))] hover:text-[hsl(var(--foreground-hsl))]"
              }`}
              title="Smart Context"
            >
              <BrainCircuit size={16} />
            </button>
            <div className="w-px h-4 bg-[hsl(var(--border-hsl))] mx-1"></div>
            <select
              title="Model"
              value={gemini.model}
              onChange={(e) => setGeminiModel(e.target.value as GeminiModel)}
              className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer text-[hsl(var(--foreground-hsl))]"
            >
              <option value="gemini-1.5-flash">Flash 1.5</option>
              <option value="gemini-1.5-pro">Pro 1.5</option>
              <option value="claude-haiku-4.5">Claude Haiku 4.5</option>
              <option value="local-assistant">Local Assistant</option>
            </select>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
          <AnimatePresence initial={false}>
            {currentSession?.messages.map((msg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex items-start gap-4 ${
                  msg.role === "user" ? "justify-end" : ""
                }`}
              >
                {msg.role === "model" && (
                  <div className="w-8 h-8 rounded-full bg-[hsl(var(--accent-hsl))] flex items-center justify-center text-white shrink-0 mt-1 shadow-lg shadow-[hsl(var(--accent-hsl))/0.2]">
                    <Bot size={16} />
                  </div>
                )}

                <div className="max-w-2xl">
                  <GlowCard
                    glowColor={msg.role === "user" ? "blue" : "purple"}
                    customSize={true}
                    className={`w-full p-4 aspect-auto! grid-rows-1! ${
                      msg.role === "user" ? "rounded-tr-sm" : "rounded-tl-sm"
                    }`}
                  >
                    <div className="prose prose-sm dark:prose-invert max-w-none wrap-break-word">
                      <ReactMarkdown
                        components={{
                          code({ node, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(
                              className || ""
                            );
                            return match ? (
                              <div className="rounded-md overflow-hidden my-2 border border-[hsl(var(--border-hsl))]">
                                <div className="bg-[hsl(var(--muted-hsl))] px-3 py-1 text-xs font-mono text-[hsl(var(--muted-foreground-hsl))] border-b border-[hsl(var(--border-hsl))] flex items-center gap-2">
                                  <TerminalIcon size={12} />
                                  {match[1]}
                                </div>
                                <pre className="bg-[hsl(var(--background-hsl))] p-3 overflow-x-auto m-0">
                                  <code className={className} {...props}>
                                    {children}
                                  </code>
                                </pre>
                              </div>
                            ) : (
                              <code
                                className="bg-[hsl(var(--muted-hsl))] px-1.5 py-0.5 rounded text-xs font-mono"
                                {...props}
                              >
                                {children}
                              </code>
                            );
                          },
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>

                    {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-[hsl(var(--border-hsl))/0.5]">
                        <h4 className="text-[10px] uppercase tracking-wider font-bold opacity-50 mb-2 flex items-center gap-1">
                          <Globe size={10} /> Sources
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {msg.groundingChunks.map((chunk, i) =>
                            chunk.web ? (
                              <a
                                key={i}
                                href={chunk.web.uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs bg-[hsl(var(--background-hsl))] hover:bg-[hsl(var(--accent-hsl))/0.1] border border-[hsl(var(--border-hsl))] hover:border-[hsl(var(--accent-hsl))] px-2 py-1 rounded-md transition-all truncate max-w-[200px] flex items-center gap-1"
                                title={chunk.web.uri}
                              >
                                <span className="truncate">
                                  {chunk.web.title ||
                                    new URL(chunk.web.uri).hostname}
                                </span>
                              </a>
                            ) : null
                          )}
                        </div>
                      </div>
                    )}
                  </GlowCard>
                </div>

                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-[hsl(var(--muted-hsl))] flex items-center justify-center text-[hsl(var(--muted-foreground-hsl))] shrink-0 mt-1">
                    <User size={16} />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {gemini.isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-4"
            >
              <div className="w-8 h-8 rounded-full bg-[hsl(var(--accent-hsl))] flex items-center justify-center text-white shrink-0 mt-1 shadow-lg shadow-[hsl(var(--accent-hsl))/0.2]">
                <Bot size={16} />
              </div>
              <div className="p-4 rounded-2xl rounded-tl-sm bg-[hsl(var(--secondary-hsl))] border border-[hsl(var(--border-hsl))]">
                <div className="flex gap-1.5">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                    className="w-2 h-2 rounded-full bg-[hsl(var(--accent-hsl))]"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                    className="w-2 h-2 rounded-full bg-[hsl(var(--accent-hsl))]"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                    className="w-2 h-2 rounded-full bg-[hsl(var(--accent-hsl))]"
                  />
                </div>
              </div>
            </motion.div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="p-4 border-t border-[hsl(var(--border-hsl))] bg-[hsl(var(--card-hsl))]">
          <div className="relative max-w-4xl mx-auto">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask anything..."
              className="w-full bg-[hsl(var(--secondary-hsl))] border border-[hsl(var(--border-hsl))] rounded-xl p-4 pr-14 resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring-hsl))] focus:border-transparent shadow-sm transition-all min-h-[60px]"
              rows={1}
              disabled={gemini.isLoading}
            />
            <button
              title="Send message"
              onClick={handleSend}
              disabled={gemini.isLoading || !input.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-lg bg-[hsl(var(--primary-hsl))] text-[hsl(var(--primary-foreground-hsl))] disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition-all shadow-sm"
            >
              <Send size={18} />
            </button>
          </div>
          <p className="text-center text-[10px] text-[hsl(var(--muted-foreground-hsl))] mt-2">
            Gemini can make mistakes. Check important info.
          </p>
        </div>
      </main>
    </div>
  );
};

export default GeminiChat;
