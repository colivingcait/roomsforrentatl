# RoomsForRentATL.com

A fast, **mobile-first** booking site for Atlanta rooms for rent. Built for people
who want to move in **today or tomorrow** — least friction to booking, with
pricing and availability that **sync automatically from PadSplit**.

- **Browse** available rooms (Available-now filter is on by default)
- **Filter** by neighborhood, sorted so open + cheapest rooms surface first
- **Book** → taps straight through to that room's live PadSplit page to apply & pay
- **Live pricing** → each listing re-pulls price/availability from PadSplit on a
  schedule, so price changes show up on their own

> Separately branded from your other sites — its own logo, colors, and copy.

---

## Tech

- **Next.js 14** (App Router) + **Tailwind CSS**, deployed on **Vercel**
- Listings live in [`data/listings.json`](data/listings.json) (the source of truth
  for branding/links)
- [`lib/padsplit.ts`](lib/padsplit.ts) scrapes each room's PadSplit page for the
  current price/availability and the site shows that over the seed values
- Refresh happens two ways:
  - **On a cadence** — pages use ISR (`revalidate = 900`, every 15 min)
  - **On a schedule** — Vercel Cron hits `/api/cron/refresh` every 2 hours
    (see [`vercel.json`](vercel.json))

If a scrape ever fails, the page just shows the last-known values from
`listings.json` — it never breaks.

---

## Adding your real listings

This repo ships with 4 **placeholder** rooms so it renders immediately. To go live
with your real rooms, edit [`data/listings.json`](data/listings.json):

1. For each room, set **`padsplitUrl`** to that room's live PadSplit page URL.
   That one field drives both the automatic price sync **and** the Book button.
2. Fill in `name`, `neighborhood`, `price`, `priceUnit` (`"week"` or `"month"`),
   `bedType`, `bathroom`, `amenities`, and an `image` URL. These act as the
   fallback/display copy; the scraper overrides `price`/`availableNow` when it can.
3. Give each room a unique `slug` (used in the URL, e.g. `/room/east-point-cozy-room`).

> Send me each page's live PadSplit listing and I'll wire `padsplitUrl` for every
> room. Once your real PadSplit HTML is confirmed, I'll tune the parser in
> `lib/padsplit.ts` to read PadSplit's exact price/availability fields.

---

## Getting referral credit on bookings

Every **Book** button deep-links to the room's PadSplit page with **your referral
code appended**, so PadSplit attributes the booking to you. To turn it on, set
your code once:

- `NEXT_PUBLIC_PADSPLIT_REFERRAL=` — your referral code (in Vercel env vars or
  `.env.local`).
- It's read from your PadSplit referral link. Look at the link PadSplit gives you;
  the code is the value after `=`. For example
  `https://www.padsplit.com/?referral_code=ABC123` → code is `ABC123`, param is
  `referral_code`.
- If your link uses a different key (e.g. `?ref=ABC123`), also set
  `NEXT_PUBLIC_PADSPLIT_REFERRAL_PARAM=ref`.

The logic lives in `bookingUrl()` in [`lib/site.ts`](lib/site.ts); it won't double-
append if a listing URL already carries a referral param.

## Deploy to Vercel (free)

1. Push this repo to GitHub (already connected).
2. Go to [vercel.com/new](https://vercel.com/new), import this repo. Framework
   auto-detects as **Next.js** — no config needed.
3. In **Settings → Environment Variables**, add (see [`.env.example`](.env.example)):
   - `NEXT_PUBLIC_SITE_URL=https://roomsforrentatl.com`
   - `NEXT_PUBLIC_PHONE=` your real booking number
   - `NEXT_PUBLIC_PADSPLIT_REFERRAL=` your PadSplit referral code (so you get
     credit on every booking — see below)
   - `CRON_SECRET=` any long random string (secures the refresh endpoint)
4. **Settings → Domains** → add `roomsforrentatl.com` and follow the DNS steps.
5. Done. The cron job in `vercel.json` runs automatically on Vercel.

---

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Customize the brand

- Phone number / domain / taglines → [`lib/site.ts`](lib/site.ts)
- Colors & fonts → [`tailwind.config.ts`](tailwind.config.ts)
- Logo mark → [`components/Header.tsx`](components/Header.tsx) and
  [`app/icon.svg`](app/icon.svg)
