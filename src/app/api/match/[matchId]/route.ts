import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db/prisma";
import { getLatestVersion, championSquareUrl, itemIconUrl } from "@/lib/ddragon/client";
import type { RiotMatchDTO } from "@/lib/riot/types";
import type { ApiErrorResponse, MatchDetailResponse } from "@/lib/api-types";
import { logger } from "@/lib/logger";

// Match detail is read-only from our own cache — the match was already fetched from Riot
// (and stored forever, since match data is immutable) the first time it showed up in
// someone's last-10 list. No Riot call happens here at all.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> },
) {
  const { matchId } = await params;

  const record = await getPrisma().matchRecord.findUnique({ where: { matchId } });
  if (!record) {
    const body: ApiErrorResponse = { error: "That match isn't cached yet.", code: "NOT_FOUND" };
    return NextResponse.json(body, { status: 404 });
  }

  const match = record.raw as unknown as RiotMatchDTO;
  const version = await getLatestVersion();

  logger.info("match detail requested", { matchId });

  const body: MatchDetailResponse = {
    matchId: match.metadata.matchId,
    gameMode: match.info.gameMode,
    queueId: match.info.queueId,
    gameDurationSeconds: match.info.gameDuration,
    gameCreation: match.info.gameCreation,
    teams: match.info.teams.map((team) => ({
      teamId: team.teamId,
      win: team.win,
      objectives: {
        baronKills: team.objectives.baron.kills,
        dragonKills: team.objectives.dragon.kills,
        towerKills: team.objectives.tower.kills,
        inhibitorKills: team.objectives.inhibitor.kills,
      },
    })),
    participants: match.info.participants.map((p) => ({
      gameName: p.riotIdGameName || "Unknown",
      tagLine: p.riotIdTagline || "",
      championName: p.championName,
      championIconUrl: championSquareUrl(version, p.championName),
      champLevel: p.champLevel,
      teamId: p.teamId,
      win: p.win,
      kills: p.kills,
      deaths: p.deaths,
      assists: p.assists,
      cs: p.totalMinionsKilled + p.neutralMinionsKilled,
      goldEarned: p.goldEarned,
      damageDealt: p.totalDamageDealtToChampions,
      role: p.teamPosition,
      itemIconUrls: [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5, p.item6].map((id) =>
        id > 0 ? itemIconUrl(version, id) : null,
      ),
    })),
  };

  return NextResponse.json(body);
}
