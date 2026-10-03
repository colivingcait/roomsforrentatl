import type { ReactNode } from "react";

const CARDS = [
  {
    icon: "🗓️",
    title: "Weekly rent, longer stays",
    body: "Pay by the week — but most residents stay 6–12 months. No long lease required.",
  },
  {
    icon: "✅",
    title: "Background-checked residents",
    body: "Every resident is background-screened, so you know who you’re living with.",
  },
  {
    icon: "🔐",
    title: "Your own door lock",
    body: "Each room has its own electronic door lock for real safety and privacy.",
  },
];

/** Dark homepage band, or the lighter cards used on house pages. */
export default function TrustBand({ variant = "cards" }: { variant?: "cards" | "band" }) {
  if (variant === "band") {
    return (
      <section className="bg-ink text-white">
        <div className="mx-auto max-w-[1080px] px-[18px] py-7 md:px-6 md:py-10">
          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.08em] text-[#FFB08F] before:h-[3px] before:w-[18px] before:rounded-sm before:bg-[#FFB08F]">
            Simple to start
          </span>
          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-[18px] md:grid-cols-4 md:gap-6">
            <BandItem
              icon={<DollarIcon />}
              title="$19 to apply"
              body="No deposit. Some hosts charge a one-time move-in fee, shown on each listing."
            />
            <BandItem
              icon={<CardIcon />}
              title="Income 2× the rent"
              body="No credit score. Pay stub, bank statement or offer letter."
            />
            <BandItem
              icon={<LockIcon />}
              title="Your own locked room"
              body="Every resident is background-screened."
            />
            <BandItem
              icon={<CalendarIcon />}
              title="Pay weekly or biweekly"
              body="No long lease. Pet-free (service animals welcome)."
            />
          </ul>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-6">
      <h2 className="mb-3 text-lg font-bold text-ink">Good to know</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {CARDS.map((p) => (
          <div key={p.title} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card">
            <div className="text-2xl">{p.icon}</div>
            <h3 className="mt-2 font-bold leading-snug text-ink">{p.title}</h3>
            <p className="mt-1 text-sm text-muted">{p.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function BandItem({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <li className="flex flex-col gap-[3px]">
      <i className="mb-1.5 grid h-[34px] w-[34px] place-items-center rounded-[10px] bg-white/10 text-[#5EEAD4]">{icon}</i>
      <b className="text-sm font-extrabold leading-snug">{title}</b>
      <span className="text-[12.5px] leading-[1.45] text-[#CBD5E1]">{body}</span>
    </li>
  );
}

function DollarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M14.5 9.5c-.5-1-1.5-1.5-2.5-1.5-1.5 0-2.5.8-2.5 2s1 1.7 2.5 2 2.5.8 2.5 2-1 2-2.5 2c-1.1 0-2.1-.5-2.6-1.5M12 6.5V8M12 16v1.5" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18M7 15h4" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 10h16M9 3v4M15 3v4" />
    </svg>
  );
}
