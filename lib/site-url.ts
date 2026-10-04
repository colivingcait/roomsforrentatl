/**
 * Origin for sitemap, robots, canonical, and og:url.
 * When the configured host is the same site as `fallback` (apex or www), use `fallback`.
 * Each market passes its own fallback, so the other market's hostname is not in this file.
 */
export function canonicalSiteUrl(raw: string | undefined, fallback: string): string {
  let url: URL;
  try {
    url = new URL((raw && raw.trim()) || fallback);
  } catch {
    url = new URL(fallback);
  }
  let canonical: URL;
  try {
    canonical = new URL(fallback);
  } catch {
    return url.origin;
  }
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const canonicalHost = canonical.hostname.toLowerCase().replace(/^www\./, "");
  if (host === canonicalHost) return canonical.origin;
  return url.origin;
}
