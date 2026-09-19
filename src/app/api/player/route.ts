import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PLATFORMS } from "@/lib/riot/constants";
import { getPlayerBundle, PlayerNotFoundError } from "@/lib/riot/service";
import { RiotApiError } from "@/lib/riot/types";
import { getLatestVersion, championSquareUrl, profileIconUrl } from "@/lib/ddragon/client";
import { buildRoast } from "@/lib/roast/engine";
import type { PlayerApiResponse } from "@/lib/api-types";

const querySchema = z.object({
  gameName: z.string().trim().min(1).max(32),
  tagLine: z.string().trim().min(1).max(10),
  platform: z.enum(PLATFORMS),
});

export async function GET(req: NextRequest) {
  const parsed = querySchema.safeParse({
    gameName: req.nextUrl.searchParams.get("gameName"),
    tagLine: req.nextUrl.searchParams.get("tagLine")?.replace(/^#/, ""),
    platform: req.nextUrl.searchParams.get("platform"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a Riot ID (gameName#tagLine) and pick a region." },
      { status: 400 },
    );
  }

  const { gameName, tagLine, platform } = parsed.data;

  try {
    const [bundle, version] = await Promise.all([
      getPlayerBundle(gameName, tagLine, platform),
      getLatestVersion(),
    ]);

    const roast = buildRoast(bundle.matches);

    const body: PlayerApiResponse = {
      profile: {
        gameName: bundle.gameName,
        tagLine: bundle.tagLine,
        platform: bundle.platform,
        summonerLevel: bundle.summonerLevel,
        profileIconUrl: profileIconUrl(version, bundle.profileIconId),
        rank: bundle.rank,
      },
      matches: bundle.matches.map((m) => ({
        ...m,
        championIconUrl: championSquareUrl(version, m.championName),
      })),
      roast,
    };

    return NextResponse.json(body);
  } catch (err) {
    if (err instanceof PlayerNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    if (err instanceof RiotApiError && err.status === 429) {
      return NextResponse.json(
        { error: "Riot API rate limit hit, try again in a few seconds." },
        { status: 429, headers: { "Retry-After": String(err.retryAfterSeconds ?? 5) } },
      );
    }
    console.error(err);
    return NextResponse.json({ error: "Something went wrong fetching that player." }, { status: 502 });
  }
}
