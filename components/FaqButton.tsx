"use client";

import { useState } from "react";
import faqData from "@/data/faq.json";
import { site } from "@/lib/site";

const FAQS = faqData.faqs as { q: string; a: string }[];

export default function FaqButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        Have a question?
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="safe-bottom relative z-10 max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 shadow-card sm:rounded-2xl">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-lg font-extrabold text-ink">Questions? We’ve got answers</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="-mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-2xl leading-none text-muted hover:bg-slate-100"
              >
                ×
              </button>
            </div>

            <div className="mt-3 divide-y divide-slate-100">
              {FAQS.map((f, i) => (
                <FaqItem key={i} q={f.q} a={f.a} />
              ))}
            </div>

            <div className="mt-4 rounded-xl bg-slate-50 p-3">
              <p className="text-sm font-semibold text-ink">Still have a question?</p>
              <div className="mt-2 flex gap-2">
                <a href={site.smsHref} className="btn-book flex-1 py-2.5">💬 Text us</a>
                <a href={site.phoneHref} className="btn-secondary px-4 py-2.5">Call</a>
              </div>
            </div>
          </div>
        </div>
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
        className="flex w-full items-center justify-between gap-3 py-2.5 text-left"
      >
        <span className="font-semibold text-ink">{q}</span>
        <span className="shrink-0 text-xl leading-none text-brand">{open ? "–" : "+"}</span>
      </button>
      {open && <p className="pb-3 text-sm leading-relaxed text-muted">{a}</p>}
    </div>
  );
}
