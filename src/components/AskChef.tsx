import React, { useState, useRef, useEffect } from 'react';
import { Send, ChefHat } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import { motion, AnimatePresence } from 'framer-motion';

interface AskChefProps {
  recipeId: string;
}

const CHAT_SUGGESTIONS = [
  'How do I make this vegan?',
  'How to reduce the spice levels?',
  'How should I store leftovers?',
  'What can I substitute for butter?'
];

export const AskChef: React.FC<AskChefProps> = ({ recipeId }) => {
  const { messages, sendMessage, isTyping } = useChat(recipeId);
  const [inputText, setInputText] = useState('');
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isInitial = useRef(true);

  useEffect(() => {
    if (isInitial.current) {
      isInitial.current = false;
      return;
    }
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages.length, isTyping]);

  const handleSend = (text: string) => {
    if (!text.trim() || isTyping) return;
    sendMessage(text.trim());
    setInputText('');
  };

  return (
    <section className="bg-white rounded-3xl border border-[#7A7570]/10 p-6 md:p-8 space-y-6 shadow-editorial no-print text-left">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#7A7570]/10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-terracotta flex items-center justify-center text-cream shadow-sm">
              <ChefHat className="w-6 h-6" />
            </div>
            {/* Online Indicator Gold Dot */}
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-gold border-2 border-white" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-charcoal flex items-center gap-2">
              Chef Kabir
              <span className="text-[9px] bg-gold/15 text-gold border border-gold/25 px-2.5 py-0.5 rounded-full font-bold font-sans uppercase tracking-widest">
                Kitchen Guide
              </span>
            </h3>
            <p className="text-xs text-warmgray">
              Ask about spice levels, vegan alternatives, or pantry swaps.
            </p>
          </div>
        </div>
      </div>

      {/* Chat History Area */}
      <div ref={chatContainerRef} className="h-96 overflow-y-auto pr-2 space-y-4 no-scrollbar">
        <AnimatePresence initial={false}>
          {/* Always show a friendly initial message if there are no messages */}
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="max-w-[85%] md:max-w-[70%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm bg-cream border border-[#7A7570]/10 text-charcoal rounded-tl-none font-sans">
                <p>Warm greetings! I am your companion Chef Kabir. I can help you adjust spice levels, substitute ingredients, or scale this recipe. What's on your mind?</p>
                <span className="text-[9px] block text-right mt-1.5 font-semibold text-warmgray/60">
                  Just now
                </span>
              </div>
            </motion.div>
          )}

          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] md:max-w-[70%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-terracotta text-cream rounded-tr-none'
                    : 'bg-cream border border-[#7A7570]/10 text-charcoal rounded-tl-none font-sans'
                }`}
              >
                <p className="whitespace-pre-line">{msg.text}</p>
                <span
                  className={`text-[9px] block text-right mt-1.5 font-semibold ${
                    msg.sender === 'user' ? 'text-cream/60' : 'text-warmgray/60'
                  }`}
                >
                  {msg.timestamp}
                </span>
              </div>
            </motion.div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex justify-start"
            >
              <div className="bg-cream border border-[#7A7570]/10 p-4 rounded-2xl rounded-tl-none flex items-center gap-2 shadow-sm">
                <span className="text-xs italic text-warmgray flex items-center gap-2 font-semibold">
                  <span className="flex gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-warmgray animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-warmgray animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-warmgray animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                  Kabir is writing...
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Suggestion Prompts */}
      <div className="space-y-3 pt-2">
        <span className="text-[10px] uppercase font-bold tracking-widest text-warmgray block">
          Ask about substitutions or storage:
        </span>
        <div className="flex flex-wrap gap-2">
          {CHAT_SUGGESTIONS.map((suggestion, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isTyping}
              onClick={() => handleSend(suggestion)}
              className="px-4 py-2 rounded-xl border border-[#7A7570]/10 bg-cream text-charcoal hover:border-terracotta hover:bg-white text-xs font-semibold tracking-wide transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Message Input Bar */}
      <div className="flex items-center gap-2 pt-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend(inputText)}
          placeholder="Ask Chef Kabir a question about this recipe..."
          disabled={isTyping}
          className="flex-grow bg-cream border border-[#7A7570]/10 rounded-2xl px-4 py-3.5 text-xs font-semibold focus:outline-none focus:border-terracotta focus:bg-white focus:ring-1 focus:ring-terracotta/25 placeholder:text-warmgray/50 transition-colors disabled:opacity-50"
        />
        <button
          type="button"
          onClick={() => handleSend(inputText)}
          disabled={!inputText.trim() || isTyping}
          className="w-12 h-12 bg-terracotta hover:bg-terracotta-hover text-cream rounded-2xl flex items-center justify-center transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-95"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
};
