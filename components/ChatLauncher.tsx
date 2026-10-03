"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/analytics";
import { getVariant } from "@/lib/ab";
import ChatDialog from "./ChatDialog";

// --- Tweak these to taste -------------------------------------------------
const NUDGE_DELAY = 4500; // ms before the greeting bubble appears
const AUTO_OPEN_DELAY = 9000; // ms before the one-time desktop auto-open
const AUTO_OPEN_ON_ENTRY = true; // set false to only nudge, never auto-open
const NUDGE_TEXT = "👋 Looking for a place? I'll help you find your best fit in about 30 seconds.";
// -------------------------------------------------------------------------

const AUTO_OPEN_KEY = "rfr_chat_autoopened";
const NUDGE_KEY = "rfr_chat_nudged";
const SS_TEASER_SHOWN = "rfr_chatTeaserShown";
const SS_CHAT_ENGAGED = "rfr_chatEngaged";
const TEASER_DELAY_MS = 4000;

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
  const [teaser, setTeaser] = useState(false);
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
  // Only override the track on rental pages; ChatPanel defaults by brand otherwise.
  const chatTrack: "unit" | null = onRentalPage ? "unit" : null;
  // Version A homepage: pill FAB on every width, mobile teaser instead of the
  // desktop auto-open. Resolved after mount so the homes brand doesn't hydrate
  // a different launcher than the server rendered.
  const [roomsHome, setRoomsHome] = useState(false);
  useEffect(() => {
    const homes = window.location.hostname.toLowerCase().includes("homesforrent");
    setRoomsHome(pathname === "/" && !homes);
  }, [pathname]);

  // A/B: does opening on the FAQ tab vs straight into chat change engagement?
  // Only on the plain rooms-brand experience — the FAQ content is room-only,
  // so it'd be the wrong content for homes-brand or unit-focused rental pages.
  const [startTab, setStartTab] = useState<"chat" | "faq">("chat");
  useEffect(() => {
    if (!isHomesBrand && !onRentalPage) {
      setStartTab(getVariant("start_tab", ["chat", "faq"]) as "chat" | "faq");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openChat = (trigger: "button" | "auto_open" | "exit_intent" | "teaser" = "button") => {
    interacted.current = true;
    setNudge(false);
    setTeaser(false);
    mark(SS_CHAT_ENGAGED);
    setOpen(true);
    trackEvent("chat_opened", { trigger, path: pathname ?? "" });
  };

  useEffect(() => {
    const hide = () => setTeaser(false);
    window.addEventListener("rfr-chat-engaged", hide);
    return () => window.removeEventListener("rfr-chat-engaged", hide);
  }, []);

  // Mobile-only teaser, once per session, 4s after load. Under 768px.
  useEffect(() => {
    if (!roomsHome) return;
    const timer = setTimeout(() => {
      if (!window.matchMedia("(max-width: 767px)").matches) return;
      if (seen(SS_TEASER_SHOWN) || seen(SS_CHAT_ENGAGED)) return;
      mark(SS_TEASER_SHOWN);
      setTeaser(true);
    }, TEASER_DELAY_MS);
    return () => clearTimeout(timer);
  }, [roomsHome]);

  // One-time greeting nudge + optional one-time desktop auto-open on entry.
  // The rooms homepage uses the mobile teaser instead, so skip this there.
  useEffect(() => {
    const homes = window.location.hostname.toLowerCase().includes("homesforrent");
    if ((pathname === "/" && !homes) || !isDesktop() || suppressProactive) return;
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
            openChat("auto_open");
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
    const homes = window.location.hostname.toLowerCase().includes("homesforrent");
    if ((pathname === "/" && !homes) || !isDesktop() || suppressProactive) return;
    if (seen(AUTO_OPEN_KEY)) return;
    const onLeave = (e: MouseEvent) => {
      if (interacted.current || open) return;
      if (e.clientY <= 0) {
        mark(AUTO_OPEN_KEY);
        document.removeEventListener("mouseout", onLeave);
        openChat("exit_intent");
      }
    };
    document.addEventListener("mouseout", onLeave);
    return () => document.removeEventListener("mouseout", onLeave);
  }, [open, pathname]);

  return (
    <>
      {roomsHome && teaser && !open && (
        <div
          className="fixed bottom-[84px] right-4 z-[41] w-[min(290px,calc(100vw-32px))] motion-safe:animate-[rfr-teaser_.25s_ease] md:hidden"
          aria-live="polite"
        >
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => {
              mark(SS_TEASER_SHOWN);
              setTeaser(false);
            }}
            className="absolute right-[7px] top-[7px] z-[2] grid h-[26px] w-[26px] place-items-center rounded-full bg-slate-100 text-[17px] leading-none text-muted"
          >
            ×
          </button>
          <button
            type="button"
            data-attr="chat-teaser"
            onClick={() => openChat("teaser")}
            className="relative flex w-full items-start gap-2.5 rounded-2xl bg-white py-3 pl-3 pr-9 text-left text-ink shadow-[0_2px_6px_rgba(15,23,42,.08),0_14px_34px_rgba(15,23,42,.20)] after:absolute after:bottom-[-6px] after:right-10 after:h-3.5 after:w-3.5 after:rotate-45 after:rounded-sm after:bg-white"
          >
            <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full bg-brand text-base text-white">
              💬
            </span>
            <span className="text-sm leading-snug text-slate-700">
              <b className="block text-[15px] text-ink">Hi! Looking for a room?</b>
              I can help — ask me anything.
              <span className="mt-[5px] block text-[13.5px] font-extrabold text-brand">Start chat →</span>
            </span>
          </button>
        </div>
      )}
      {!open && (
        <div
          className={
            roomsHome
              ? "fixed bottom-4 right-4 z-40 md:bottom-6 md:right-6"
              : "chat-launcher fixed right-6 z-40 hidden sm:flex"
          }
        >
          {!roomsHome && nudge && (
            <div className="relative mb-2 max-w-[250px] rounded-2xl rounded-br-sm bg-white px-4 py-3 text-sm font-medium text-ink shadow-card">
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
            data-attr="chat-launcher"
            onClick={() => openChat("button")}
            aria-label="Have a question?"
            className={
              (roomsHome ? "" : "chat-fab ") +
              "flex items-center gap-2 rounded-full bg-accent font-bold text-white shadow-[0_8px_24px_rgba(255,107,53,.35)] hover:bg-accent-dark " +
              (roomsHome ? "px-[18px] py-[13px] text-[15px] md:px-5 md:py-3.5 md:text-base" : "px-5 py-3.5")
            }
          >
            <span className="text-lg leading-none">💬</span>
            {roomsHome ? "Have a question?" : "Ask a question"}
          </button>
        </div>
      )}

      <ChatDialog
        open={open}
        onClose={() => setOpen(false)}
        startTab={startTab}
        initialTrack={chatTrack}
      />
    </>
  );
}
