import assert from "node:assert/strict";
import test from "node:test";
import { resolveMarketId } from "../lib/market-env.js";
import { assertAtlProject, ATL_PROJECT_ID } from "../scripts/assert-atl-project.cjs";

function withEnv(values, fn) {
  const previous = new Map();
  for (const [key, value] of Object.entries(values)) {
    previous.set(key, process.env[key]);
    if (value == null) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    return fn();
  } finally {
    for (const [key, value] of previous) {
      if (value == null) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test("an unset market is Atlanta even on a San Antonio preview branch", () => {
  withEnv(
    {
      NEXT_PUBLIC_MARKET: null,
      VERCEL_ENV: "preview",
      VERCEL_GIT_COMMIT_REF: "cursor/san-antonio-market-68fe",
      VERCEL_PROJECT_ID: null,
      VERCEL_PROJECT_PRODUCTION_URL: null,
    },
    () => {
      assert.equal(resolveMarketId(), "atl");
    }
  );
});

test("explicit market ids still win", () => {
  withEnv({ NEXT_PUBLIC_MARKET: "sa", VERCEL_ENV: "production" }, () => {
    assert.equal(resolveMarketId(), "sa");
  });
  withEnv({ NEXT_PUBLIC_MARKET: "dfw", VERCEL_ENV: "preview" }, () => {
    assert.equal(resolveMarketId(), "dfw");
  });
});

test("the roomsforrentatl project fails the build unless the market is Atlanta", () => {
  withEnv(
    {
      NEXT_PUBLIC_MARKET: "sa",
      VERCEL_PROJECT_ID: ATL_PROJECT_ID,
      VERCEL_PROJECT_PRODUCTION_URL: null,
    },
    () => {
      assert.throws(() => assertAtlProject(resolveMarketId()), /must build Atlanta/);
    }
  );
  withEnv(
    {
      NEXT_PUBLIC_MARKET: null,
      VERCEL_PROJECT_ID: ATL_PROJECT_ID,
      VERCEL_PROJECT_PRODUCTION_URL: "www.roomsforrentatl.com",
    },
    () => {
      assert.doesNotThrow(() => assertAtlProject(resolveMarketId()));
    }
  );
  withEnv(
    {
      NEXT_PUBLIC_MARKET: "sa",
      VERCEL_PROJECT_ID: "prj_swoLqzly4ZAmEQtWN5An9g77V5Fp",
      VERCEL_PROJECT_PRODUCTION_URL: "www.roomsforrentsa.com",
    },
    () => {
      assert.equal(resolveMarketId(), "sa");
      assert.doesNotThrow(() => assertAtlProject("sa"));
    }
  );
});
