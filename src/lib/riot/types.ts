// Only the fields this app actually reads. Riot's real payloads carry far more —
// we store the raw match JSON in Postgres (see MatchRecord.raw) so nothing is lost,
// these types just describe what we pull out of it.

export interface RiotAccountDTO {
  puuid: string;
  gameName: string;
  tagLine: string;
}

export interface RiotSummonerDTO {
  puuid: string;
  profileIconId: number;
  summonerLevel: number;
}

export interface RiotLeagueEntryDTO {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
}

export interface RiotMatchParticipantDTO {
  puuid: string;
  riotIdGameName?: string;
  riotIdTagline?: string;
  championName: string;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  totalMinionsKilled: number;
  neutralMinionsKilled: number;
  visionScore: number;
  teamPosition: string;
  goldEarned: number;
  totalDamageDealtToChampions: number;
}

export interface RiotMatchDTO {
  metadata: {
    matchId: string;
    participants: string[];
  };
  info: {
    gameCreation: number;
    gameDuration: number;
    gameMode: string;
    queueId: number;
    participants: RiotMatchParticipantDTO[];
  };
}

export class RiotApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "RiotApiError";
  }
}

export class RiotNotFoundError extends RiotApiError {
  constructor(message = "Not found") {
    super(message, 404);
    this.name = "RiotNotFoundError";
  }
}
