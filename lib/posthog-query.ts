import "server-only";

/**
 * Server-side PostHog HogQL querying for the internal funnel dashboard.
 * Uses a Personal API Key (read-only "Query" scope) — never expose this key
 * to the client. Separate from the public project key used for capturing
 * events in lib/posthog.ts, which has no read access.
 */
const API_HOST = process.env.POSTHOG_API_HOST ?? "https://us.posthog.com";
const PROJECT_ID = process.env.POSTHOG_PROJECT_ID ?? "503195";
const API_KEY = process.env.POSTHOG_PERSONAL_API_KEY;

type QueryResult = { columns: string[]; results: unknown[][] };

async function queryHogQL(query: string): Promise<QueryResult> {
  if (!API_KEY) {
    throw new Error("POSTHOG_PERSONAL_API_KEY is not set — the funnel dashboard needs it to read data.");
  }
  const res = await fetch(`${API_HOST}/api/projects/${PROJECT_ID}/query/`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`PostHog query failed (${res.status}): ${text.slice(0, 500)}`);
  }
  return res.json();
}

/** ISO date (YYYY-MM-DD) → a safe literal for inline HogQL date comparisons. Dates are always server-generated, never raw user input. */
function dt(isoDate: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) throw new Error(`Bad date: ${isoDate}`);
  return `toDateTime('${isoDate}')`;
}

export interface SiteFunnelMetrics {
  sessions: number;
  bounced: number;
  explored: number;
  chatOpenedSessions: number;
  chatMessageSentSessions: number;
  bookClickSessions: number;
  bookClickEvents: number;
  applyClickSessions: number;
  byHouse: { house: string; clicks: number }[];
  byDevice: { device: string; sessions: number; bookClicks: number; chatOpened: number }[];
  byReferrer: { referrer: string; sessions: number; bookClicks: number }[];
  uniqueVisitors: number;
  returningVisitors: number;
}

/**
 * Pulls every automatable metric for the internal dashboard in one date
 * range. Runs several independent HogQL queries in parallel rather than one
 * giant query, so a single query's syntax issue doesn't block the rest.
 */
