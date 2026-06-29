"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import faqData from "@/data/faq.json";
import ChatPanel from "./ChatPanel";

type Faq = { q: string; a: string; category?: string; link?: { label: string; url: string } };
const FAQS = faqData.faqs as Faq[];

// Group FAQs by category, preserving the order they first appear.
const FAQ_GROUPS: { category: string; items: Faq[] }[] = [];
for (const f of FAQS) {
  const category = f.category ?? "More";
  let group = FAQ_GROUPS.find((g) => g.category === category);
  if (!group) {
    group = { category, items: [] };
    FAQ_GROUPS.push(group);
  }
  group.items.push(f);
}

/** The shared "Have a question?" dialog (FAQ + chat). Controlled by callers. */
export default function ChatDialog({
  open,
  onClose,
  startTab = "faq",
}: {
  open: boolean;
  onClose: () => void;
  startTab?: "faq" | "chat";
}) {
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<"faq" | "chat">(startTab);

  // Portals need the DOM — only render after mount (avoids SSR mismatch).
  useEffect(() => setMounted(true), []);

  // Open on the tab the trigger asked for.
  useEffect(() => {
    if (open) setTab(startTab);
  }, [open, startTab]);

  // While the dialog is open: lock background scroll and close on Escape.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  // Portal to <body> so the fixed overlay escapes the header's backdrop-blur
  // containing block and fills the real viewport.
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Frequently asked questions"
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative z-10 flex h-[90vh] max-h-[640px] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-white shadow-card sm:rounded-2xl">
        {/* Header + tabs */}
        <div className="border-b border-slate-100 px-5 pt-4">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-lg font-extrabold text-ink">
              {tab === "faq" ? "Questions? We’ve got answers" : "Ask us anything"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mr-1 -mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-2xl leading-none text-muted hover:bg-slate-100"
            >
              ×
            </button>
          </div>
          <div className="mt-3 flex gap-1">
            <TabButton active={tab === "faq"} onClick={() => setTab("faq")}>
              FAQs
            </TabButton>
            <TabButton active={tab === "chat"} onClick={() => setTab("chat")}>
              💬 Ask anything
            </TabButton>
          </div>
        </div>

        {tab === "faq" ? (
          <>
            {/* Scrollable Q&A, grouped by category */}
            <div className="flex-1 overflow-y-auto px-5 [scrollbar-width:thin]">
              {FAQ_GROUPS.map((group) => (
                <div key={group.category} className="pt-3">
                  <h3 className="px-1 pb-1 text-xs font-bold uppercase tracking-wide text-muted">
                    {group.category}
                  </h3>
                  <div className="divide-y divide-slate-100">
                    {group.items.map((f, i) => (
                      <FaqItem key={i} faq={f} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="safe-bottom border-t border-slate-100 bg-slate-50 px-5 py-4">
              <p className="text-sm font-semibold text-ink">Didn’t find your answer?</p>
              <button type="button" onClick={() => setTab("chat")} className="btn-book mt-2 w-full py-2.5">
                💬 Ask our assistant
              </button>
            </div>
          </>
        ) : (
          <ChatPanel />
        )}
      </div>
    </div>,
    document.body
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-t-lg px-3 py-2 text-sm font-bold transition " +
        (active ? "border-b-2 border-brand text-brand" : "text-muted hover:text-ink")
      }
    >
      {children}
    </button>
  );
}

function FaqItem({ faq }: { faq: Faq }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="py-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 py-3 text-left"
        aria-expanded={open}
      >
        <span className="font-semibold text-ink">{faq.q}</span>
        <span className="shrink-0 text-xl leading-none text-brand">{open ? "–" : "+"}</span>
      </button>
      {open && (
        <div className="pb-3">
          <p className="text-sm leading-relaxed text-muted">{faq.a}</p>
          {faq.link && (
            <a
              href={faq.link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand underline"
            >
              {faq.link.label} →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
