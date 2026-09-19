import type { Platform } from "@/lib/riot/constants";
import type { RoastResult } from "@/lib/roast/engine";
import type { RankInfo } from "@/lib/riot/service";

export interface PlayerProfileResponse {
  gameName: string;
  tagLine: string;
  platform: Platform;
  summonerLevel: number;
  profileIconUrl: string;
  ranks: {
    solo: RankInfo | null;
    flex: RankInfo | null;
  };
}

export interface MatchResponse {
  matchId: string;
  championName: string;
  championIconUrl: string;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  visionScore: number;
  goldEarned: number;
  damageDealt: number;
  damageRank: number;
  gameDurationSeconds: number;
  gameCreation: number;
  role: string;
}

export interface MatchParticipantResponse {
  gameName: string;
  tagLine: string;
  championName: string;
  championIconUrl: string;
  champLevel: number;
  teamId: number;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  goldEarned: number;
  damageDealt: number;
  role: string;
  itemIconUrls: (string | null)[];
}

export interface MatchTeamResponse {
  teamId: number;
  win: boolean;
  objectives: {
    baronKills: number;
    dragonKills: number;
    towerKills: number;
    inhibitorKills: number;
  };
}

export interface MatchDetailResponse {
  matchId: string;
  gameMode: string;
  queueId: number;
  gameDurationSeconds: number;
  gameCreation: number;
  teams: MatchTeamResponse[];
  participants: MatchParticipantResponse[];
}

export interface ModeResponse {
  key: string;
  label: string;
  matches: MatchResponse[];
  roast: RoastResult | null;
}

export interface PlayerApiResponse {
  profile: PlayerProfileResponse;
  modes: ModeResponse[];
}

export type ApiErrorCode = "INVALID_INPUT" | "NOT_FOUND" | "RATE_LIMITED" | "SERVER_ERROR";

export interface ApiErrorResponse {
  error: string;
  code: ApiErrorCode;
}
