import React, { useState, useRef, useEffect } from 'react';
import apiService from '../utils/api';
import { cn } from '@/utils/cn';
import { useSelector } from 'react-redux';
import { selectRestaurantId } from '../features/auth/authSelectors';

const CustomizationModal = ({ item, onClose, onConfirm }) => {
  const restaurantId = useSelector(selectRestaurantId);

  const [messages, setMessages] = useState([
    {
      id: 'greeting',
      role: 'assistant',
      text: `Hi! Tell me how you'd like to customize ${item.name}. For example: "no onions, extra spicy, on the side".`,
    },
  ]);
  const [customizations, setCustomizations] = useState([]); // accumulated across the conversation
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Speech recognition setup
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = React.useMemo(() => (SpeechRecognition ? new SpeechRecognition() : null), [SpeechRecognition]);

  useEffect(() => {
    if (!recognition) return;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
  }, [recognition]);

  const toggleListen = () => {
    if (!recognition) return;
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  const mergeCustomizations = (existing, incoming) => {
    const merged = [...existing];
    incoming.forEach((c) => {
      const clean = c.trim();
      if (clean && !merged.some((e) => e.toLowerCase() === clean.toLowerCase())) {
        merged.push(clean);
      }
    });
    return merged;
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setMessages((prev) => [...prev, { id: Date.now() + '-u', role: 'user', text: trimmed }]);
    setInput('');
    setLoading(true);

    try {
      const data = await apiService.customizeOrder(trimmed, item._id || item.id, restaurantId);
      if (!data.success) throw new Error(data.message || 'Could not process that.');

      setCustomizations((prev) => mergeCustomizations(prev, data.customizations || []));
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + '-a',
          role: 'assistant',
          text: data.message || "Got it, I've added that.",
          customizations: data.customizations,
        },
      ]);
    } catch (err) {
      const fallback = trimmed
        .split(/,|and/i)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1));

      if (fallback.length > 0) {
        setCustomizations((prev) => mergeCustomizations(prev, fallback));
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + '-a', role: 'assistant', text: 'Added that to your order.', customizations: fallback },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + '-a',
            role: 'assistant',
            text: "I couldn't quite catch that. Try something like 'extra cheese' or 'no onions'.",
            isError: true,
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const removeCustomization = (index) => {
    setCustomizations((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDone = () => {
    onConfirm(customizations);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-2xl rounded-[2.5rem] w-full max-w-md h-[640px] shadow-[0_32px_64px_-15px_rgba(0,0,0,0.2)] border border-white relative overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-brand/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 px-8 pt-8 pb-4 border-b border-slate-100 flex items-start justify-between">
          <div>
            <p className="text-[10px] font-black text-brand uppercase tracking-[0.2em] mb-1">AI Personalization</p>
            <h2 className="text-2xl font-black text-slate-900 uppercase italic leading-none">
              Customize <span className="text-brand">{item.name}</span>
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1" aria-label="Close">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Chat messages */}
        <div className="relative z-10 flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {messages.map((m) => (
            <div key={m.id} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-4 py-3 text-sm font-medium',
                  m.role === 'user'
                    ? 'bg-brand text-white rounded-br-md'
                    : m.isError
                    ? 'bg-rose-50 text-rose-600 rounded-bl-md border border-rose-100'
                    : 'bg-slate-100 text-slate-700 rounded-bl-md'
                )}
              >
                {m.text}
                {m.customizations && m.customizations.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {m.customizations.map((c, i) => (
                      <span key={i} className="text-[10px] font-black uppercase tracking-wide bg-white/70 text-brand px-2 py-1 rounded-full">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-100 rounded-2xl rounded-bl-md px-4 py-3 flex gap-1">
                <span className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce [animation-delay:-0.3s]" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Accumulated customizations */}
        {customizations.length > 0 && (
          <div className="relative z-10 px-6 py-3 border-t border-slate-100 bg-slate-50/60">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Your customizations</p>
            <div className="flex flex-wrap gap-2">
              {customizations.map((c, i) => (
                <span key={i} className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide bg-brand/10 text-brand px-3 py-1.5 rounded-full">
                  {c}
                  <button onClick={() => removeCustomization(i)} className="hover:text-rose-500 transition-colors" aria-label={`Remove ${c}`}>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Input row */}
        <div className="relative z-10 px-6 py-4 border-t border-slate-100">
          <div className="flex items-end gap-2">
            <textarea
              className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl p-3 text-sm font-medium focus:ring-4 focus:ring-brand/10 focus:border-brand/20 outline-none transition-all resize-none text-slate-700 placeholder:text-slate-400 placeholder:text-[11px]"
              rows="1"
              placeholder={isListening ? 'Listening...' : 'Type a preference, e.g. no onions...'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              onClick={toggleListen}
              className={cn(
                'shrink-0 p-3 rounded-2xl transition-all duration-500 relative',
                isListening ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'bg-white text-brand shadow-md hover:shadow-lg border border-slate-100'
              )}
              aria-label="Voice input"
            >
              {isListening && <span className="absolute inset-0 rounded-2xl bg-rose-500 animate-ping opacity-40" />}
              <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-20a3 3 0 00-3 3v8a3 3 0 006 0V5a3 3 0 00-3-3z" />
              </svg>
            </button>
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className={cn(
                'shrink-0 p-3 rounded-2xl transition-all transform active:scale-95',
                loading || !input.trim() ? 'bg-slate-100 text-slate-400' : 'bg-brand text-white shadow-lg shadow-brand/30 hover:opacity-90'
              )}
              aria-label="Send"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 12h14" />
              </svg>
            </button>
          </div>
        </div>

        {/* Footer actions */}
        <div className="relative z-10 flex gap-4 px-6 pb-6 pt-2">
          <button onClick={onClose} className="flex-1 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleDone}
            disabled={customizations.length === 0}
            className={cn(
              'flex-1 font-black text-[10px] py-4 rounded-[1.2rem] shadow-xl transition-all transform active:scale-95 uppercase tracking-[0.15em]',
              customizations.length === 0 ? 'bg-slate-100 text-slate-400' : 'bg-brand text-white shadow-brand/30 hover:opacity-90'
            )}
          >
            Done ({customizations.length})
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomizationModal;