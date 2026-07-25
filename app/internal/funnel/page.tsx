import type { Metadata } from "next";
import { getSiteFunnelMetrics } from "@/lib/posthog-query";
import { getOutreachData } from "@/lib/outreach";

// Live data every load — this is an internal reporting page, not a public one.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Growth dashboard",
  robots: { index: false, follow: false },
};

const DATA_START = "2026-07-08"; // the day PostHog went live — nothing to compare before this

function todayIso(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

// The queries filter timestamp < dateTo (exclusive), so passing TODAY's date
// as the upper bound excluded the entire current day — the dashboard would
// look frozen until the calendar date rolled over. Pass tomorrow instead so
// today's events are actually included.
function tomorrowIso(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.round((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

const DOW_NAMES = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]; // ClickHouse toDayOfWeek: 1=Mon..7=Sun

function formatHour(hour: number): string {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}${hour < 12 ? "am" : "pm"}`;
}

const pct = (n: number, of: number) => (of > 0 ? (n / of) * 100 : 0);

/** One step of a real, cumulative funnel — count plus its conversion % relative to a previous step. */
function FunnelBar({
  label,
  count,
  pctOf,
  pctLabel,
  color,
}: {
  label: string;
  count: number | string;
  /** 0-100, or null for the funnel's first step (no "% of" to show). */
  pctOf: number | null;
  /** What the % is relative to, e.g. "of visits" / "of applied". */
  pctLabel?: string;
  color: string;
}) {
  const numeric = typeof count === "number" ? count : 1;
  const barWidth = pctOf == null ? 100 : Math.max(Math.min(pctOf, 100), numeric > 0 ? 2 : 0);
  return (
    <div className="mb-4">
      <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
        <span className="font-semibold text-ink">{label}</span>
        <span className="text-right">
          <span className="font-bold text-ink">{count}</span>
          {pctOf != null && (
            <span className="ml-1.5 text-xs text-muted">
              {Math.round(pctOf)}%{pctLabel ? ` ${pctLabel}` : ""}
            </span>
          )}
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div className="h-3 rounded-full" style={{ width: `${barWidth}%`, background: color }} />
      </div>
    </div>
  );
}

/** A single applicant's CURRENT status — a snapshot distribution, not a cumulative funnel step. */
function StatusRow({ label, count, max, color }: { label: string; count: number; max: number; color: string }) {
  const width = max > 0 ? Math.max((count / max) * 100, count > 0 ? 6 : 0) : 0;
  return (
    <div className="mb-3">
      <div className="mb-1 flex items-center justify-between gap-3 text-sm">
        <span className="flex min-w-0 items-center gap-1.5 font-semibold text-ink">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />
          {label}
        </span>
        <span className="shrink-0 font-bold text-ink">{count}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div className="h-3 rounded-full" style={{ width: `${width}%`, background: color }} />
      </div>
    </div>
  );
}

function SectionCard({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <h2 className="text-sm font-bold text-ink">{title}</h2>
      {sub && <p className="mb-4 text-xs text-muted">{sub}</p>}
      {children}
    </div>
  );
}

export default async function InternalFunnelPage() {
  const todayDisplay = todayIso();
  const outreach = getOutreachData();

  let metrics: Awaited<ReturnType<typeof getSiteFunnelMetrics>> | null = null;
  let metricsError: string | null = null;
  try {
    metrics = await getSiteFunnelMetrics(DATA_START, tomorrowIso());
  } catch (err) {
    metricsError = err instanceof Error ? err.message : "Failed to load PostHog data.";
  }

  const sc = outreach.statusCounts;
  const maxStatus = Math.max(
    sc.registered,
    sc.applying,
    sc.approved,
    sc.move_in,
    sc.pending,
    sc.booking_fee_waived,
    sc.paid,
    1
  );
  // "pending" means they've already moved into another host's room and are in
  // PadSplit's 14-day reward-confirmation window — so it counts as moved in.
  const movedIn = sc.move_in + sc.pending + sc.booking_fee_waived + sc.paid;
  const approvedOrBeyond = sc.approved + movedIn;

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-8">
      <h1 className="text-xl font-extrabold text-ink">Growth dashboard</h1>
      <p className="mb-6 text-sm text-muted">
        {DATA_START} → {todayDisplay} (the window PostHog has data for). Not linked anywhere — bookmark this URL.
      </p>

      {metrics && metrics.errors.length > 0 && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="mb-1.5 text-sm font-bold text-amber-900">
            {metrics.errors.length} metric{metrics.errors.length === 1 ? "" : "s"} failed to load — everything
            else below is still live:
          </p>
          <ul className="list-disc space-y-1 pl-5 text-xs text-amber-800">
            {metrics.errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Booking funnel — one sequential path: visit -> explore -> book. */}
      <SectionCard title="Booking funnel" sub="Site visits this window, from PostHog">
        {metricsError ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {metricsError.includes("POSTHOG_PERSONAL_API_KEY")
              ? "PostHog isn't connected yet — add POSTHOG_PERSONAL_API_KEY in Vercel env vars."
              : `Couldn't load PostHog data: ${metricsError}`}
          </p>
        ) : metrics ? (
          <>
            <FunnelBar label="Site visits" count={metrics.sessions} pctOf={null} color="#334155" />
            <FunnelBar
              label="Explored 2+ pages"
              count={metrics.explored}
              pctOf={pct(metrics.explored, metrics.sessions)}
              pctLabel="of visits"
              color="#13A083"
            />
            <FunnelBar
              label="Clicked Book on PadSplit"
              count={`${metrics.bookClickSessions} sessions (${metrics.bookClickEvents} clicks)`}
              pctOf={pct(metrics.bookClickSessions, metrics.sessions)}
              pctLabel="of visits"
              color="#FF6B35"
            />
            <p className="mt-1 text-xs text-muted">
              {metrics.bounced} visit{metrics.bounced === 1 ? "" : "s"} (
              {Math.round(pct(metrics.bounced, metrics.sessions))}%) bounced — one page and gone.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4">
              <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                <div className="text-lg font-extrabold text-ink">
                  {metrics.avgSecondsToBook != null ? formatDuration(metrics.avgSecondsToBook) : "—"}
                </div>
                <div className="text-xs text-muted">Avg time on site before clicking Book</div>
              </div>
            </div>
          </>
        ) : null}
      </SectionCard>

      {/* Chat — a parallel, optional path. Most bookings still happen straight from browsing (see below). */}
      {metrics && !metricsError && (
        <SectionCard title="Chat" sub="How much people use the concierge, and whether it leads to a Book click">
          <FunnelBar
            label="Opened chat"
            count={metrics.chatOpenedSessions}
            pctOf={pct(metrics.chatOpenedSessions, metrics.sessions)}
            pctLabel="of visits"
            color="#0E7C66"
          />
          <FunnelBar
            label="Sent a chat message"
            count={metrics.chatMessageSentSessions}
            pctOf={pct(metrics.chatMessageSentSessions, metrics.chatOpenedSessions)}
            pctLabel="of chat-openers"
            color="#0A5C4C"
          />

          {metrics.bookClicksBySource.length > 0 && (
            <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2.5">
              {metrics.bookClicksBySource.map((s) => (
                <div key={s.source} className="flex justify-between text-sm">
                  <span className="text-ink capitalize">{s.source}</span>
                  <span className="font-semibold text-ink">{s.clicks}</span>
                </div>
              ))}
              <div className="mt-0.5 text-xs text-muted">
                Book clicks by where they happened — most still come straight from the page, not chat.
              </div>
            </div>
          )}

          <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-muted">
            Chips only vs. typed a message
          </p>
          {metrics.chatStyle.map((s) => (
            <div key={s.style} className="mb-1 flex justify-between text-sm">
              <span className="text-ink">{s.style}</span>
              <span className="text-muted">
                {s.sessions} sessions ·{" "}
                <b className="text-ink">{Math.round(pct(s.bookClicks, s.sessions))}% book-click rate</b>
              </span>
            </div>
          ))}

          <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-muted">Chat depth</p>
          {metrics.chatDepth.map((d) => (
            <div key={d.depth} className="mb-1 flex justify-between text-sm">
              <span className="text-ink">{d.depth}</span>
              <span className="text-muted">
                {d.sessions} sessions ·{" "}
                <b className="text-ink">{Math.round(pct(d.bookClicks, d.sessions))}% book-click rate</b>
              </span>
            </div>
          ))}

          <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-muted">FAQ tab</p>
          <div className="flex justify-between text-sm">
            <span className="text-ink">Viewed the FAQ tab</span>
            <span className="font-semibold text-ink">
              {metrics.faqSessions} sessions ({metrics.faqViews} views)
            </span>
          </div>
        </SectionCard>
      )}

      {/* Application funnel — a SEPARATE population/timeframe from the site funnel above
          (the applicant pool spans months; don't chain these two funnels' percentages together). */}
      <SectionCard title="Application funnel" sub={`From your applicant list · last updated ${outreach.applicantsLastUpdated}`}>
        <FunnelBar label="Applied" count={outreach.applicantCount} pctOf={null} color="#334155" />
        <FunnelBar
          label="Approved (or beyond)"
          count={approvedOrBeyond}
          pctOf={pct(approvedOrBeyond, outreach.applicantCount)}
          pctLabel="of applied"
          color="#16a34a"
        />
        <FunnelBar
          label="Moved in (or beyond)"
          count={movedIn}
          pctOf={pct(movedIn, approvedOrBeyond)}
          pctLabel="of approved"
          color="#0369a1"
        />
        <div className="grid grid-cols-2 gap-3">
          <FunnelBar
            label="Booking fee waived"
            count={sc.booking_fee_waived}
            pctOf={pct(sc.booking_fee_waived, movedIn)}
            pctLabel="of moved-in"
            color="#0E7C66"
          />
          <FunnelBar
            label="Paid ($250)"
            count={sc.paid}
            pctOf={pct(sc.paid, movedIn)}
            pctLabel="of moved-in"
            color="#FF6B35"
          />
        </div>
        <p className="mb-4 text-xs text-muted">
          Fee waived and Paid are two different outcomes once someone moves in — not sequential steps.
        </p>

        <p className="mb-2 mt-2 border-t border-slate-100 pt-4 text-xs font-semibold uppercase tracking-wide text-muted">
          Current stage of every applicant (a snapshot, not the funnel above)
        </p>
        <StatusRow label="Registered" count={sc.registered} max={maxStatus} color="#94a3b8" />
        <StatusRow label="Applying" count={sc.applying} max={maxStatus} color="#f59e0b" />
        <StatusRow label="Approved" count={sc.approved} max={maxStatus} color="#16a34a" />
        <StatusRow label="Move in" count={sc.move_in} max={maxStatus} color="#0369a1" />
        <StatusRow label="Booking fee waived" count={sc.booking_fee_waived} max={maxStatus} color="#0E7C66" />
        <StatusRow label="Reward pending (14 days)" count={sc.pending} max={maxStatus} color="#f59e0b" />
        <StatusRow label="Paid ($250)" count={sc.paid} max={maxStatus} color="#FF6B35" />

        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
          <div className="rounded-xl bg-brand/10 px-3 py-2.5">
            <div className="text-lg font-extrabold text-ink">{sc.booking_fee_waived}</div>
            <div className="text-xs text-muted">Moved into YOUR room — the goal</div>
          </div>
          <div className="rounded-xl bg-accent/10 px-3 py-2.5">
            <div className="text-lg font-extrabold text-ink">${outreach.cashPayout.toLocaleString()}</div>
            <div className="text-xs text-muted">Cash earned ({sc.paid} × ${outreach.payoutPerPaid}, other hosts)</div>
          </div>
        </div>
      </SectionCard>

      {/* Book clicks by room — detail, not part of the funnel shape, so it lives below both funnels. */}
      {metrics && !metricsError && metrics.byRoom.length > 0 && (
        <SectionCard title="Book clicks by room" sub="Which specific rooms get tapped">
          {metrics.byRoom.map((r) => (
            <div key={`${r.house}-${r.room}`} className="flex justify-between text-sm">
              <span className="text-ink">
                {r.house} <span className="text-muted">— {r.room}</span>
              </span>
              <span className="font-semibold text-ink">{r.clicks}</span>
            </div>
          ))}
        </SectionCard>
      )}

      {/* Segments */}
      {metrics && !metricsError && (
        <SectionCard title="Segments">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">By device</p>
          {metrics.byDevice.map((d) => (
            <div key={d.device} className="mb-1 flex justify-between text-sm">
              <span className="text-ink">{d.device}</span>
              <span className="text-muted">
                {d.sessions} sessions · <b className="text-ink">{Math.round(pct(d.bookClicks, d.sessions))}% booked</b> ·{" "}
                {Math.round(pct(d.chatOpened, d.sessions))}% chatted
              </span>
            </div>
          ))}

          <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-muted">By source</p>
          {metrics.byReferrer.map((r) => (
            <div key={r.referrer} className="mb-1 flex justify-between text-sm">
              <span className="text-ink">{r.referrer}</span>
              <span className="text-muted">
                {r.sessions} sessions · <b className="text-ink">{Math.round(pct(r.bookClicks, r.sessions))}% booked</b>
              </span>
            </div>
          ))}

          <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-muted">Repeat visitors</p>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-ink">Came back 2+ times</span>
            <span className="font-semibold text-ink">
              {metrics.returningVisitors} / {metrics.uniqueVisitors} (
              {Math.round(pct(metrics.returningVisitors, metrics.uniqueVisitors))}%)
            </span>
          </div>
          {metrics.visitsBeforeBooking.map((v) => (
            <div key={v.bucket} className="flex justify-between text-sm text-muted">
              <span>Booked on: {v.bucket}</span>
              <span className="font-semibold text-ink">{v.visitors}</span>
            </div>
          ))}
        </SectionCard>
      )}

      {/* Timing */}
      {metrics && !metricsError && (
        <SectionCard title="Timing" sub="America/New_York · useful for timing Facebook posts">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">By day of week</p>
          {metrics.byDayOfWeek.map((d) => (
            <div key={d.day} className="mb-1 flex justify-between text-sm">
              <span className="text-ink">{DOW_NAMES[d.day] ?? d.day}</span>
              <span className="text-muted">
                {d.visits} visits · <b className="text-ink">{d.bookClicks} book clicks</b>
              </span>
            </div>
          ))}

          <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-muted">Peak hours (top 5)</p>
          {[...metrics.byHour]
            .sort((a, b) => b.visits - a.visits)
            .slice(0, 5)
            .map((h) => (
              <div key={h.hour} className="mb-1 flex justify-between text-sm">
                <span className="text-ink">{formatHour(h.hour)}</span>
                <span className="text-muted">
                  {h.visits} visits · <b className="text-ink">{h.bookClicks} book clicks</b>
                </span>
              </div>
            ))}

          <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-muted">By position in the month</p>
          {metrics.byWeekOfMonth.map((w) => (
            <div key={w.week} className="mb-1 flex justify-between text-sm">
              <span className="text-ink">{w.week}</span>
              <span className="text-muted">
                {w.visits} visits · <b className="text-ink">{w.bookClicks} book clicks</b>
              </span>
            </div>
          ))}
          <p className="mt-3 text-xs text-muted">
            Still a short window ({DATA_START} onward) — this gets more meaningful as more full months accumulate.
          </p>
        </SectionCard>
      )}

      <p className="mt-2 text-xs text-muted">
        "Marketplace (Facebook)" = Facebook-sourced traffic without a Messenger tag (the marketplace link can&apos;t
        carry a tag without looking spammy). "Messenger" = tagged with ?utm_source=messenger on links you paste into
        chats. Update data/outreach.json (via Claude) whenever you check PadSplit&apos;s applicant list again.
      </p>
    </main>
  );
}
