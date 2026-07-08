"use client";

import posthog from "posthog-js";

// The Project API Key is meant to be public — it's embedded in client-side
// JS on every page load, same as any analytics snippet. Override via env vars
// if you ever want to swap projects without a code change.
const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "phc_yJDFf8rvLfM7U9N87mYDbpVbfePRZVFc77Zg2RGdZa7t";
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

let initialized = false;

/** Call once on the client. Safe to call multiple times — only initializes once. */
export function initPosthog() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  posthog.init(KEY, {
    api_host: HOST,
    defaults: "2026-05-30",
    person_profiles: "identified_only",
  });
}

export { posthog };
