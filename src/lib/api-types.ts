import type { Platform } from "@/lib/riot/constants";
import type { RoastResult } from "@/lib/roast/engine";

export interface PlayerProfileResponse {
  gameName: string;
  tagLine: string;
  platform: Platform;
  summonerLevel: number;
  profileIconUrl: string;
  rank: {
    tier: string;
    rank: string;
    leaguePoints: number;
    wins: number;
    losses: number;
  } | null;
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
  gameDurationSeconds: number;
  gameCreation: number;
  role: string;
}

export interface PlayerApiResponse {
  profile: PlayerProfileResponse;
  matches: MatchResponse[];
  roast: RoastResult | null;
}

export interface ApiErrorResponse {
  error: string;
}
