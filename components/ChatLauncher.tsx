"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import ChatDialog from "./ChatDialog";

// --- Tweak these to taste -------------------------------------------------
const NUDGE_DELAY = 4500; // ms before the greeting bubble appears
const AUTO_OPEN_DELAY = 9000; // ms before the one-time desktop auto-open
const AUTO_OPEN_ON_ENTRY = true; // set false to only nudge, never auto-open
const NUDGE_TEXT = "👋 Looking for a place? I'll help you find your best fit in about 30 seconds.";
// -------------------------------------------------------------------------

const AUTO_OPEN_KEY = "rfr_chat_autoopened";
const NUDGE_KEY = "rfr_chat_nudged";

const isDesktop = () =>
  typeof window !== "undefined" && !window.matchMedia("(max-width: 639px)").matches;
const seen = (k: string) => {
  try {
    return !!sessionStorage.getItem(k);
  } catch {
    return false;
  }
};
const mark = (k: string) => {
  try {
    sessionStorage.setItem(k, "1");
  } catch {}
};

/**
 * Desktop floating chat button (mobile already has a bottom "Chat with us"
 * bar). On entry it shows a one-time greeting nudge and — once per session —
 * gently auto-opens to act as a leasing guide. Also opens on exit intent.
 * Never auto-opens on mobile (full-screen takeover hurts more than it helps).
 */
export default function ChatLauncher() {
  const [open, setOpen] = useState(false);
  const [nudge, setNudge] = useState(false);
  const interacted = useRef(false);
  const pathname = usePathname();
  // The homes brand (homesforrentatl.com) is all whole apartments — default the
  // chat to "unit" mode there. On the rooms brand, only the /rental* pages do.
  const isHomesBrand =
    typeof window !== "undefined" && window.location.hostname.toLowerCase().includes("homesforrent");
  const onRentalPage = !!pathname && pathname.startsWith("/rental");
  // Don't proactively pop the room-oriented assistant at long-term leads on the
  // rooms brand's rental pages (the FAB stays). The homes brand can still greet.
  const suppressProactive = onRentalPage && !isHomesBrand;
  const chatTrack: "unit" | null = isHomesBrand || onRentalPage ? "unit" : null;

  const openChat = () => {
    interacted.current = true;
    setNudge(false);
    setOpen(true);
  };

  // One-time greeting nudge + optional one-time desktop auto-open on entry.
  useEffect(() => {
    if (!isDesktop() || suppressProactive) return;
    const timers: ReturnType<typeof setTimeout>[] = [];

    if (!seen(NUDGE_KEY)) {
      timers.push(
        setTimeout(() => {
          if (!interacted.current && !open) {
            setNudge(true);
            mark(NUDGE_KEY);
          }
        }, NUDGE_DELAY)
      );
    }

    if (AUTO_OPEN_ON_ENTRY && !seen(AUTO_OPEN_KEY)) {
      timers.push(
        setTimeout(() => {
          if (!interacted.current && !open) {
            mark(AUTO_OPEN_KEY);
            openChat();
          }
        }, AUTO_OPEN_DELAY)
      );
    }

    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Desktop exit-intent: cursor leaving the top → open once per session
  // (shares the auto-open flag so we never auto-open more than once).
  useEffect(() => {
    if (!isDesktop() || suppressProactive) return;
    if (seen(AUTO_OPEN_KEY)) return;
    const onLeave = (e: MouseEvent) => {
      if (interacted.current || open) return;
      if (e.clientY <= 0) {
        mark(AUTO_OPEN_KEY);
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
          <div className="relative max-w-[250px] rounded-2xl rounded-br-sm bg-white px-4 py-3 text-sm font-medium text-ink shadow-card">
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => setNudge(false)}
              className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-slate-200 text-xs text-ink hover:bg-slate-300"
            >
              ×
            </button>
            {NUDGE_TEXT}
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

      <ChatDialog
        open={open}
        onClose={() => setOpen(false)}
        startTab="chat"
        initialTrack={chatTrack}
      />
    </>
  );
}
