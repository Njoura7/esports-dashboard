import { getPrisma } from "@/lib/db/prisma";
import { riot } from "./client";
import {
  LAST_N_MATCHES,
  MODES,
  PLATFORM_TO_REGION,
  RANKED_FLEX_QUEUE_TYPE,
  RANKED_SOLO_QUEUE_TYPE,
  type Platform,
  type RegionalRoute,
} from "./constants";
import { RiotNotFoundError } from "./types";
import type {
  RiotAccountDTO,
  RiotLeagueEntryDTO,
  RiotMatchDTO,
  RiotSummonerDTO,
} from "./types";
import { logger } from "@/lib/logger";

const ACCOUNT_CACHE_TTL_MS = 10 * 60 * 1000; // profile/rank go stale fast, refresh every 10min

export interface MatchSummary {
  matchId: string;
  championName: string;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  visionScore: number;
  goldEarned: number;
  damageDealt: number;
  /** 1 = most damage in the game, 10 = least. Lets the roast engine call out "worst in lobby". */
  damageRank: number;
  gameDurationSeconds: number;
  gameCreation: number;
  role: string;
}

export interface RankInfo {
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
}

export interface PlayerBundle {
  gameName: string;
  tagLine: string;
  platform: Platform;
  profileIconId: number;
  summonerLevel: number;
  ranks: {
    solo: RankInfo | null;
    flex: RankInfo | null;
  };
  modes: Record<string, MatchSummary[]>;
}

export class PlayerNotFoundError extends Error {
  constructor() {
    super("No account found for that Riot ID on this region.");
    this.name = "PlayerNotFoundError";
  }
}

export async function getPlayerBundle(
  gameName: string,
  tagLine: string,
  platform: Platform,
): Promise<PlayerBundle> {
  const region = PLATFORM_TO_REGION[platform];
  const prisma = getPrisma();

  const cached = await prisma.account.findUnique({
    where: { riotIdPerPlatform: { gameName, tagLine, platform } },
  });

  const isFresh =
    cached && Date.now() - cached.fetchedAt.getTime() < ACCOUNT_CACHE_TTL_MS;

  logger.info(isFresh ? "account cache hit" : "account cache miss/stale", {
    gameName,
    tagLine,
    platform,
  });

  const account = isFresh ? cached : await refreshAccount(gameName, tagLine, platform, region);

  const modes = await getModeMatches(account.puuid, region);

  return {
    gameName: account.gameName,
    tagLine: account.tagLine,
    platform,
    profileIconId: account.profileIconId,
    summonerLevel: account.summonerLevel,
    ranks: {
      solo: account.soloTier
        ? {
            tier: account.soloTier,
            rank: account.soloRank ?? "",
            leaguePoints: account.soloLeaguePoints ?? 0,
            wins: account.soloWins ?? 0,
            losses: account.soloLosses ?? 0,
          }
        : null,
      flex: account.flexTier
        ? {
            tier: account.flexTier,
            rank: account.flexRank ?? "",
            leaguePoints: account.flexLeaguePoints ?? 0,
            wins: account.flexWins ?? 0,
            losses: account.flexLosses ?? 0,
          }
        : null,
    },
    modes,
  };
}

