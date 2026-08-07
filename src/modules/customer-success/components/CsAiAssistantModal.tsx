import React, { useState, useEffect } from 'react';
import { X, Sparkles, Send, Copy, Check, RefreshCw, Bot, User, FileText, Mail, HeartPulse } from 'lucide-react';

interface CsAiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
  contextData?: unknown;
}

export const CsAiAssistantModal: React.FC<CsAiAssistantModalProps> = ({
  isOpen,
  onClose,
  initialPrompt,
  contextData,
}) => {
  const [prompt, setPrompt] = useState<string>(initialPrompt || '');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (initialPrompt && isOpen && messages.length === 0) {
      handleSend(initialPrompt);
    }
  }, [initialPrompt, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (userPromptText?: string) => {
    const textToSend = userPromptText || prompt;
    if (!textToSend.trim() || isLoading) return;

    const userMsg = { role: 'user' as const, text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setPrompt('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          contextData: contextData || {},
        }),
      });

      const data = await res.json();
      const assistantText = data.answer || 'No response returned from AI Assistant.';
      setMessages((prev) => [...prev, { role: 'assistant', text: assistantText }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `Sorry, an error occurred while connecting to the CS AI Assistant: ${err instanceof Error ? err.message : String(err)}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const presetQuestions = [
    'Which paid accounts are at the highest risk of churning this month?',
    'Draft a friendly check-in email for a customer with declining health score.',
    'How can our CS team help customers adopt the Lead Manager and Purchase Order modules?',
    'Summarize the key CS action items for accounts needing attention.',
  ];

  return (
    <div id="ai-copilot-modal-overlay" className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div id="ai-copilot-modal" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl h-[80vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 my-auto">

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/30 text-amber-300 border border-indigo-500/40">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                IntoAEC CS AI Copilot
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  Gemini 2.5
                </span>
              </h3>
              <p className="text-xs text-slate-300">Non-technical Customer Success Assistant & Strategy Writer</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 bg-slate-800/80 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat History Container */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
          {messages.length === 0 ? (
            <div className="py-8 flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/60">
                <Bot className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  How can I assist your CS team today?
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Ask me to analyze account health, draft empathetic customer emails, or suggest feature adoption strategies in plain language.
                </p>
              </div>

              {/* Preset buttons */}
              <div className="w-full space-y-2 pt-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block text-left">
                  Suggested CS Questions:
                </span>
                {presetQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(q)}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-200 transition-all font-medium flex items-center justify-between group"
                  >
                    <span>"{q}"</span>
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
              >
                {msg.role === 'assistant' && (
                  <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`p-4 rounded-2xl max-w-[85%] text-xs sm:text-sm leading-relaxed ${msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700/60 rounded-bl-none shadow-sm'
                    }`}
                >
                  <div className="whitespace-pre-wrap">{msg.text}</div>

                  {msg.role === 'assistant' && (
                    <div className="mt-3 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Generated by Gemini CS Engine</span>
                      <button
                        onClick={() => handleCopy(msg.text, idx)}
                        className="flex items-center gap-1 font-semibold text-indigo-500 hover:text-indigo-400 transition-colors"
                      >
                        {copiedIndex === idx ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copy Response
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="p-2 rounded-xl bg-slate-800 text-slate-300 shrink-0 mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-400 text-xs flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                <span>CS AI Copilot is thinking...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask CS AI Copilot a question or request a draft..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="flex-1 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={!prompt.trim() || isLoading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
