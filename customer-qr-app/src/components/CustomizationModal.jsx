import React, { useState, useEffect } from 'react';
import apiService from '../utils/api';
import { cn } from '@/utils/cn';
import { useSelector } from 'react-redux';
import { selectRestaurantId } from '../features/auth/authSelectors';

const CustomizationModal = ({ item, onClose, onConfirm }) => {
  const restaurantId = useSelector(selectRestaurantId);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isListening, setIsListening] = useState(false);

  

  // Initialize Speech Recognition
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = React.useMemo(() => (SpeechRecognition ? new SpeechRecognition() : null), [SpeechRecognition]);

  if (recognition) {
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setText(transcript);
      setIsListening(false);
      setFeedback("Got it! Let's process that.");
    };

    recognition.onerror = () => {
      setIsListening(false);
      setFeedback("Voice error. Please try typing.");
    };
  }

  const toggleListen = () => {
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      setFeedback("Listening to your request...");
      recognition.start();
      setIsListening(true);
    }
  };

  const handleAIProcess = async () => {
    
    if (!text) return;
    setLoading(true);
    try {
      const data = await apiService.customizeOrder(text, item._id || item.id, restaurantId);
      if (data.success) {
        setFeedback(data.message);
        setTimeout(() => onConfirm(data.customizations), 1500);
      }
    } catch (errorMessage) {
      const fallbackCustomizations = text
        .split(/,|and/i)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1));

      if (fallbackCustomizations.length > 0) {
        setFeedback("Applied your preferences!");
        setTimeout(() => onConfirm(fallbackCustomizations), 1000);
      } else {
        setFeedback(errorMessage || "AI couldn't process that. Try 'extra cheese'.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      {/* Container with Glassmorphism */}
      <div className="bg-white/90 backdrop-blur-2xl rounded-[2.5rem] w-full max-w-md p-8 shadow-[0_32px_64px_-15px_rgba(0,0,0,0.2)] border border-white relative overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* Subtle Brand Background Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-brand/10 rounded-full blur-3xl" />
        
        {/* Header */}
        <div className="relative z-10 mb-6">
          <p className="text-[10px] font-black text-brand uppercase tracking-[0.2em] mb-1">AI Personalization</p>
          <h2 className="text-2xl font-black text-slate-900 uppercase italic leading-none">
            Customize <span className="text-brand">{item.name}</span>
          </h2>
        </div>
        
        {/* Input Area */}
        <div className="relative z-10">
          <textarea
            className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] p-5 pr-14 text-sm font-medium focus:ring-4 focus:ring-brand/10 focus:border-brand/20 outline-none transition-all resize-none text-slate-700 placeholder:text-slate-400 placeholder:font-bold placeholder:uppercase placeholder:text-[10px] placeholder:tracking-widest"
            rows="4"
            placeholder="Tell us your preferences (e.g., No onions, extra spicy)..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          
          {/* Microphone Button with Pulse Effect */}
          <button
            onClick={toggleListen}
            className={cn(
              "absolute right-3 bottom-3 p-4 rounded-2xl transition-all duration-500 group",
              isListening 
                ? 'bg-rose-500 text-white shadow-xl shadow-rose-200' 
                : 'bg-white text-brand shadow-md hover:shadow-lg border border-slate-100'
            )}
          >
            {isListening && (
              <span className="absolute inset-0 rounded-2xl bg-rose-500 animate-ping opacity-40" />
            )}
            <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-20a3 3 0 00-3 3v8a3 3 0 006 0V5a3 3 0 00-3-3z" />
            </svg>
          </button>
        </div>

        {/* Feedback / AI Thinking Indicator */}
        <div className={cn(
          "mt-4 min-h-[40px] flex items-center gap-3 px-4 py-3 rounded-2xl transition-all",
          feedback ? "bg-brand/5 border border-brand/10 opacity-100" : "opacity-0"
        )}>
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce" />
            <span className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce [animation-delay:-0.3s]" />
          </div>
          <p className="text-[11px] font-black text-brand uppercase tracking-wider leading-none">
            {feedback}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8 relative z-10">
          <button 
            onClick={onClose} 
            className="flex-1 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
          >
            Go Back
          </button>
          <button 
            onClick={handleAIProcess}
            disabled={loading || !text}
            className={cn(
              "flex-1 font-black text-[10px] py-4 rounded-[1.2rem] shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-2 uppercase tracking-[0.15em]",
              loading || !text 
                ? 'bg-slate-100 text-slate-400' 
                : 'bg-brand text-white shadow-brand/30 hover:opacity-90'
            )}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Process AI</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomizationModal;