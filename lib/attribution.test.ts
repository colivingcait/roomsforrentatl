import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { analyticsMarket, entryVariantFromCookie, linkContext, referralRewriteScript } from "./attribution";

function fireRewrite(cookie: string, href: string): string {
  const listeners: Record<string, Array<(event: { target: { closest: () => { href: string } } }) => void>> = {};
  const anchor = { href };
  const document = {
    cookie,
    addEventListener(type: string, fn: (event: { target: { closest: () => { href: string } } }) => void) {
      (listeners[type] ||= []).push(fn);
    },
  };
  vm.runInNewContext(referralRewriteScript(), { document, URL, decodeURIComponent });
  for (const fn of listeners.pointerdown) {
    fn({ target: { closest: () => anchor } });
  }
  return anchor.href;
}

test("analytics market is atl unless this build is dallas-fort worth", () => {
  const previousMarket = process.env.NEXT_PUBLIC_MARKET;
  const previousBuild = process.env.NEXT_PUBLIC_BUILD_MARKET;
  delete process.env.NEXT_PUBLIC_MARKET;
  delete process.env.NEXT_PUBLIC_BUILD_MARKET;
  assert.equal(analyticsMarket(), "atl");
  process.env.NEXT_PUBLIC_BUILD_MARKET = "dfw";
  assert.equal(analyticsMarket(), "dfw");
  process.env.NEXT_PUBLIC_MARKET = "dfw";
  process.env.NEXT_PUBLIC_BUILD_MARKET = "atl";
  assert.equal(analyticsMarket(), "dfw");
  if (previousMarket === undefined) delete process.env.NEXT_PUBLIC_MARKET;
  else process.env.NEXT_PUBLIC_MARKET = previousMarket;
  if (previousBuild === undefined) delete process.env.NEXT_PUBLIC_BUILD_MARKET;
  else process.env.NEXT_PUBLIC_BUILD_MARKET = previousBuild;
});

test("entry variant follows the ref_override cookie", () => {
  assert.equal(entryVariantFromCookie(null), "main");
  assert.equal(entryVariantFromCookie(undefined), "main");
  assert.equal(entryVariantFromCookie(""), "main");
  assert.equal(entryVariantFromCookie("covilla"), "covilla");
  assert.equal(entryVariantFromCookie("someone-else"), "main");
});

test("padsplit room links keep the code that is actually on the url", () => {
  const href =
    "https://www.padsplit.com/room-details/35011/1?referralCode=0DC68BAB&ref_source=site#room-number-110832";
  assert.deepEqual(linkContext(href), {
    house: "35011",
    room: "1",
    referral_code: "0DC68BAB",
  });
});

test("internal room links use the visitor code and the path ids", () => {
  assert.deepEqual(linkContext("https://roomsforrentatl.com/house/8299/room/33217"), {
    house: "8299",
    room: "33217",
    referral_code: "B2C2060F",
  });
});

test("a covilla visit rewrites a server-rendered main-site link, and a normal visit keeps the main code", () => {
  const original = "https://www.padsplit.com/room-details/35011/1?referralCode=B2C2060F&ref_source=site";
  const covilla = new URL(fireRewrite("ref_override=covilla", original));
  assert.equal(covilla.searchParams.get("referralCode"), "0DC68BAB");
  assert.equal(covilla.searchParams.get("ref_source"), "site");
  const main = new URL(fireRewrite("", original));
  assert.equal(main.searchParams.get("referralCode"), "B2C2060F");
  const other = "https://example.com/apply?referralCode=B2C2060F";
  assert.equal(fireRewrite("ref_override=covilla", other), other);
});

test("the pre-hydration script maps covilla to its code and leaves the main code as the default", () => {
  const script = referralRewriteScript();
  assert.match(script, /0DC68BAB/);
  assert.match(script, /B2C2060F/);
  assert.match(script, /ref_override/);
  assert.match(script, /pointerdown/);
  assert.doesNotMatch(script, /<script/i);
});
