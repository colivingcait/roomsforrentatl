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

function Bar({
  width,
  color,
  label,
  value,
}: {
  width: number; // 0-100
  color: string;
  label: string;
  value: string | number;
}) {
  return (
    <div className="mb-5">
      <div className="mb-1.5 flex items-baseline justify-between text-sm">
        <span className="font-semibold text-ink">{label}</span>
        <span className="text-muted">{value}</span>
      </div>
      <div className="flex h-6 items-center gap-2">
        <div
          className="h-6 min-w-[4px] rounded"
          style={{ width: `${Math.max(width, 2)}%`, background: color }}
          title={`${label}: ${value}`}
        />
        <span className="text-sm font-bold text-ink">{value}</span>
      </div>
    </div>
  );
}

function StatusRow({ label, count, max, color }: { label: string; count: number; max: number; color: string }) {
  const width = max > 0 ? Math.max((count / max) * 100, count > 0 ? 6 : 0) : 0;
  return (
    <div className="mb-2.5 grid grid-cols-[100px_1fr_28px] items-center gap-2.5 text-sm">
      <div className="flex items-center gap-1.5 font-semibold text-ink">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />
        {label}
      </div>
      <div className="h-4">
        <div className="h-4 rounded" style={{ width: `${width}%`, background: color }} />
      </div>
      <div className="text-right font-bold text-ink">{count}</div>
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
    sc.pending,
    sc.approved,
    sc.move_in,
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

      {/* Site funnel */}
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
        <h2 className="text-sm font-bold text-ink">Site funnel</h2>
        <p className="mb-4 text-xs text-muted">All traffic in this window, from PostHog</p>

        {metricsError ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {metricsError.includes("POSTHOG_PERSONAL_API_KEY")
              ? "PostHog isn't connected yet — add POSTHOG_PERSONAL_API_KEY in Vercel env vars."
              : `Couldn't load PostHog data: ${metricsError}`}
          </p>
        ) : metrics ? (
          <>
            <div className="mb-1.5 flex items-baseline justify-between text-sm">
              <span className="font-semibold text-ink">Site visits</span>
              <span className="text-muted">{metrics.sessions}</span>
            </div>
            <div className="mb-1 flex h-6 gap-0.5">
              <div
                className="h-6 rounded-l"
                style={{ width: `${(metrics.bounced / Math.max(metrics.sessions, 1)) * 100}%`, background: "#94a3b8" }}
                title={`Bounced: ${metrics.bounced}`}
              />
              <div
                className="h-6 rounded-r"
                style={{ width: `${(metrics.explored / Math.max(metrics.sessions, 1)) * 100}%`, background: "#13A083" }}
                title={`Explored: ${metrics.explored}`}
              />
            </div>
            <div className="mb-5 flex flex-wrap gap-4 text-xs text-muted">
              <span>
                <span className="mr-1 inline-block h-2 w-2 rounded-full align-middle" style={{ background: "#94a3b8" }} />
                Bounced — {metrics.bounced} (
                {Math.round((metrics.bounced / Math.max(metrics.sessions, 1)) * 100)}%), one page and gone
              </span>
              <span>
                <span className="mr-1 inline-block h-2 w-2 rounded-full align-middle" style={{ background: "#13A083" }} />
                Explored — {metrics.explored} (
                {Math.round((metrics.explored / Math.max(metrics.sessions, 1)) * 100)}%), 2+ pages
              </span>
            </div>

            <Bar
              width={(metrics.chatOpenedSessions / Math.max(metrics.sessions, 1)) * 100}
              color="#0E7C66"
              label="Opened chat"
              value={metrics.chatOpenedSessions}
            />
            <Bar
              width={(metrics.chatMessageSentSessions / Math.max(metrics.sessions, 1)) * 100}
              color="#0A5C4C"
              label="Sent a chat message"
              value={metrics.chatMessageSentSessions}
            />
            <Bar
              width={(metrics.bookClickSessions / Math.max(metrics.sessions, 1)) * 100}
              color="#FF6B35"
              label="Clicked Book on PadSplit"
              value={`${metrics.bookClickSessions} sessions (${metrics.bookClickEvents} clicks)`}
            />

            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
              <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                <div className="text-lg font-extrabold text-ink">
                  {metrics.avgSecondsToBook != null ? formatDuration(metrics.avgSecondsToBook) : "—"}
                </div>
                <div className="text-xs text-muted">Avg time on site before clicking Book</div>
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                {metrics.bookClicksBySource.map((s) => (
                  <div key={s.source} className="flex justify-between text-sm">
                    <span className="text-ink capitalize">{s.source}</span>
                    <span className="font-semibold text-ink">{s.clicks}</span>
                  </div>
                ))}
                <div className="mt-0.5 text-xs text-muted">Book clicks: chat vs house page</div>
              </div>
            </div>

            {metrics.byRoom.length > 0 && (
              <div className="mt-3 border-t border-slate-100 pt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Book clicks by room</p>
                {metrics.byRoom.map((r) => (
                  <div key={`${r.house}-${r.room}`} className="flex justify-between text-sm">
                    <span className="text-ink">
                      {r.house} <span className="text-muted">— {r.room}</span>
                    </span>
                    <span className="font-semibold text-ink">{r.clicks}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : null}
      </div>

      {/* PadSplit applications */}
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
        <h2 className="text-sm font-bold text-ink">PadSplit applications</h2>
        <p className="mb-4 text-xs text-muted">
          From your applicant list · last updated {outreach.applicantsLastUpdated}
        </p>
        <div className="mb-4 flex items-center gap-6">
          <div>
            <div className="text-2xl font-extrabold text-ink">{outreach.applicantCount}</div>
            <div className="text-xs text-muted">Applied</div>
          </div>
          <div className="text-muted">→</div>
          <div>
            <div className="text-2xl font-extrabold text-ink">{approvedOrBeyond}</div>
            <div className="text-xs text-muted">Approved</div>
          </div>
          <div className="text-muted">→</div>
          <div>
            <div className="text-2xl font-extrabold text-ink">{movedIn}</div>
            <div className="text-xs text-muted">Moved in</div>
          </div>
        </div>
        <StatusRow label="Registered" count={sc.registered} max={maxStatus} color="#94a3b8" />
        <StatusRow label="Applying" count={sc.applying} max={maxStatus} color="#f59e0b" />
        <StatusRow label="Approved" count={sc.approved} max={maxStatus} color="#16a34a" />
        <StatusRow label="Move in" count={sc.move_in} max={maxStatus} color="#0369a1" />
        <StatusRow label="Booking fee waived" count={sc.booking_fee_waived} max={maxStatus} color="#0E7C66" />
        <StatusRow label="Pending (14-day reward clock)" count={sc.pending} max={maxStatus} color="#f59e0b" />
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
      </div>

      {/* Additional signals */}
      {metrics && (
        <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <h2 className="mb-4 text-sm font-bold text-ink">Additional signals</h2>

          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">By device</p>
          {metrics.byDevice.map((d) => (
            <div key={d.device} className="mb-1 flex justify-between text-sm">
              <span className="text-ink">{d.device}</span>
              <span className="text-muted">
                {d.sessions} sessions · <b className="text-ink">{Math.round((d.bookClicks / Math.max(d.sessions, 1)) * 100)}% booked</b> ·{" "}
                {Math.round((d.chatOpened / Math.max(d.sessions, 1)) * 100)}% chatted
              </span>
            </div>
          ))}

          <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-muted">By source</p>
          {metrics.byReferrer.map((r) => (
            <div key={r.referrer} className="mb-1 flex justify-between text-sm">
              <span className="text-ink">{r.referrer}</span>
              <span className="text-muted">
                {r.sessions} sessions · <b className="text-ink">{Math.round((r.bookClicks / Math.max(r.sessions, 1)) * 100)}% booked</b>
              </span>
            </div>
          ))}

          <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-muted">Repeat visitors</p>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-ink">Came back 2+ times</span>
            <span className="font-semibold text-ink">
              {metrics.returningVisitors} / {metrics.uniqueVisitors} (
              {Math.round((metrics.returningVisitors / Math.max(metrics.uniqueVisitors, 1)) * 100)}%)
            </span>
          </div>
          {metrics.visitsBeforeBooking.map((v) => (
            <div key={v.bucket} className="flex justify-between text-sm text-muted">
              <span>Booked on: {v.bucket}</span>
              <span className="font-semibold text-ink">{v.visitors}</span>
            </div>
          ))}
        </div>
      )}

      {/* Chat engagement */}
      {metrics && (
        <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <h2 className="text-sm font-bold text-ink">Chat engagement</h2>
          <p className="mb-4 text-xs text-muted">
            "Book-click rate" here, not confirmed bookings — see PadSplit Applications above for real outcomes.
          </p>

          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Chips only vs. typed a message</p>
          {metrics.chatStyle.map((s) => (
            <div key={s.style} className="mb-1 flex justify-between text-sm">
              <span className="text-ink">{s.style}</span>
              <span className="text-muted">
                {s.sessions} sessions ·{" "}
                <b className="text-ink">{Math.round((s.bookClicks / Math.max(s.sessions, 1)) * 100)}% book-click rate</b>
              </span>
            </div>
          ))}

          <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-muted">Chat depth</p>
          {metrics.chatDepth.map((d) => (
            <div key={d.depth} className="mb-1 flex justify-between text-sm">
              <span className="text-ink">{d.depth}</span>
              <span className="text-muted">
                {d.sessions} sessions ·{" "}
                <b className="text-ink">{Math.round((d.bookClicks / Math.max(d.sessions, 1)) * 100)}% book-click rate</b>
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
        </div>
      )}

      {/* Timing */}
      {metrics && (
        <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <h2 className="text-sm font-bold text-ink">Timing</h2>
          <p className="mb-4 text-xs text-muted">America/New_York · useful for timing Facebook posts</p>

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
        </div>
      )}

      <p className="mt-2 text-xs text-muted">
        "Marketplace (Facebook)" = Facebook-sourced traffic without a Messenger tag (the marketplace link can&apos;t
        carry a tag without looking spammy). "Messenger" = tagged with ?utm_source=messenger on links you paste into
        chats. Update data/outreach.json (via Claude) whenever you check PadSplit&apos;s applicant list again.
      </p>
    </main>
  );
}
