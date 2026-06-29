const POINTS = [
  {
    icon: "🗓️",
    title: "Weekly rent, longer stays",
    body: "Pay by the week — but most residents stay 6–12 months. No long lease required.",
  },
  {
    icon: "✅",
    title: "Background-checked residents",
    body: "Every PadSplit member is background-screened, so you know who you’re living with.",
  },
  {
    icon: "🔐",
    title: "Your own door lock",
    body: "Each room has its own electronic door lock for real safety and privacy.",
  },
];

export default function TrustBand() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-6">
      <h2 className="mb-3 text-lg font-bold text-ink">Good to know</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {POINTS.map((p) => (
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
