import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, User, Bot, Lightbulb } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { trpc } from '@/providers/trpc';
import { getAIResponse, getSuggestions, generateId } from '@/lib/aiService';

export function AIChat() {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const utils = trpc.useUtils();
  const { data: dbMessages = [] } = trpc.chat.list.useQuery();
  const saveMessage = trpc.chat.save.useMutation({ onSuccess: () => utils.chat.list.invalidate() });

  const messages = dbMessages.map((m) => ({
    id: m.id,
    role: m.role as 'user' | 'assistant',
    content: m.content,
    timestamp: m.timestamp,
  }));

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const persistMessage = (msg: { id: string; role: 'user' | 'assistant'; content: string; timestamp: number }) => {
    saveMessage.mutate(msg);
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg = {
      id: generateId(),
      role: 'user' as const,
      content: input.trim(),
      timestamp: Date.now(),
    };
    persistMessage(userMsg);
    setInput('');
    setShowSuggestions(false);
    setIsTyping(true);

    setTimeout(() => {
      const response = getAIResponse(userMsg.content);
      const aiMsg = {
        id: generateId(),
        role: 'assistant' as const,
        content: response,
        timestamp: Date.now(),
      };
      persistMessage(aiMsg);
      setIsTyping(false);
    }, 1500);
  };

  const sendSuggestion = (suggestion: string) => {
    const userMsg = {
      id: generateId(),
      role: 'user' as const,
      content: suggestion,
      timestamp: Date.now(),
    };
    persistMessage(userMsg);
    setInput('');
    setShowSuggestions(false);
    setIsTyping(true);
    setTimeout(() => {
      const response = getAIResponse(suggestion);
      const aiMsg = {
        id: generateId(),
        role: 'assistant' as const,
        content: response,
        timestamp: Date.now(),
      };
      persistMessage(aiMsg);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#121212] p-6 shadow-[0px_4px_12px_rgba(255,255,255,0.05)]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-2xl font-semibold tracking-tight text-white">
          AI Wedding Concierge
        </h2>
        <Sparkles className="h-5 w-5 text-[#F59E0B]" />
      </div>

      <div className="mb-3 flex h-[320px] flex-col overflow-hidden rounded-xl border border-white/5 bg-[#050505]">
        <ScrollArea className="flex-1 px-4 py-3" ref={scrollRef}>
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10">
                <Bot className="h-6 w-6 text-[#A1A1AA]" />
              </div>
              <p className="text-sm text-[#A1A1AA]">
                How can I help make your day perfect?
              </p>
            </div>
          )}
          <div className="space-y-3">
            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10">
                      <Bot className="h-4 w-4 text-[#A1A1AA]" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm ${
                      msg.role === 'user'
                        ? 'bg-[#1A1A1A] text-white'
                        : 'bg-[#121212] text-[#F5F5F5]'
                    }`}
                  >
                    {msg.content}
                  </div>
                  {msg.role === 'user' && (
                    <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10">
                      <User className="h-4 w-4 text-[#A1A1AA]" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10">
                  <Bot className="h-4 w-4 text-[#A1A1AA]" />
                </div>
                <div className="flex items-center gap-1 rounded-xl bg-[#121212] px-3 py-2">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#A1A1AA]" style={{ animationDelay: '0ms' }} />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#A1A1AA]" style={{ animationDelay: '150ms' }} />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#A1A1AA]" style={{ animationDelay: '300ms' }} />
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>
      </div>

      <AnimatePresence>
        {showSuggestions && messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 flex flex-wrap gap-2"
          >
            {getSuggestions().map((s) => (
              <button
                key={s}
                onClick={() => sendSuggestion(s)}
                className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-[#050505] px-3 py-1.5 text-xs text-[#A1A1AA] transition-colors hover:border-white/20 hover:text-white"
              >
                <Lightbulb className="h-3 w-3" />
                {s}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-2">
        <Input
          placeholder="Ask me anything about your wedding..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !isTyping && sendMessage()}
          disabled={isTyping}
          className="border-white/10 bg-[#050505] text-white placeholder:text-[#52525B]"
        />
        <Button
          onClick={sendMessage}
          disabled={isTyping || !input.trim()}
          className="bg-white text-black hover:bg-white/90 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
