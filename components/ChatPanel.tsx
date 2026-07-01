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
type Message = { role: "user" | "assistant"; content: string; houses?: BookHouse[]; chips?: string[] };
type Track = "room" | "unit" | "both";

const ROOM_GREETING = "Hi! 👋 Let's find your room. Ask me anything, or tap a question to start:";
const UNIT_GREETING = "Hi! 👋 Happy to help with our apartments. What would you like to know?";

// Rooms site → room mode; homes site (homesforrentatl.com) → unit mode.
function brandDefaultTrack(): Track {
  return typeof window !== "undefined" &&
    window.location.hostname.toLowerCase().includes("homesforrent")
    ? "unit"
    : "room";
}

// The first thing a visitor picks — it tailors every answer that follows.
const TRACK_OPTIONS: { label: string; track: Track; text: string }[] = [
  { label: "🛏️ A private room", track: "room", text: "I'm looking for a private room." },
  { label: "🏠 A whole place to myself", track: "unit", text: "I'm looking for a whole place to myself." },
  { label: "Show me both", track: "both", text: "Show me both options." },
];

// Default question chips for someone renting a weekly co-living ROOM.
const DEFAULT_SUGGESTIONS = [
  "What's available now?",
  "How much does it cost to move in?",
  "What do I need to get approved?",
  "How fast can I move in?",
  "Where are the homes located?",
  "Are pets allowed?",
  "How do I book a room?",
];

// Default question chips for someone renting a whole long-term UNIT.
const UNIT_SUGGESTIONS = [
  "What units are available?",
  "How much is the rent?",
  "How do I apply?",
  "Are they furnished?",
  "Where are they located?",
  "When can I move in?",
  "What's the lease length?",
];

// Default question chips when they want to see both products.
const BOTH_SUGGESTIONS = [
  "What's available now?",
  "How does the pricing compare?",
  "Where are they located?",
  "How do I apply?",
];

// After a question is asked, surface the natural next questions on that topic.
const FOLLOWUPS: Record<string, string[]> = {
  // Approval / application
  "What do I need to get approved?": [
    "What's the application process?",
    "How long does approval take?",
    "Do you check credit?",
    "What if I'm not approved?",
  ],
  "What's the application process?": [
    "How long does approval take?",
    "What do I need to get approved?",
    "How much does it cost to move in?",
    "How fast can I move in?",
  ],
  "How long does approval take?": [
    "What's the application process?",
    "How fast can I move in?",
    "What if I'm not approved?",
  ],
  "Do you check credit?": [
    "What do I need to get approved?",
    "What's the application process?",
    "What if I'm not approved?",
  ],
  "What if I'm not approved?": [
    "What do I need to get approved?",
    "What's available now?",
    "How much does it cost to move in?",
  ],
  // Cost / payment
  "How much does it cost to move in?": [
    "What's included in the rent?",
    "Can I pay monthly?",
    "Are there any other fees?",
    "How fast can I move in?",
  ],
  "What's included in the rent?": [
    "How much does it cost to move in?",
    "Can I pay monthly?",
    "Are there any other fees?",
  ],
  "Can I pay monthly?": [
    "How much does it cost to move in?",
    "What's included in the rent?",
    "Are there any other fees?",
  ],
  "Are there any other fees?": [
    "How much does it cost to move in?",
    "What's included in the rent?",
    "Can I pay monthly?",
  ],
  // Move-in / process
  "How fast can I move in?": [
    "How does the process work?",
    "What do I need to get approved?",
    "What's available now?",
  ],
  "How does the process work?": [
    "What do I need to get approved?",
    "How long does approval take?",
    "How much does it cost to move in?",
    "How do I book a room?",
  ],
  // Availability / homes / booking
  "What's available now?": [
    "Where are the homes located?",
    "How much does it cost to move in?",
    "How do I book a room?",
    "Can I tour a home first?",
  ],
  "Where are the homes located?": [
    "How close is public transit?",
    "What's available now?",
    "Can I tour a home first?",
  ],
  "How close is public transit?": ["Where are the homes located?", "What's available now?"],
  "Can I tour a home first?": [
    "What's available now?",
    "How do I book a room?",
    "Where are the homes located?",
  ],
  "How do I book a room?": [
    "How does the process work?",
    "What do I need to get approved?",
    "What's available now?",
  ],
  // House rules / living
  "Are pets allowed?": ["What are the house rules?", "Can I have guests?", "Can two people share a room?"],
  "What are the house rules?": ["Are pets allowed?", "Can I have guests?", "Is smoking allowed?"],
  "Can I have guests?": ["What are the house rules?", "Are pets allowed?", "Can two people share a room?"],
  "Can two people share a room?": [
    "What are the house rules?",
    "Are pets allowed?",
    "How much does it cost to move in?",
  ],
  "Is smoking allowed?": ["What are the house rules?", "Are pets allowed?", "Can I have guests?"],
};

