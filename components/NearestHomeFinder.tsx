"use client";

import { useState } from "react";

type Nearest = {
  id: string;
  name: string;
  neighborhood: string;
  city: string;
  miles: number;
  carLow: number;
  carHigh: number;
  fromPrice: string | null;
  roomsAvailable: number;
  rating: number | null;
  reviewCount: number | null;
  url: string;
};

export default function NearestHomeFinder() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ matched: string; nearest: Nearest[] } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const a = address.trim();
    if (!a || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/nearest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address: a }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
      } else {
        setResult(data);
      }
    } catch {
      setError("Couldn't reach the finder. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  const top = result?.nearest?.[0];
  const also = result?.nearest?.[1];

  return (
    <section className="mx-auto max-w-3xl px-4 pt-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-brand px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white">
            📍 Commute
          </span>
          <h2 className="text-lg font-extrabold text-ink">Find your closest home</h2>
        </div>
        <p className="mt-1.5 text-sm text-muted">
          Enter your work address (or anywhere you go often) and we&apos;ll show the nearest home.
        </p>

        <form onSubmit={submit} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. 191 Peachtree St NE, Atlanta, GA"
            aria-label="Your address"
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-base outline-none focus:border-brand focus:bg-white"
          />
          <button
            type="submit"
            disabled={loading || !address.trim()}
            className="btn-book shrink-0 px-5 py-2.5 disabled:opacity-40"
          >
            {loading ? "Finding…" : "Find closest home"}
          </button>
        </form>

        {error && (
          <div className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        {top && (
          <div className="mt-4">
            <p className="text-sm text-muted">
              Closest to <span className="font-semibold text-ink">{result?.matched}</span>:
            </p>

            <a
              href={top.url}
              className="mt-2 block rounded-2xl border border-brand/30 bg-brand/5 p-4 transition active:scale-[0.99]"
            >
              <div className="flex items-baseline justify-between gap-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-base font-extrabold text-ink">{top.name}</span>
                  {top.rating != null && (
                    <span className="text-xs font-bold text-amber-500">
                      ★ {top.rating.toFixed(1)}
                      {top.reviewCount ? (
                        <span className="font-normal text-muted"> ({top.reviewCount})</span>
                      ) : null}
                    </span>
                  )}
                </div>
                {top.fromPrice && (
                  <span className="text-sm font-bold text-ink">from {top.fromPrice}</span>
                )}
              </div>
              <div className="text-sm text-muted">{top.neighborhood}</div>
              <div className="mt-1 text-sm font-semibold text-brand">
                ~{top.miles} mi · about {top.carLow}–{top.carHigh} min by car
              </div>
              <div className="mt-0.5 text-xs text-muted">
                {top.roomsAvailable} room{top.roomsAvailable === 1 ? "" : "s"} available · tap to see rooms →
              </div>
            </a>

            {also && (
              <p className="mt-2 text-xs text-muted">
                Also nearby: <span className="font-semibold text-ink">{also.name}</span> in{" "}
                {also.neighborhood} (~{also.miles} mi, about {also.carLow}–{also.carHigh} min).
              </p>
            )}

            <p className="mt-2 text-[11px] text-slate-400">
              Distances are approximate, measured from each home&apos;s neighborhood. Exact addresses
              are shared after you book.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
