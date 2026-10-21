"use client";

import { useEffect, useRef, useState } from "react";
import { Loader, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ChatMessage } from "@/types";
import { APP_NAME } from "@/lib/constants";
import { findFaqAnswer, SUGGESTED_QUESTIONS } from "@/lib/faq";

interface ChatBoxProps {
  onClose?: () => void;
}

// Friendly assistant persona for the store. Rename here to rebrand the bot.
const ASSISTANT_NAME = "Grace";
const STORAGE_KEY = "ccl-chat";

const welcomeText = `Hi, I'm ${ASSISTANT_NAME}, your ${APP_NAME} assistant. Ask me about shipping, returns, sizing, tracking, payments, or your account and I'll help right away. You can also tap a question below.`;

export function ChatBox({ onClose }: ChatBoxProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const makeWelcome = (): ChatMessage[] => [
    {
      id: "welcome",
      content: welcomeText,
      sender: "ai",
      timestamp: new Date(),
      senderName: ASSISTANT_NAME,
    },
  ];

  // Load any existing conversation from localStorage on mount
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
      if (raw) {
        const parsed = JSON.parse(raw) as Array<{
          id: string;
          content: string;
          sender: "user" | "ai" | "agent";
          timestamp: string;
          senderName?: string;
          isTyping?: boolean;
        }>;

        const restored: ChatMessage[] = parsed.map((m) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        }));

        if (restored.length > 0) {
          setMessages(restored);
          return;
        }
      }
    } catch {
      // ignore parse/storage errors and fall back to default welcome
    }

    setMessages(makeWelcome());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Persist conversation to localStorage whenever messages change
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const serializable = messages.map((m) => ({
        ...m,
        timestamp: m.timestamp.toISOString(),
      }));
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
    } catch {
      // ignore storage errors
    }
  }, [messages]);

  const startFreshConversation = () => {
    setMessages(makeWelcome());
  };

  // Build the assistant's answer: FAQ match first, then an on/offline fallback.
  const buildReply = (userText: string): string => {
    const faq = findFaqAnswer(userText);
    if (faq) return faq.answer;

    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    const isLiveHours = day >= 1 && day <= 5 && hour >= 9 && hour < 18;

    if (isLiveHours) {
      return "I'm not sure about that one yet, but our team is online (Mon–Fri, 9am–6pm). Head to the Contact page and send a message with your order number and details, and a live agent will help you shortly.";
    }
    return "I'm not sure about that one yet, and it's currently outside our live support hours (Mon–Fri, 9am–6pm). Leave a message on the Contact page with your order number and details and we'll get back to you as soon as we're back online.";
  };

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isSending || isEnding) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      content: trimmed,
      sender: "user",
      timestamp: new Date(),
      senderName: "You",
    };

    setInput("");
    setMessages((prev) => [...prev, userMessage]);
    setIsSending(true);

    const typingMessage: ChatMessage = {
      id: `typing-${Date.now()}`,
      content: "Typing...",
      sender: "ai",
      timestamp: new Date(),
      senderName: ASSISTANT_NAME,
      isTyping: true,
    };
    setMessages((prev) => [...prev, typingMessage]);

    setTimeout(() => {
      setMessages((prev) => {
        const withoutTyping = prev.filter((m) => !m.isTyping);
        const reply: ChatMessage = {
          id: `ai-${Date.now()}`,
          content: buildReply(trimmed),
          sender: "ai",
          timestamp: new Date(),
          senderName: ASSISTANT_NAME,
        };
        return [...withoutTyping, reply];
      });
      setIsSending(false);
    }, 650);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleEndConversation = async () => {
    if (!messages.length) {
      startFreshConversation();
      return;
    }

    setIsEnding(true);
    try {
      void (await fetch("/api/support/chat-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      }));
    } catch {
      // If this fails, we still clear locally so the experience is consistent
    } finally {
      try {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        // ignore
      }
      startFreshConversation();
      setIsEnding(false);
    }
  };

  // Show quick-reply questions only at the very start of a conversation.
  const showSuggestions = messages.length <= 1 && !isSending;

  return (
    <div className="flex h-full flex-col bg-slate-950 text-slate-50 rounded-lg shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-3 flex items-center justify-between text-xs sm:text-sm">
        <div className="flex flex-col">
          <span className="font-semibold tracking-wide">Chat with {ASSISTANT_NAME}</span>
          <span className="text-[11px] text-blue-100/90">
            {APP_NAME} help — products, sizing, orders & more
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/15 transition-colors"
            aria-label="Close chat"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-slate-950/95">
        {messages.map((m) => {
          const mine = m.sender === "user";
          return (
            <div
              key={m.id}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-[11px] sm:text-[13px] shadow border border-white/5 ${
                  mine
                    ? "ml-auto bg-violet-600 text-slate-50"
                    : "mr-auto bg-slate-800 text-slate-50"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-100/80">
                    {mine ? "You" : m.senderName || ASSISTANT_NAME}
                  </span>
                  {!m.isTyping && (
                    <span className="text-[9px] text-slate-300/80">
                      {m.timestamp.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
                <p className="whitespace-pre-wrap leading-relaxed">
                  {m.isTyping ? "Typing…" : m.content}
                </p>
              </div>
            </div>
          );
        })}

        {showSuggestions && (
          <div className="flex flex-wrap gap-2 pt-1">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => sendMessage(q)}
                className="rounded-full border border-violet-500/40 bg-violet-500/10 px-3 py-1.5 text-[11px] text-violet-100 transition-colors hover:bg-violet-500/25"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-slate-800 bg-slate-950 px-3 py-2">
        <form onSubmit={handleSend} className="flex items-end gap-2">
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about a product, order, or sizing..."
            className="flex-1 rounded-lg bg-slate-900 border-slate-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            disabled={isSending || isEnding}
          />
          <Button
            type="submit"
            disabled={!input.trim() || isSending || isEnding}
            className="bg-violet-600 hover:bg-violet-700 text-white rounded-lg px-3 py-2 flex items-center gap-1 text-xs sm:text-sm"
          >
            {isSending ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Send</span>
          </Button>
        </form>
        <div className="mt-1 flex items-center justify-between">
          <p className="text-[10px] text-slate-500">
            Answers common questions instantly. Live agents & AI coming soon.
          </p>
          <button
            type="button"
            onClick={handleEndConversation}
            disabled={isEnding}
            className="text-[10px] text-violet-300 hover:text-violet-100 underline-offset-2 hover:underline disabled:opacity-60"
          >
            {isEnding ? "Ending..." : "End Conversation"}
          </button>
        </div>
      </div>
    </div>
  );
}