// Infer which housing track a message points to, so tailoring kicks in even
// when someone types their preference or taps a bot chip instead of the picker.
function inferTrack(text: string): Track | null {
  const t = text.toLowerCase();
  if (/\bboth\b/.test(t)) return "both";
  if (/\broom\b|co-?living|weekly|willow/.test(t)) return "room";
  if (/whole (place|apartment|unit|home)|entire (unit|place|apartment)|my own place|studio|\bunit\b/.test(t))
    return "unit";
  return null;
}

export default function ChatPanel({ initialTrack = null }: { initialTrack?: Track | null }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Each brand is single-category, so start in that track (override wins, e.g.
  // "unit" on a rental page). The room-vs-place picker no longer appears.
  const startTrack: Track = initialTrack ?? brandDefaultTrack();
  const [track, setTrack] = useState<Track | null>(startTrack);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep the latest message in view.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string, source: "typed" | "suggested" = "typed", trackOverride?: Track) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setError(null);
    // Lock in the housing track once it's clear — from the picker, or inferred
    // from what they tapped/typed — so answers stay tailored to room vs. unit.
    const effectiveTrack = trackOverride ?? track ?? inferTrack(trimmed) ?? undefined;
    if (effectiveTrack && effectiveTrack !== track) setTrack(effectiveTrack);
    const next = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: next, source, track: effectiveTrack }),
      });
      const data = await res.json();
      if (!res.ok || !data.reply) {
        setError(data.error || "Sorry — something went wrong. Please try again in a moment.");
      } else {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: data.reply, houses: data.houses, chips: data.chips },
        ]);
      }
    } catch {
      setError("Couldn't reach the assistant. Please check your connection and try again.");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  const asked = new Set(messages.filter((m) => m.role === "user").map((m) => m.content));

  // The room/unit/both picker is only the OPENING choice — show it before the
  // conversation starts. Once anyone has said anything, the bot drives the chips.
  const showTrackOptions = !loading && !track && messages.length === 0;

  // The bot drives its own quick-reply buttons: whenever its latest answer ends
  // with chips (the answers to a question it just asked, or the next best tap),
  // show those. They're always more relevant than a static topic list.
  const lastMsg = messages[messages.length - 1];
  const botChips = (lastMsg?.role === "assistant" ? lastMsg.chips ?? [] : []).filter(
    (c) => !asked.has(c)
  );
  const showBotChips = !loading && botChips.length > 0;

  // Fallback when the bot didn't supply chips: a static set of popular questions,
  // tailored to the chosen track (or the general set if none picked yet).
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content;
  const trackDefaults =
    track === "unit" ? UNIT_SUGGESTIONS : track === "both" ? BOTH_SUGGESTIONS : DEFAULT_SUGGESTIONS;
  // Topic follow-ups are room-specific; only use them on the room track.
  const pool = (track === "room" && lastUser && FOLLOWUPS[lastUser]) || trackDefaults;
  let remainingSuggestions = pool.filter((s) => !asked.has(s));
  if (remainingSuggestions.length === 0) {
    remainingSuggestions = trackDefaults.filter((s) => !asked.has(s));
  }
  remainingSuggestions = remainingSuggestions.slice(0, 4);
  const showSuggestions =
    !loading && !showTrackOptions && !showBotChips && remainingSuggestions.length > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Conversation */}
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
        <Bubble role="assistant">
          <MessageText text={startTrack === "unit" ? UNIT_GREETING : ROOM_GREETING} />
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

        {/* Up-front choice: which kind of housing are they after? */}
        {showTrackOptions && (
          <div className="flex flex-col gap-2 pt-1">
            {TRACK_OPTIONS.map((o) => (
              <button
                key={o.track}
                type="button"
                onClick={() => {
                  setTrack(o.track);
                  send(o.text, "suggested", o.track);
                }}
                className="rounded-2xl border border-brand/30 bg-brand/5 px-4 py-3 text-left text-base font-semibold text-brand active:scale-[0.98]"
              >
                {o.label}
              </button>
            ))}
          </div>
        )}

        {/* Bot-driven quick replies — the answers to whatever it just asked. */}
        {showBotChips && (
          <div className="flex flex-wrap gap-2 pt-1">
            {botChips.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => send(c, "suggested")}
                className="rounded-full bg-brand px-3.5 py-2 text-sm font-semibold text-white shadow-sm active:scale-95"
              >
                {c}
              </button>
            ))}
          </div>
        )}

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
                onClick={() => send(s, "suggested")}
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
