import { prisma } from "@/lib/db/prisma";
import { riot } from "./client";
import {
  LAST_N_MATCHES,
  PLATFORM_TO_REGION,
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
  gameDurationSeconds: number;
  gameCreation: number;
  role: string;
}

export interface PlayerBundle {
  gameName: string;
  tagLine: string;
  platform: Platform;
  profileIconId: number;
  summonerLevel: number;
  rank: {
    tier: string;
    rank: string;
    leaguePoints: number;
    wins: number;
    losses: number;
  } | null;
  matches: MatchSummary[];
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

  const cached = await prisma.account.findUnique({
    where: { riotIdPerPlatform: { gameName, tagLine, platform } },
  });

  const isFresh =
    cached && Date.now() - cached.fetchedAt.getTime() < ACCOUNT_CACHE_TTL_MS;

  const account = isFresh ? cached : await refreshAccount(gameName, tagLine, platform, region);

  const matches = await getLastMatches(account.puuid, region);

  return {
    gameName: account.gameName,
    tagLine: account.tagLine,
    platform,
    profileIconId: account.profileIconId,
    summonerLevel: account.summonerLevel,
    rank: account.soloTier
      ? {
          tier: account.soloTier,
          rank: account.soloRank ?? "",
          leaguePoints: account.soloLeaguePoints ?? 0,
          wins: account.soloWins ?? 0,
          losses: account.soloLosses ?? 0,
        }
      : null,
    matches,
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

  const summonerDto = await riot.platform<RiotSummonerDTO>(
    platform,
    `/lol/summoner/v4/summoners/by-puuid/${accountDto.puuid}`,
  );

  const leagueEntries = await riot.platform<RiotLeagueEntryDTO[]>(
    platform,
    `/lol/league/v4/entries/by-puuid/${accountDto.puuid}`,
  );
  const solo = leagueEntries.find((e) => e.queueType === RANKED_SOLO_QUEUE_TYPE);

  return prisma.account.upsert({
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
    },
    update: {
      profileIconId: summonerDto.profileIconId,
      summonerLevel: summonerDto.summonerLevel,
      soloTier: solo?.tier,
      soloRank: solo?.rank,
      soloLeaguePoints: solo?.leaguePoints,
      soloWins: solo?.wins,
      soloLosses: solo?.losses,
    },
  });
}

async function getLastMatches(
  puuid: string,
  region: RegionalRoute,
): Promise<MatchSummary[]> {
  const matchIds = await riot.regional<string[]>(
    region,
    `/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=${LAST_N_MATCHES}`,
  );

  const existing = await prisma.matchRecord.findMany({
    where: { matchId: { in: matchIds } },
  });
  const existingIds = new Set(existing.map((m) => m.matchId));
  const missingIds = matchIds.filter((id) => !existingIds.has(id));

  const fetched = await Promise.all(
    missingIds.map((id) =>
      riot.regional<RiotMatchDTO>(region, `/lol/match/v5/matches/${id}`),
    ),
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

  const allMatches = [...existing.map((m) => m.raw as unknown as RiotMatchDTO), ...fetched];

  const linkRows = matchIds
    .map((matchId) => allMatches.find((m) => m.metadata.matchId === matchId))
    .filter((m): m is RiotMatchDTO => Boolean(m));

  await prisma.$transaction(
    linkRows.map((match) =>
      prisma.playerMatch.upsert({
        where: { puuid_matchId: { puuid, matchId: match.metadata.matchId } },
        create: {
          puuid,
          matchId: match.metadata.matchId,
          playedAt: new Date(match.info.gameCreation),
        },
        update: {},
      }),
    ),
  );

  return matchIds
    .map((matchId) => allMatches.find((m) => m.metadata.matchId === matchId))
    .filter((m): m is RiotMatchDTO => Boolean(m))
    .map((match) => {
      const p = match.info.participants.find((p) => p.puuid === puuid)!;
      return {
        matchId: match.metadata.matchId,
        championName: p.championName,
        win: p.win,
        kills: p.kills,
        deaths: p.deaths,
        assists: p.assists,
        cs: p.totalMinionsKilled + p.neutralMinionsKilled,
        visionScore: p.visionScore,
        gameDurationSeconds: match.info.gameDuration,
        gameCreation: match.info.gameCreation,
        role: p.teamPosition,
      };
    });
}
