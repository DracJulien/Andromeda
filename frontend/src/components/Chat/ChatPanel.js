import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Trash2, Sparkles, AlertTriangle, Info, Zap, Loader } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const API = process.env.REACT_APP_BACKEND_URL;

function getAuthHeaders() {
  const token = localStorage.getItem('orbit_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

function ChatMessage({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div data-testid={`chat-msg-${msg.message_id || 'temp'}`}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-[85%] ${isUser
        ? 'bg-orbit-blue/20 border border-orbit-blue/30 rounded-sm rounded-br-none'
        : 'bg-white/[0.03] border border-white/[0.06] rounded-sm rounded-bl-none'
      } px-4 py-3`}>
        {isUser ? (
          <p className="text-sm text-gray-200">{msg.content}</p>
        ) : (
          <div className="prose prose-sm prose-invert max-w-none
            prose-p:text-gray-300 prose-p:text-sm prose-p:leading-relaxed prose-p:my-1
            prose-strong:text-white prose-strong:font-semibold
            prose-li:text-gray-300 prose-li:text-sm prose-li:my-0.5
            prose-code:text-orbit-blue prose-code:bg-orbit-blue/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded-sm prose-code:text-xs prose-code:font-mono
            prose-table:text-xs prose-th:text-gray-400 prose-th:font-mono prose-th:uppercase prose-th:text-[10px] prose-th:tracking-wider prose-th:border-b prose-th:border-white/10 prose-th:pb-2
            prose-td:text-gray-300 prose-td:py-1.5 prose-td:border-b prose-td:border-white/[0.04]
            prose-headings:text-white prose-headings:font-heading prose-headings:uppercase prose-headings:tracking-wide
            prose-h1:text-lg prose-h2:text-base prose-h3:text-sm
            prose-ul:my-1 prose-ol:my-1
            prose-a:text-orbit-blue prose-a:no-underline hover:prose-a:underline
          ">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
          </div>
        )}
        <p className="text-[9px] font-mono text-gray-600 mt-1.5">
          {msg.created_at ? new Date(msg.created_at).toLocaleTimeString() : ''}
        </p>
      </div>
    </div>
  );
}

function SuggestionChip({ suggestion, onClick }) {
  const icons = { error: AlertTriangle, info: Info, warn: Zap };
  const colors = {
    error: 'border-red-900/50 text-red-400 bg-red-900/10 hover:bg-red-900/20',
    info: 'border-orbit-blue/30 text-orbit-blue bg-orbit-blue/10 hover:bg-orbit-blue/20',
    warn: 'border-yellow-900/50 text-yellow-400 bg-yellow-900/10 hover:bg-yellow-900/20',
  };
  const Icon = icons[suggestion.type] || Info;
  const color = colors[suggestion.type] || colors.info;

  return (
    <button
      data-testid={`suggestion-chip-${suggestion.type}`}
      onClick={() => onClick(suggestion.action)}
      className={`w-full text-left px-3 py-2.5 rounded-sm border text-xs leading-relaxed transition-colors ${color}`}
    >
      <div className="flex items-start gap-2">
        <Icon size={12} className="flex-shrink-0 mt-0.5" />
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{ p: ({ children }) => <span>{children}</span> }}
        >
          {suggestion.message}
        </ReactMarkdown>
      </div>
    </button>
  );
}

export default function ChatPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/chat/history?limit=50`, {
        credentials: 'include', headers: getAuthHeaders(),
      });
      if (res.ok) setMessages(await res.json());
    } catch {}
  }, []);

  const loadSuggestions = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/chat/suggestions`, {
        credentials: 'include', headers: getAuthHeaders(),
      });
      if (res.ok) setSuggestions(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    if (open) {
      loadHistory();
      loadSuggestions();
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open, loadHistory, loadSuggestions]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || sending) return;

    const tempMsg = {
      message_id: `temp-${Date.now()}`,
      role: 'user',
      content: msg,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);
    setInput('');
    setSending(true);
    setSuggestions([]);

    try {
      const res = await fetch(`${API}/api/chat/send`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ message: msg }),
      });
      const data = await res.json();

      const aiMsg = {
        message_id: data.message_id || `ai-${Date.now()}`,
        role: 'assistant',
        content: data.message || 'Erreur de traitement.',
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      setMessages(prev => [...prev, {
        message_id: `err-${Date.now()}`,
        role: 'assistant',
        content: 'Erreur de connexion. Veuillez reessayer.',
        created_at: new Date().toISOString(),
      }]);
    }
    setSending(false);
  };

  const clearHistory = async () => {
    await fetch(`${API}/api/chat/history`, {
      method: 'DELETE', credentials: 'include', headers: getAuthHeaders(),
    });
    setMessages([]);
    loadSuggestions();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Toggle button */}
      <motion.button
        data-testid="chat-toggle-btn"
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full flex items-center justify-center shadow-[0_0_25px_rgba(0,112,243,0.4)] transition-colors ${
          open ? 'bg-[#1F2937] text-gray-300' : 'bg-orbit-blue text-white'
        }`}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            data-testid="chat-panel"
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-30 w-full sm:w-[420px] bg-orbit-panel border-l border-[#1F2937] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1F2937] flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-orbit-blue/20 flex items-center justify-center">
                  <Sparkles size={14} className="text-orbit-blue" />
                </div>
                <div>
                  <p className="text-sm font-heading font-semibold uppercase tracking-wide text-white">
                    Assistant Orbit
                  </p>
                  <p className="text-[9px] font-mono text-gray-500">Gemini 2.5 Flash</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  data-testid="clear-chat-btn"
                  onClick={clearHistory}
                  className="p-1.5 rounded-sm text-gray-500 hover:text-red-400 hover:bg-red-900/10 transition-colors"
                  title="Effacer l'historique"
                >
                  <Trash2 size={14} />
                </button>
                <button
                  data-testid="close-chat-btn"
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-sm text-gray-500 hover:text-gray-300 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-0">
              {messages.length === 0 && suggestions.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-orbit-blue/10 flex items-center justify-center">
                    <Sparkles size={22} className="text-orbit-blue" />
                  </div>
                  <p className="text-sm text-gray-300 font-medium mb-1">Bonjour !</p>
                  <p className="text-xs text-gray-500 max-w-[260px] mx-auto">
                    Je suis votre assistant Orbit. Posez-moi des questions sur vos proprietes, reservations, ou agents.
                  </p>
                  <div className="mt-4 space-y-2">
                    {[
                      'Montre-moi toutes mes proprietes',
                      'Quelles reservations arrivent cette semaine ?',
                      'Quel est le statut du systeme ?',
                    ].map((q) => (
                      <button
                        key={q}
                        onClick={() => sendMessage(q)}
                        className="block w-full text-left px-3 py-2 rounded-sm bg-white/[0.02] border border-white/[0.06] text-xs text-gray-400 hover:text-gray-200 hover:bg-white/[0.04] transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {messages.length === 0 && suggestions.length > 0 && (
                <div className="space-y-2 mb-4">
                  <p className="text-[9px] font-mono uppercase tracking-widest text-gray-600 mb-2">Suggestions</p>
                  {suggestions.map((s, i) => (
                    <SuggestionChip key={i} suggestion={s} onClick={sendMessage} />
                  ))}
                </div>
              )}

              {messages.map((msg) => (
                <ChatMessage key={msg.message_id} msg={msg} />
              ))}

              {sending && (
                <div className="flex justify-start mb-3">
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-sm rounded-bl-none px-4 py-3">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Loader size={12} className="animate-spin text-orbit-blue" />
                      <span className="font-mono">Analyse en cours...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-[#1F2937] p-3 flex-shrink-0">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  data-testid="chat-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Demandez quelque chose..."
                  rows={1}
                  className="flex-1 px-3 py-2.5 bg-orbit-surface border border-[#1F2937] rounded-sm text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-orbit-blue transition-colors font-mono resize-none"
                  style={{ minHeight: '40px', maxHeight: '100px' }}
                />
                <button
                  data-testid="send-chat-btn"
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || sending}
                  className="p-2.5 rounded-sm bg-orbit-blue text-white hover:bg-orbit-blue-hover transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_10px_rgba(0,112,243,0.3)]"
                >
                  <Send size={16} />
                </button>
              </div>
              <p className="mt-1.5 text-[9px] font-mono text-gray-700 text-center">
                Propulse par Gemini 2.5 Flash
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
