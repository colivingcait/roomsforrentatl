"use client";

import { useEffect, useRef, useState } from "react";
import { site } from "@/lib/site";

type Message = { role: "user" | "assistant"; content: string };

const GREETING =
  "Hi! 👋 I can help with rooms, pricing, move-in, and how to apply. What would you like to know?";

const SUGGESTIONS = [
  "What's available now?",
  "How much does it cost to move in?",
  "What do I need to get approved?",
];

export default function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep the latest message in view.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setError(null);
    const next = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      if (!res.ok || !data.reply) {
        setError(data.error || "Something went wrong. Please text us.");
      } else {
        setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
      }
    } catch {
      setError("Couldn't reach the assistant. Please check your connection or text us.");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Conversation */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        <Bubble role="assistant">{GREETING}</Bubble>

        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                className="rounded-full border border-brand/30 bg-brand/5 px-3 py-1.5 text-sm font-semibold text-brand active:scale-95"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) => (
          <Bubble key={i} role={m.role}>
            {m.content}
          </Bubble>
        ))}

        {loading && (
          <Bubble role="assistant">
            <span className="inline-flex gap-1">
              <Dot /> <Dot /> <Dot />
            </span>
          </Bubble>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}{" "}
            <a href={site.smsHref} className="font-semibold underline">
              Text us
            </a>
            .
          </div>
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="safe-bottom border-t border-slate-100 bg-white px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything…"
            aria-label="Ask a question"
            className="min-w-0 flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-base outline-none focus:border-brand focus:bg-white"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand text-white disabled:opacity-40"
            aria-label="Send"
          >
            ↑
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-slate-400">
          AI assistant — answers may not be perfect.{" "}
          <a href={site.smsHref} className="underline">
            Text a human
          </a>
        </p>
      </form>
    </div>
  );
}

function Bubble({ role, children }: { role: "user" | "assistant"; children: React.ReactNode }) {
  const isUser = role === "user";
  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div
        className={
          isUser
            ? "max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-brand px-3.5 py-2 text-base text-white"
            : "max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-slate-100 px-3.5 py-2 text-base text-ink"
        }
      >
        {children}
      </div>
    </div>
  );
}

function Dot() {
  return <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-slate-400" />;
}
