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

/**
 * Runs one query and NEVER throws — a syntax issue in one metric shouldn't
 * blank out every other metric on the dashboard. Failures collect into the
 * `errors` array on the final result instead, each labeled by name.
 */
async function safe<T>(
  label: string,
  query: string,
  parse: (r: QueryResult) => T,
  fallback: T,
  errors: string[]
): Promise<T> {
  try {
    return parse(await queryHogQL(query));
  } catch (err) {
    errors.push(`${label}: ${err instanceof Error ? err.message : String(err)}`);
    return fallback;
  }
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
  byRoom: { house: string; room: string; clicks: number }[];
  byDevice: { device: string; sessions: number; bookClicks: number; chatOpened: number }[];
  byReferrer: { referrer: string; sessions: number; bookClicks: number }[];
  bookClicksBySource: { source: string; clicks: number }[];
  avgSecondsToBook: number | null;
  uniqueVisitors: number;
  returningVisitors: number;
  chatStyle: { style: string; sessions: number; bookClicks: number }[];
  chatDepth: { depth: string; sessions: number; bookClicks: number }[];
  visitsBeforeBooking: { bucket: string; visitors: number }[];
  byHour: { hour: number; visits: number; bookClicks: number }[];
  byDayOfWeek: { day: number; visits: number; bookClicks: number }[];
  byWeekOfMonth: { week: string; visits: number; bookClicks: number }[];
  faqSessions: number;
  faqViews: number;
  /** Per-query error messages, if the overall fetch didn't throw (config missing) but a specific query did. */
  errors: string[];
}

const row = (r: QueryResult) => r.results[0] ?? [];

/**
 * Pulls every automatable metric for the internal dashboard in one date
 * range. Each metric is its own independent query (see `safe`) — one bad
 * query surfaces as one error line, not a blank dashboard.
 */
