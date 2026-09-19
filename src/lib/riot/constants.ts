export const PLATFORMS = [
  "na1",
  "br1",
  "la1",
  "la2",
  "oc1",
  "kr",
  "jp1",
  "eun1",
  "euw1",
  "tr1",
  "ru",
  "ph2",
  "sg2",
  "th2",
  "tw2",
  "vn2",
] as const;

export type Platform = (typeof PLATFORMS)[number];

export const PLATFORM_LABELS: Record<Platform, string> = {
  na1: "North America",
  br1: "Brazil",
  la1: "LAN",
  la2: "LAS",
  oc1: "Oceania",
  kr: "Korea",
  jp1: "Japan",
  eun1: "EU Nordic & East",
  euw1: "EU West",
  tr1: "Turkey",
  ru: "Russia",
  ph2: "Philippines",
  sg2: "Singapore",
  th2: "Thailand",
  tw2: "Taiwan",
  vn2: "Vietnam",
};

export type RegionalRoute = "americas" | "asia" | "europe" | "sea";

// account-v1 and match-v5 use the regional route, everything else uses the platform route.
export const PLATFORM_TO_REGION: Record<Platform, RegionalRoute> = {
  na1: "americas",
  br1: "americas",
  la1: "americas",
  la2: "americas",
  oc1: "sea",
  kr: "asia",
  jp1: "asia",
  eun1: "europe",
  euw1: "europe",
  tr1: "europe",
  ru: "europe",
  ph2: "sea",
  sg2: "sea",
  th2: "sea",
  tw2: "sea",
  vn2: "sea",
};

export const RANKED_SOLO_QUEUE_TYPE = "RANKED_SOLO_5x5";
export const RANKED_FLEX_QUEUE_TYPE = "RANKED_FLEX_SR";

export const LAST_N_MATCHES = 10;

export interface ModeDef {
  key: string;
  label: string;
  queueId: number;
  /** league-v4 queueType this mode's rank badge comes from, if any. */
  rankQueueType?: string;
}

// Riot's queue IDs — see https://static.developer.riotgames.com/docs/lol/queues.json.
// Add more here (e.g. ARURF 900) any time; everything downstream reads this list.
export const MODES: ModeDef[] = [
  { key: "solo", label: "Solo/Duo", queueId: 420, rankQueueType: RANKED_SOLO_QUEUE_TYPE },
  { key: "flex", label: "Flex", queueId: 440, rankQueueType: RANKED_FLEX_QUEUE_TYPE },
  { key: "normal", label: "Normal", queueId: 400 },
  { key: "aram", label: "ARAM", queueId: 450 },
];
