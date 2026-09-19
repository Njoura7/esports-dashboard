import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { MODES, PLATFORMS } from "@/lib/riot/constants";
import { getPlayerBundle, PlayerNotFoundError } from "@/lib/riot/service";
import { RiotApiError } from "@/lib/riot/types";
import { getLatestVersion, championSquareUrl, profileIconUrl } from "@/lib/ddragon/client";
import { buildRoast } from "@/lib/roast/engine";
import type { ApiErrorResponse, PlayerApiResponse } from "@/lib/api-types";
import { logger } from "@/lib/logger";

const querySchema = z.object({
  gameName: z.string().trim().min(1).max(32),
  tagLine: z.string().trim().min(1).max(10),
  platform: z.enum(PLATFORMS),
});

function errorResponse(body: ApiErrorResponse, status: number, headers?: HeadersInit) {
  return NextResponse.json(body, { status, headers });
}

export async function GET(req: NextRequest) {
  const raw = {
    gameName: req.nextUrl.searchParams.get("gameName"),
    tagLine: req.nextUrl.searchParams.get("tagLine")?.replace(/^#/, ""),
    platform: req.nextUrl.searchParams.get("platform"),
  };
  const parsed = querySchema.safeParse(raw);

  if (!parsed.success) {
    logger.warn("rejected search: bad input", { raw });
    return errorResponse(
      { error: "Enter a Riot ID (gameName#tagLine) and pick a region.", code: "INVALID_INPUT" },
      400,
    );
  }

  const { gameName, tagLine, platform } = parsed.data;
  const riotId = `${gameName}#${tagLine}`;
  const startedAt = Date.now();
  logger.info("search started", { riotId, platform });

  try {
    const [bundle, version] = await Promise.all([
      getPlayerBundle(gameName, tagLine, platform),
      getLatestVersion(),
    ]);

    const modes = MODES.map((mode) => {
      const matches = bundle.modes[mode.key] ?? [];
      return {
        key: mode.key,
        label: mode.label,
        matches: matches.map((m) => ({
          ...m,
          championIconUrl: championSquareUrl(version, m.championName),
        })),
        roast: buildRoast(matches),
      };
    });

    const body: PlayerApiResponse = {
      profile: {
        gameName: bundle.gameName,
        tagLine: bundle.tagLine,
        platform: bundle.platform,
        summonerLevel: bundle.summonerLevel,
        profileIconUrl: profileIconUrl(version, bundle.profileIconId),
        ranks: bundle.ranks,
      },
      modes,
    };

    logger.info("search completed", {
      riotId,
      platform,
      modeCounts: Object.fromEntries(modes.map((m) => [m.key, m.matches.length])),
      ms: Date.now() - startedAt,
    });

    return NextResponse.json(body);
  } catch (err) {
    if (err instanceof PlayerNotFoundError) {
      logger.info("search: no such account", { riotId, platform });
      return errorResponse({ error: err.message, code: "NOT_FOUND" }, 404);
    }
    if (err instanceof RiotApiError && err.status === 429) {
      logger.warn("search: rate limited by Riot", { riotId, platform, retryAfterSeconds: err.retryAfterSeconds });
      return errorResponse(
        { error: "Riot API rate limit hit, try again in a few seconds.", code: "RATE_LIMITED" },
        429,
        { "Retry-After": String(err.retryAfterSeconds ?? 5) },
      );
    }
    if (err instanceof RiotApiError) {
      logger.error("search: Riot API error", err, { riotId, platform, status: err.status });
      return errorResponse({ error: "Riot's API is having issues right now.", code: "SERVER_ERROR" }, 502);
    }
    if (isDatabaseError(err)) {
      logger.error("search: database unreachable", err, { riotId, platform });
      return errorResponse(
        { error: "Can't reach the database. Check DATABASE_URL in .env.", code: "SERVER_ERROR" },
        503,
      );
    }
    logger.error("search: unexpected failure", err, { riotId, platform });
    return errorResponse({ error: "Something went wrong fetching that player.", code: "SERVER_ERROR" }, 502);
  }
}

function isDatabaseError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  // The Neon driver throws raw WebSocket ErrorEvents on connection failure, which aren't
  // Error instances and stringify to "[object ErrorEvent]" — check the constructor name too.
  const ctorName = (err as { constructor?: { name?: string } }).constructor?.name ?? "";
  if (/ErrorEvent|WebSocket/i.test(ctorName)) return true;
  const text = err instanceof Error ? `${err.name} ${err.message}` : JSON.stringify(err);
  return /prisma|postgres|neon|connect|websocket|ECONNREFUSED|ENOTFOUND/i.test(text);
}
