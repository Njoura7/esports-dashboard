import { RiotApiError, RiotNotFoundError } from "./types";
import type { Platform, RegionalRoute } from "./constants";

const RIOT_API_KEY = process.env.RIOT_API_KEY;

if (!RIOT_API_KEY) {
  throw new Error(
    "RIOT_API_KEY is not set. Add it to .env.local (see .env.example).",
  );
}

const MAX_CONCURRENT = 5;
let activeRequests = 0;
const queue: Array<() => void> = [];

// Riot's dev/personal keys allow bursts (20/1s, 100/2min) but are easy to blow through
// when fetching 10 match details for a fresh player. This caps concurrency and, on a 429,
// pauses the whole queue for Retry-After seconds rather than letting every in-flight
// request retry independently.
let pausedUntil = 0;

function acquireSlot(): Promise<void> {
  return new Promise((resolve) => {
    const tryAcquire = () => {
      const wait = pausedUntil - Date.now();
      if (wait > 0) {
        setTimeout(tryAcquire, wait);
        return;
      }
      if (activeRequests < MAX_CONCURRENT) {
        activeRequests++;
        resolve();
      } else {
        queue.push(tryAcquire);
      }
    };
    tryAcquire();
  });
}

function releaseSlot() {
  activeRequests--;
  const next = queue.shift();
  if (next) next();
}

async function riotFetch<T>(host: string, path: string): Promise<T> {
  await acquireSlot();
  try {
    const res = await fetch(`https://${host}${path}`, {
      headers: { "X-Riot-Token": RIOT_API_KEY! },
      // Riot data referenced here (account/summoner/league/match) changes on every game,
      // caching is handled ourselves in Postgres — never let fetch's own cache serve stale data.
      cache: "no-store",
    });

    if (res.status === 429) {
      const retryAfter = Number(res.headers.get("Retry-After") ?? "1");
      pausedUntil = Date.now() + retryAfter * 1000;
      throw new RiotApiError("Rate limited by Riot API", 429, retryAfter);
    }
    if (res.status === 404) {
      throw new RiotNotFoundError();
    }
    if (!res.ok) {
      throw new RiotApiError(`Riot API error on ${path}`, res.status);
    }
    return (await res.json()) as T;
  } finally {
    releaseSlot();
  }
}

export function platformHost(platform: Platform) {
  return `${platform}.api.riotgames.com`;
}

export function regionHost(region: RegionalRoute) {
  return `${region}.api.riotgames.com`;
}

export const riot = {
  platform: <T>(platform: Platform, path: string) =>
    riotFetch<T>(platformHost(platform), path),
  regional: <T>(region: RegionalRoute, path: string) =>
    riotFetch<T>(regionHost(region), path),
};
