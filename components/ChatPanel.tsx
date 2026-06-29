"use client";

import { useEffect, useRef, useState } from "react";

type BookHouse = {
  id: string;
  name: string;
  location: string;
  fromPrice: string | null;
  roomsAvailable: number;
  rating?: number | null;
  reviewCount?: number | null;
  url: string;
};
type Message = { role: "user" | "assistant"; content: string; houses?: BookHouse[] };

const GREETING =
  "Hi! 👋 I can help with rooms, pricing, move-in, and how to apply. What would you like to know?";

const SUGGESTIONS = [
  "What's available now?",
  "How much does it cost to move in?",
  "What do I need to get approved?",
  "How fast can I move in?",
  "What's included in the rent?",
  "Where are the homes located?",
  "Are pets allowed?",
  "How does the process work?",
  "Can I tour a home first?",
  "How do I book a room?",
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
        setError(data.error || "Sorry — something went wrong. Please try again in a moment.");
      } else {
        setMessages((m) => [...m, { role: "assistant", content: data.reply, houses: data.houses }]);
      }
    } catch {
      setError("Couldn't reach the assistant. Please check your connection and try again.");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  // Suggested questions to keep under the latest answer — minus any already asked.
  const asked = new Set(messages.filter((m) => m.role === "user").map((m) => m.content));
  const remainingSuggestions = SUGGESTIONS.filter((s) => !asked.has(s)).slice(0, 4);
  const showSuggestions = !loading && remainingSuggestions.length > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Conversation */}
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
        <Bubble role="assistant">
          <MessageText text={GREETING} />
        </Bubble>

        {messages.map((m, i) => (
          <div key={i} className="space-y-2">
            <Bubble role={m.role}>
              <MessageText text={m.content} isUser={m.role === "user"} />
            </Bubble>
            {m.houses && m.houses.length > 0 && (
              <div className="space-y-2">
                {m.houses.map((h) => (
                  <BookCard key={h.id} house={h} />
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <Bubble role="assistant">
            <span className="inline-flex gap-1">
              <Dot /> <Dot /> <Dot />
            </span>
          </Bubble>
        )}

        {error && <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        {/* Suggested questions — stay under the latest answer so you can keep tapping. */}
        {showSuggestions && (
          <div className="flex flex-wrap gap-2 pt-1">
            {messages.length > 0 && (
              <p className="w-full text-xs font-semibold uppercase tracking-wide text-muted">Popular questions</p>
            )}
            {remainingSuggestions.map((s) => (
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
          AI assistant — answers may not be perfect.
        </p>
      </form>
    </div>
  );
}

function BookCard({ house }: { house: BookHouse }) {
  const rooms = `${house.roomsAvailable} room${house.roomsAvailable === 1 ? "" : "s"} available`;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <div className="font-extrabold text-ink">{house.name}</div>
          {house.rating != null && (
            <span className="text-xs font-bold text-amber-500">
              ★ {house.rating.toFixed(1)}
              {house.reviewCount ? <span className="font-normal text-muted"> ({house.reviewCount})</span> : null}
            </span>
          )}
        </div>
        {house.fromPrice && <div className="text-sm font-bold text-ink">from {house.fromPrice}</div>}
      </div>
      <div className="text-sm text-muted">{house.location}</div>
      <div className="mt-0.5 text-xs font-semibold text-brand">{rooms}</div>
      <a href={house.url} className="btn-book mt-2 block w-full py-2 text-center text-sm">
        Book your room →
      </a>
    </div>
  );
}

function Bubble({ role, children }: { role: "user" | "assistant"; children: React.ReactNode }) {
  const isUser = role === "user";
  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div
        className={
          "max-w-[85%] whitespace-pre-wrap break-words [overflow-wrap:anywhere] rounded-2xl px-3.5 py-2 text-base " +
          (isUser ? "rounded-br-sm bg-brand text-white" : "rounded-bl-sm bg-slate-100 text-ink")
        }
      >
        {children}
      </div>
    </div>
  );
}

// Turn raw URLs in a message into clean, clickable links (the bot sometimes
// pastes a full PadSplit URL — show a friendly label instead of the raw text).
const URL_RE = /(https?:\/\/[^\s)]+)/g;

function MessageText({ text, isUser = false }: { text: string; isUser?: boolean }) {
  const parts = text.split(URL_RE);
  return (
    <>
      {parts.map((part, i) =>
        /^https?:\/\//.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className={
              "font-semibold underline [overflow-wrap:anywhere] " + (isUser ? "text-white" : "text-brand")
            }
          >
            {linkLabel(part)}
          </a>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function linkLabel(url: string): string {
  if (/sign-up|padsplit\.com\/\?/.test(url)) return "Search on PadSplit →";
  if (/padsplit\.com/.test(url)) return "View on PadSplit →";
  try {
    return new URL(url).hostname.replace(/^www\./, "") + " →";
  } catch {
    return url;
  }
}

function Dot() {
  return <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-slate-400" />;
}