export async function getSiteFunnelMetrics(dateFrom: string, dateTo: string): Promise<SiteFunnelMetrics> {
  const from = dt(dateFrom);
  const to = dt(dateTo);

  const [sessionShape, funnelEvents, byHouse, byDevice, byReferrer, visitors] = await Promise.all([
    // Sessions + bounce vs explore, from pageview counts per session.
    queryHogQL(`
      SELECT count() AS sessions, countIf(pv_count = 1) AS bounced, countIf(pv_count > 1) AS explored
      FROM (
        SELECT properties['$session_id'] AS session_id, count() AS pv_count
        FROM events
        WHERE event = '$pageview' AND timestamp >= ${from} AND timestamp < ${to}
        GROUP BY session_id
      )
    `),
    // Unique sessions + total events for each funnel event.
    queryHogQL(`
      SELECT event, count(DISTINCT properties['$session_id']) AS sessions, count() AS total
      FROM events
      WHERE event IN ('chat_opened', 'chat_message_sent', 'book_click', 'apply_click')
        AND timestamp >= ${from} AND timestamp < ${to}
      GROUP BY event
    `),
    // Book clicks by house.
    queryHogQL(`
      SELECT properties['houseName'] AS house, count() AS clicks
      FROM events
      WHERE event = 'book_click' AND timestamp >= ${from} AND timestamp < ${to}
      GROUP BY house
      ORDER BY clicks DESC
    `),
    // Device → session count, book_click rate, chat_opened rate.
    queryHogQL(`
      SELECT
        device,
        count() AS sessions,
        countIf(booked) AS book_clicks,
        countIf(chatted) AS chat_opened
      FROM (
        SELECT
          session_id,
          argMin(device_type, ts) AS device,
          maxIf(1, event = 'book_click') AS booked,
          maxIf(1, event = 'chat_opened') AS chatted
        FROM (
          SELECT properties['$session_id'] AS session_id, timestamp AS ts, event AS event,
                 properties['$device_type'] AS device_type
          FROM events
          WHERE timestamp >= ${from} AND timestamp < ${to}
            AND (event = '$pageview' OR event = 'book_click' OR event = 'chat_opened')
        )
        GROUP BY session_id
      )
      GROUP BY device
    `),
    // Referring domain, split into: Messenger (explicitly tagged via UTM —
    // the marketplace link can't carry a tag without looking spammy, so it's
    // untagged), Marketplace (Facebook-sourced but NOT UTM-tagged: referring
    // domain is facebook.com/m.facebook.com/etc, OR the referrer header got
    // stripped by Facebook's in-app browser but an fbclid survived on the
    // URL), Google, and Direct/other (no Facebook signal at all).
    queryHogQL(`
      SELECT
        multiIf(
          utm_source = 'messenger', 'Messenger',
          (referrer LIKE '%facebook.com%' OR fbclid != ''), 'Marketplace (Facebook)',
          referrer LIKE '%google.%', 'Google',
          referrer = '' OR referrer IS NULL, 'Direct',
          referrer
        ) AS ref,
        count() AS sessions,
        countIf(booked) AS book_clicks
      FROM (
        SELECT
          session_id,
          argMin(referring_domain, ts) AS referrer,
          argMin(utm_source_val, ts) AS utm_source,
          argMin(fbclid_val, ts) AS fbclid,
          maxIf(1, event = 'book_click') AS booked
        FROM (
          SELECT properties['$session_id'] AS session_id, timestamp AS ts, event AS event,
                 properties['$referring_domain'] AS referring_domain,
                 properties['utm_source'] AS utm_source_val,
                 properties['fbclid'] AS fbclid_val
          FROM events
          WHERE timestamp >= ${from} AND timestamp < ${to}
            AND (event = '$pageview' OR event = 'book_click')
        )
        GROUP BY session_id
      )
      GROUP BY ref
      ORDER BY sessions DESC
    `),
    // Unique visitors + how many came back for 2+ sessions.
    queryHogQL(`
      SELECT count() AS visitors, countIf(session_count > 1) AS returning
      FROM (
        SELECT distinct_id, count(DISTINCT properties['$session_id']) AS session_count
        FROM events
        WHERE timestamp >= ${from} AND timestamp < ${to}
        GROUP BY distinct_id
      )
    `),
  ]);

  const row = (r: QueryResult) => r.results[0] ?? [];
  const [sessions, bounced, explored] = row(sessionShape) as [number, number, number];

  const eventCounts = new Map<string, { sessions: number; total: number }>();
  for (const [event, s, t] of funnelEvents.results as [string, number, number][]) {
    eventCounts.set(event, { sessions: s, total: t });
  }

  const [visitorCount, returningCount] = row(visitors) as [number, number];

  return {
    sessions: sessions ?? 0,
    bounced: bounced ?? 0,
    explored: explored ?? 0,
    chatOpenedSessions: eventCounts.get("chat_opened")?.sessions ?? 0,
    chatMessageSentSessions: eventCounts.get("chat_message_sent")?.sessions ?? 0,
    bookClickSessions: eventCounts.get("book_click")?.sessions ?? 0,
    bookClickEvents: eventCounts.get("book_click")?.total ?? 0,
    applyClickSessions: eventCounts.get("apply_click")?.sessions ?? 0,
    byHouse: (byHouse.results as [string, number][])
      .filter(([house]) => !!house)
      .map(([house, clicks]) => ({ house, clicks })),
    byDevice: (byDevice.results as [string, number, number, number][]).map(
      ([device, s, book, chat]) => ({ device: device ?? "Unknown", sessions: s, bookClicks: book, chatOpened: chat })
    ),
    byReferrer: (byReferrer.results as [string, number, number][]).map(([referrer, s, book]) => ({
      referrer,
      sessions: s,
      bookClicks: book,
    })),
    uniqueVisitors: visitorCount ?? 0,
    returningVisitors: returningCount ?? 0,
  };
}
