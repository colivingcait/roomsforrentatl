"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import faqData from "@/data/faq.json";
import { site } from "@/lib/site";

const FAQS = faqData.faqs as { q: string; a: string }[];

export default function FaqButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Portals need the DOM — only render after mount (avoids SSR mismatch).
  useEffect(() => setMounted(true), []);

  // While the dialog is open: lock background scroll and close on Escape.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        Have a question?
      </button>

      {/* Rendered through a portal to <body> so the fixed overlay escapes the
          header's `backdrop-blur` containing block and fills the real viewport. */}
      {open &&
        mounted &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Frequently asked questions"
          >
            <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />

            <div className="relative z-10 flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-white shadow-card sm:max-h-[85vh] sm:rounded-2xl">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
                <h2 className="text-lg font-extrabold text-ink">Questions? We’ve got answers</h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="-mr-1 -mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-2xl leading-none text-muted hover:bg-slate-100"
                >
                  ×
                </button>
              </div>

              {/* Scrollable Q&A */}
              <div className="flex-1 overflow-y-auto px-5 [scrollbar-width:thin]">
                <div className="divide-y divide-slate-100">
                  {FAQS.map((f, i) => (
                    <FaqItem key={i} q={f.q} a={f.a} />
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="safe-bottom border-t border-slate-100 bg-slate-50 px-5 py-4">
                <p className="text-sm font-semibold text-ink">Still have a question?</p>
                <div className="mt-2 flex gap-2">
                  <a href={site.smsHref} className="btn-book flex-1 py-2.5">
                    💬 Text us
                  </a>
                  <a href={site.phoneHref} className="btn-secondary px-4 py-2.5">
                    Call
                  </a>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="py-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 py-3 text-left"
        aria-expanded={open}
      >
        <span className="font-semibold text-ink">{q}</span>
        <span className="shrink-0 text-xl leading-none text-brand">{open ? "–" : "+"}</span>
      </button>
      {open && <p className="pb-3 text-sm leading-relaxed text-muted">{a}</p>}
    </div>
  );
}