export async function getSiteFunnelMetrics(dateFrom: string, dateTo: string): Promise<SiteFunnelMetrics> {
  if (!API_KEY) {
    throw new Error("POSTHOG_PERSONAL_API_KEY is not set — the funnel dashboard needs it to read data.");
  }
  const from = dt(dateFrom);
  const to = dt(dateTo);
  const errors: string[] = [];

  const [
    sessionShape,
    funnelEvents,
    byHouse,
    byDevice,
    byReferrer,
    visitors,
    bookSource,
    avgSecondsToBook,
    byRoom,
    chatStyle,
    chatDepth,
    visitsBeforeBooking,
    byHour,
    byDayOfWeek,
    faqUsage,
    byWeekOfMonth,
  ] = await Promise.all([
    safe(
      "Site visits / bounce / explore",
      `
        SELECT count() AS sessions, countIf(pv_count = 1) AS bounced, countIf(pv_count > 1) AS explored
        FROM (
          SELECT properties['$session_id'] AS session_id, count() AS pv_count
          FROM events
          WHERE event = '$pageview' AND timestamp >= ${from} AND timestamp < ${to}
          GROUP BY session_id
        )
      `,
      (r) => row(r) as [number, number, number],
      [0, 0, 0] as [number, number, number],
      errors
    ),
    safe(
      "Chat/book/apply funnel",
      `
        SELECT event, count(DISTINCT properties['$session_id']) AS sessions, count() AS total
        FROM events
        WHERE event IN ('chat_opened', 'chat_message_sent', 'book_click', 'apply_click')
          AND timestamp >= ${from} AND timestamp < ${to}
        GROUP BY event
      `,
      (r) => r.results as [string, number, number][],
      [] as [string, number, number][],
      errors
    ),
    safe(
      "Book clicks by house",
      `
        SELECT properties['houseName'] AS house, count() AS clicks
        FROM events
        WHERE event = 'book_click' AND timestamp >= ${from} AND timestamp < ${to}
        GROUP BY house
        ORDER BY clicks DESC
      `,
      (r) => r.results as [string, number][],
      [] as [string, number][],
      errors
    ),
    safe(
      "By device",
      `
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
      `,
      (r) => r.results as [string, number, number, number][],
      [] as [string, number, number, number][],
      errors
    ),
    // Referring domain, split into: Messenger (explicitly tagged via UTM —
    // the marketplace link can't carry a tag without looking spammy, so it's
    // untagged), Marketplace (roomsforrentatl.com/l — definitively tagged),
    // Marketplace, untagged (older/pasted-elsewhere Facebook traffic without
    // either short link: referring domain is facebook.com/m.facebook.com/etc,
    // OR the referrer header got stripped by Facebook's in-app browser but an
    // fbclid survived on the URL), Google, and Direct/other.
    safe(
      "By referrer",
      `
        SELECT
          multiIf(
            utm_source = 'messenger', 'Messenger',
            utm_source = 'marketplace', 'Marketplace (Facebook)',
            (referrer LIKE '%facebook.com%' OR fbclid != ''), 'Marketplace (Facebook, untagged)',
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
      `,
      (r) => r.results as [string, number, number][],
      [] as [string, number, number][],
      errors
    ),
    safe(
      "Unique / returning visitors",
      `
        SELECT count() AS visitors, countIf(session_count > 1) AS returning
        FROM (
          SELECT distinct_id, count(DISTINCT properties['$session_id']) AS session_count
          FROM events
          WHERE timestamp >= ${from} AND timestamp < ${to}
          GROUP BY distinct_id
        )
      `,
      (r) => row(r) as [number, number],
      [0, 0] as [number, number],
      errors
    ),
    safe(
      "Book clicks by source (chat vs page)",
      `
        SELECT coalesce(nullif(properties['source'], ''), 'page') AS source, count() AS clicks
        FROM events
        WHERE event = 'book_click' AND timestamp >= ${from} AND timestamp < ${to}
        GROUP BY source
        ORDER BY clicks DESC
      `,
      (r) => r.results as [string, number][],
      [] as [string, number][],
      errors
    ),
    safe(
      "Avg time to book",
      `
        SELECT avg(dateDiff('second', first_pv, first_book)) AS avg_seconds
        FROM (
          SELECT
            properties['$session_id'] AS session_id,
            minIf(timestamp, event = '$pageview') AS first_pv,
            minIf(timestamp, event = 'book_click') AS first_book
          FROM events
          WHERE timestamp >= ${from} AND timestamp < ${to}
            AND (event = '$pageview' OR event = 'book_click')
          GROUP BY session_id
          HAVING count(DISTINCT event) = 2
        )
      `,
      (r) => (row(r) as [number | null])[0] ?? null,
      null as number | null,
      errors
    ),
    safe(
      "Book clicks by room",
      `
        SELECT
          properties['houseName'] AS house,
          coalesce(
            nullif(properties['roomTitle'], ''),
            if(properties['source'] = 'chat', 'Chat (house-level)', concat('Room ', properties['room']))
          ) AS room,
          count() AS clicks
        FROM events
        WHERE event = 'book_click' AND timestamp >= ${from} AND timestamp < ${to}
        GROUP BY house, room
        ORDER BY clicks DESC
      `,
      (r) => r.results as [string, string, number][],
      [] as [string, string, number][],
      errors
    ),
    safe(
      "Chips vs typed",
      `
        SELECT
          multiIf(has_typed = 1, 'Typed at least once', 'Chips only') AS style,
          count() AS sessions,
          countIf(booked = 1) AS book_clicks
        FROM (
          SELECT
            properties['$session_id'] AS session_id,
            maxIf(1, event = 'chat_message_sent' AND properties['source'] = 'typed') AS has_typed,
            maxIf(1, event = 'chat_message_sent') AS chatted,
            maxIf(1, event = 'book_click') AS booked
          FROM events
          WHERE timestamp >= ${from} AND timestamp < ${to}
            AND (event = 'chat_message_sent' OR event = 'book_click')
          GROUP BY session_id
        )
        WHERE chatted = 1
        GROUP BY style
      `,
      (r) => r.results as [string, number, number][],
      [] as [string, number, number][],
      errors
    ),
    safe(
      "Chat depth vs book-click rate",
      `
        SELECT
          multiIf(max_turn <= 1, '1 message', max_turn <= 3, '2-3 messages', '4+ messages') AS depth,
          count() AS sessions,
          countIf(booked = 1) AS book_clicks
        FROM (
          SELECT
            properties['$session_id'] AS session_id,
            max(toIntOrZero(toString(properties['turn']))) AS max_turn,
            maxIf(1, event = 'book_click') AS booked
          FROM events
          WHERE timestamp >= ${from} AND timestamp < ${to}
            AND (event = 'chat_message_sent' OR event = 'book_click')
          GROUP BY session_id
          HAVING max_turn > 0
        )
        GROUP BY depth
      `,
      (r) => r.results as [string, number, number][],
      [] as [string, number, number][],
      errors
    ),
    safe(
      "Visits before booking",
      `
        SELECT
          multiIf(session_count <= 1, '1st visit', '2+ visits') AS bucket,
          count() AS visitors
        FROM (
          SELECT
            distinct_id,
            count(DISTINCT properties['$session_id']) AS session_count,
            maxIf(1, event = 'book_click') AS booked
          FROM events
          WHERE timestamp >= ${from} AND timestamp < ${to}
          GROUP BY distinct_id
        )
        WHERE booked = 1
        GROUP BY bucket
      `,
      (r) => r.results as [string, number][],
      [] as [string, number][],
      errors
    ),
    safe(
      "By hour of day",
      `
        SELECT
          toHour(toTimeZone(ts, 'America/New_York')) AS hour,
          countIf(ev = '$pageview') AS visits,
          countIf(ev = 'book_click') AS book_clicks
        FROM (
          SELECT timestamp AS ts, event AS ev
          FROM events
          WHERE timestamp >= ${from} AND timestamp < ${to} AND (event = '$pageview' OR event = 'book_click')
        )
        GROUP BY hour
        ORDER BY hour
      `,
      (r) => r.results as [number, number, number][],
      [] as [number, number, number][],
      errors
    ),
    safe(
      "By day of week",
      `
        SELECT
          toDayOfWeek(toTimeZone(ts, 'America/New_York')) AS day,
          countIf(ev = '$pageview') AS visits,
          countIf(ev = 'book_click') AS book_clicks
        FROM (
          SELECT timestamp AS ts, event AS ev
          FROM events
          WHERE timestamp >= ${from} AND timestamp < ${to} AND (event = '$pageview' OR event = 'book_click')
        )
        GROUP BY day
        ORDER BY day
      `,
      (r) => r.results as [number, number, number][],
      [] as [number, number, number][],
      errors
    ),
    safe(
      "FAQ tab usage",
      `
        SELECT count(DISTINCT properties['$session_id']) AS faq_sessions, count() AS faq_views
        FROM events
        WHERE event = 'faq_viewed' AND timestamp >= ${from} AND timestamp < ${to}
      `,
      (r) => row(r) as [number, number],
      [0, 0] as [number, number],
      errors
    ),
    safe(
      "By week of month",
      `
        SELECT
          multiIf(
            dom <= 7, 'Week 1 (1-7)',
            dom <= 14, 'Week 2 (8-14)',
            dom <= 21, 'Week 3 (15-21)',
            'Week 4+ (22-end)'
          ) AS week_of_month,
          countIf(ev = '$pageview') AS visits,
          countIf(ev = 'book_click') AS book_clicks
        FROM (
          SELECT event AS ev, toDayOfMonth(toTimeZone(timestamp, 'America/New_York')) AS dom
          FROM events
          WHERE timestamp >= ${from} AND timestamp < ${to} AND (event = '$pageview' OR event = 'book_click')
        )
        GROUP BY week_of_month
      `,
      (r) => r.results as [string, number, number][],
      [] as [string, number, number][],
      errors
    ),
  ]);

  const [sessions, bounced, explored] = sessionShape;

  const eventCounts = new Map<string, { sessions: number; total: number }>();
  for (const [event, s, t] of funnelEvents) {
    eventCounts.set(event, { sessions: s, total: t });
  }

  const [visitorCount, returningCount] = visitors;

  return {
    sessions,
    bounced,
    explored,
    chatOpenedSessions: eventCounts.get("chat_opened")?.sessions ?? 0,
    chatMessageSentSessions: eventCounts.get("chat_message_sent")?.sessions ?? 0,
    bookClickSessions: eventCounts.get("book_click")?.sessions ?? 0,
    bookClickEvents: eventCounts.get("book_click")?.total ?? 0,
    applyClickSessions: eventCounts.get("apply_click")?.sessions ?? 0,
    byHouse: byHouse.filter(([house]) => !!house).map(([house, clicks]) => ({ house, clicks })),
    byDevice: byDevice.map(([device, s, book, chat]) => ({
      device: device ?? "Unknown",
      sessions: s,
      bookClicks: book,
      chatOpened: chat,
    })),
    byReferrer: byReferrer.map(([referrer, s, book]) => ({ referrer, sessions: s, bookClicks: book })),
    uniqueVisitors: visitorCount,
    returningVisitors: returningCount,
    bookClicksBySource: bookSource.map(([source, clicks]) => ({ source, clicks })),
    avgSecondsToBook,
    byRoom: byRoom.filter(([house]) => !!house).map(([house, room, clicks]) => ({ house, room, clicks })),
    chatStyle: chatStyle.map(([style, s, book]) => ({ style, sessions: s, bookClicks: book })),
    chatDepth: chatDepth.map(([depth, s, book]) => ({ depth, sessions: s, bookClicks: book })),
    visitsBeforeBooking: visitsBeforeBooking.map(([bucket, v]) => ({ bucket, visitors: v })),
    byHour: byHour.map(([hour, visits, bookClicks]) => ({ hour, visits, bookClicks })),
    byDayOfWeek: byDayOfWeek.map(([day, visits, bookClicks]) => ({ day, visits, bookClicks })),
    byWeekOfMonth: byWeekOfMonth.map(([week, visits, bookClicks]) => ({ week, visits, bookClicks })),
    faqSessions: faqUsage[0],
    faqViews: faqUsage[1],
    errors,
  };
}
