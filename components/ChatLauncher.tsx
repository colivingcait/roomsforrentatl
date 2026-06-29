"use client";

import { useEffect, useRef, useState } from "react";
import ChatDialog from "./ChatDialog";

const SESSION_KEY = "rfr_chat_autoopened";

/**
 * Desktop floating chat button (mobile already has a bottom "Chat with us"
 * bar). Gently pops to draw the eye, shows a one-time nudge bubble, and
 * auto-opens once per session on exit intent (cursor leaving the top).
 */
export default function ChatLauncher() {
  const [open, setOpen] = useState(false);
  const [nudge, setNudge] = useState(false);
  const interacted = useRef(false);

  const openChat = () => {
    interacted.current = true;
    setNudge(false);
    setOpen(true);
  };

  // Gentle nudge bubble after a short delay (only if they haven't engaged yet).
  useEffect(() => {
    const t = setTimeout(() => {
      if (!interacted.current) setNudge(true);
    }, 7000);
    return () => clearTimeout(t);
  }, []);

  // Desktop exit-intent: when the cursor leaves the top of the window, pop the
  // chat — once per session, so it doesn't nag.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(max-width: 639px)").matches) return; // desktop only
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
    } catch {}
    const onLeave = (e: MouseEvent) => {
      if (interacted.current || open) return;
      if (e.clientY <= 0) {
        try {
          sessionStorage.setItem(SESSION_KEY, "1");
        } catch {}
        document.removeEventListener("mouseout", onLeave);
        openChat();
      }
    };
    document.addEventListener("mouseout", onLeave);
    return () => document.removeEventListener("mouseout", onLeave);
  }, [open]);

  return (
    <>
      <div className="chat-launcher fixed right-6 z-40 hidden flex-col items-end gap-2 sm:flex">
        {nudge && (
          <div className="relative max-w-[230px] rounded-2xl rounded-br-sm bg-white px-4 py-3 text-sm font-medium text-ink shadow-card">
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => setNudge(false)}
              className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-slate-200 text-xs text-ink hover:bg-slate-300"
            >
              ×
            </button>
            👋 Have a question? I can answer it right now.
          </div>
        )}
        <button
          type="button"
          onClick={openChat}
          aria-label="Open chat"
          className="chat-fab flex items-center gap-2 rounded-full bg-accent px-5 py-3.5 font-bold text-white shadow-card hover:bg-accent-dark"
        >
          <span className="text-lg leading-none">💬</span>
          Ask a question
        </button>
      </div>

      <ChatDialog open={open} onClose={() => setOpen(false)} startTab="chat" />
    </>
  );
}