async function refreshAccount(
  gameName: string,
  tagLine: string,
  platform: Platform,
  region: RegionalRoute,
) {
  let accountDto: RiotAccountDTO;
  try {
    accountDto = await riot.regional<RiotAccountDTO>(
      region,
      `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
    );
  } catch (err) {
    if (err instanceof RiotNotFoundError) throw new PlayerNotFoundError();
    throw err;
  }

  let summonerDto: RiotSummonerDTO;
  try {
    summonerDto = await riot.platform<RiotSummonerDTO>(
      platform,
      `/lol/summoner/v4/summoners/by-puuid/${accountDto.puuid}`,
    );
  } catch (err) {
    // account-v1 is region-wide (a Riot ID resolves regardless of platform), but summoner-v4
    // is platform-scoped — a 404 here means the account is real but plays on a different
    // platform than the one selected, e.g. searching a EUW player under North America.
    if (err instanceof RiotNotFoundError) throw new PlayerNotFoundError();
    throw err;
  }

  const leagueEntries = await riot.platform<RiotLeagueEntryDTO[]>(
    platform,
    `/lol/league/v4/entries/by-puuid/${accountDto.puuid}`,
  );
  const solo = leagueEntries.find((e) => e.queueType === RANKED_SOLO_QUEUE_TYPE);
  const flex = leagueEntries.find((e) => e.queueType === RANKED_FLEX_QUEUE_TYPE);

  return getPrisma().account.upsert({
    where: {
      riotIdPerPlatform: {
        gameName: accountDto.gameName,
        tagLine: accountDto.tagLine,
        platform,
      },
    },
    create: {
      puuid: accountDto.puuid,
      gameName: accountDto.gameName,
      tagLine: accountDto.tagLine,
      platform,
      profileIconId: summonerDto.profileIconId,
      summonerLevel: summonerDto.summonerLevel,
      soloTier: solo?.tier,
      soloRank: solo?.rank,
      soloLeaguePoints: solo?.leaguePoints,
      soloWins: solo?.wins,
      soloLosses: solo?.losses,
      flexTier: flex?.tier,
      flexRank: flex?.rank,
      flexLeaguePoints: flex?.leaguePoints,
      flexWins: flex?.wins,
      flexLosses: flex?.losses,
    },
    update: {
      profileIconId: summonerDto.profileIconId,
      summonerLevel: summonerDto.summonerLevel,
      soloTier: solo?.tier,
      soloRank: solo?.rank,
      soloLeaguePoints: solo?.leaguePoints,
      soloWins: solo?.wins,
      soloLosses: solo?.losses,
      flexTier: flex?.tier,
      flexRank: flex?.rank,
      flexLeaguePoints: flex?.leaguePoints,
      flexWins: flex?.wins,
      flexLosses: flex?.losses,
    },
  });
}

function toSummary(match: RiotMatchDTO, puuid: string): MatchSummary {
  const p = match.info.participants.find((p) => p.puuid === puuid)!;
  const damageRank =
    1 +
    match.info.participants.filter(
      (other) => other.totalDamageDealtToChampions > p.totalDamageDealtToChampions,
    ).length;

  return {
    matchId: match.metadata.matchId,
    championName: p.championName,
    win: p.win,
    kills: p.kills,
    deaths: p.deaths,
    assists: p.assists,
    cs: p.totalMinionsKilled + p.neutralMinionsKilled,
    visionScore: p.visionScore,
    goldEarned: p.goldEarned,
    damageDealt: p.totalDamageDealtToChampions,
    damageRank,
    gameDurationSeconds: match.info.gameDuration,
    gameCreation: match.info.gameCreation,
    role: p.teamPosition,
  };
}

async function getModeMatches(
  puuid: string,
  region: RegionalRoute,
): Promise<Record<string, MatchSummary[]>> {
  // One matchlist call per mode (Riot filters server-side via `queue`), run in parallel.
  const idsByMode = await Promise.all(
    MODES.map((mode) =>
      riot
        .regional<string[]>(
          region,
          `/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=${LAST_N_MATCHES}&queue=${mode.queueId}`,
        )
        .then((ids) => ({ mode: mode.key, ids })),
    ),
  );

  const allIds = [...new Set(idsByMode.flatMap((m) => m.ids))];

  const prisma = getPrisma();
  const existing = await prisma.matchRecord.findMany({ where: { matchId: { in: allIds } } });
  const existingIds = new Set(existing.map((m) => m.matchId));
  const missingIds = allIds.filter((id) => !existingIds.has(id));

  logger.info("match cache lookup", {
    puuid,
    requested: allIds.length,
    cached: existingIds.size,
    fetchingFromRiot: missingIds.length,
  });

  const fetched = await Promise.all(
    missingIds.map((id) => riot.regional<RiotMatchDTO>(region, `/lol/match/v5/matches/${id}`)),
  );

  if (fetched.length > 0) {
    await prisma.$transaction(
      fetched.map((match) =>
        prisma.matchRecord.upsert({
          where: { matchId: match.metadata.matchId },
          create: {
            matchId: match.metadata.matchId,
            region,
            gameCreation: BigInt(match.info.gameCreation),
            raw: match as unknown as object,
          },
          update: {},
        }),
      ),
    );
  }

  const byId = new Map<string, RiotMatchDTO>();
  for (const m of existing) byId.set(m.matchId, m.raw as unknown as RiotMatchDTO);
  for (const m of fetched) byId.set(m.metadata.matchId, m);

  // Only write link rows that don't already exist — re-upserting all of them on every
  // search (even full cache hits) was serializing dozens of writes per request and made
  // an already-cached repeat search slower than the original cold fetch.
  const existingLinks = await prisma.playerMatch.findMany({
    where: { puuid, matchId: { in: allIds } },
    select: { matchId: true },
  });
  const linkedIds = new Set(existingLinks.map((l) => l.matchId));
  const newLinks = [...byId.values()].filter((match) => !linkedIds.has(match.metadata.matchId));

  if (newLinks.length > 0) {
    await prisma.$transaction(
      newLinks.map((match) =>
        prisma.playerMatch.upsert({
          where: { puuid_matchId: { puuid, matchId: match.metadata.matchId } },
          create: { puuid, matchId: match.metadata.matchId, playedAt: new Date(match.info.gameCreation) },
          update: {},
        }),
      ),
    );
  }

  const result: Record<string, MatchSummary[]> = {};
  for (const { mode, ids } of idsByMode) {
    result[mode] = ids
      .map((id) => byId.get(id))
      .filter((m): m is RiotMatchDTO => Boolean(m))
      .map((match) => toSummary(match, puuid));
  }
  return result;
}
