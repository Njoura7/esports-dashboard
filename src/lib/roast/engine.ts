import type { MatchSummary } from "@/lib/riot/service";
import { CATEGORY_TONE, pickLine, type RoastCategory } from "./lines";

export interface RoastResult {
  text: string;
  category: RoastCategory;
  tone: (typeof CATEGORY_TONE)[RoastCategory];
}

interface ChampionAgg {
  championName: string;
  games: number;
  wins: number;
  losses: number;
}

const round = (n: number) => Math.round(n);
const fmtPct = (n: number) => Math.round(n * 100);
const avg = (nums: number[]) => (nums.length ? round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0);

/** Matches are assumed most-recent-first (Riot's own ordering). Counts the streak at index 0. */
function currentStreak(matches: MatchSummary[]): { length: number; win: boolean } | null {
  if (matches.length === 0) return null;
  const win = matches[0].win;
  let length = 0;
  for (const m of matches) {
    if (m.win !== win) break;
    length++;
  }
  return { length, win };
}

export function buildRoast(matches: MatchSummary[]): RoastResult | null {
  if (matches.length === 0) {
    return {
      category: "noGames",
      tone: CATEGORY_TONE.noGames,
      text: pickLine("noGames"),
    };
  }

  const games = matches.length;
  const wins = matches.filter((m) => m.win).length;
  const losses = games - wins;
  const winRate = wins / games;
  const avgDamage = avg(matches.map((m) => m.damageDealt));
  const avgGold = avg(matches.map((m) => m.goldEarned));

  const byChampion = new Map<string, ChampionAgg>();
  for (const m of matches) {
    const agg = byChampion.get(m.championName) ?? {
      championName: m.championName,
      games: 0,
      wins: 0,
      losses: 0,
    };
    agg.games++;
    if (m.win) agg.wins++;
    else agg.losses++;
    byChampion.set(m.championName, agg);
  }
  const champions = [...byChampion.values()].sort((a, b) => b.games - a.games);
  const mostPlayed = champions[0];

  const vars = (extra: Record<string, string | number> = {}) => ({
    games,
    wins,
    losses,
    winRate: fmtPct(winRate),
    avgDamage,
    avgGold,
    ...extra,
  });

  const fill = (template: string, values: Record<string, string | number>) =>
    template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ""));

  const emit = (category: RoastCategory, values: Record<string, string | number>): RoastResult => ({
    category,
    tone: CATEGORY_TONE[category],
    text: fill(pickLine(category), values),
  });

  // Priority order matters: streaks and specific callouts beat generic aggregate takes.
  const streak = currentStreak(matches);
  if (streak && streak.length >= 4 && !streak.win) {
    return emit("lossStreak", vars({ streak: streak.length, avgDamage: avg(matches.slice(0, streak.length).map((m) => m.damageDealt)) }));
  }
  if (streak && streak.length >= 4 && streak.win) {
    return emit("winStreak", vars({ streak: streak.length, avgDamage: avg(matches.slice(0, streak.length).map((m) => m.damageDealt)) }));
  }

  const perfectlyFedChampion = champions.find((c) => c.games >= 3 && c.wins === 0);
  if (perfectlyFedChampion) {
    const champGames = matches.filter((m) => m.championName === perfectlyFedChampion.championName);
    return emit(
      "feedingChampion",
      vars({
        champion: perfectlyFedChampion.championName,
        losses: perfectlyFedChampion.losses,
        avgDamage: avg(champGames.map((m) => m.damageDealt)),
      }),
    );
  }

  const recentFive = matches.slice(0, 5);
  const lowDamageCount = recentFive.filter((m) => m.damageRank >= 9).length;
  if (recentFive.length >= 4 && lowDamageCount >= 3) {
    return emit(
      "damageAfk",
      vars({
        count: lowDamageCount,
        avgDamage: avg(recentFive.map((m) => m.damageDealt)),
        avgGold: avg(recentFive.map((m) => m.goldEarned)),
      }),
    );
  }

  const comfortPick = champions.find((c) => c.games >= 3 && c.wins / c.games >= 0.7);
  if (comfortPick) {
    const champGames = matches.filter((m) => m.championName === comfortPick.championName);
    return emit(
      "comfortPick",
      vars({
        champion: comfortPick.championName,
        wins: comfortPick.wins,
        losses: comfortPick.losses,
        avgDamage: avg(champGames.map((m) => m.damageDealt)),
        avgGold: avg(champGames.map((m) => m.goldEarned)),
      }),
    );
  }

  if (mostPlayed.games >= Math.min(7, games)) {
    return emit("oneTrick", vars({ champion: mostPlayed.championName, count: mostPlayed.games }));
  }

  const totalDeaths = matches.reduce((sum, m) => sum + m.deaths, 0);
  const totalKillsAssists = matches.reduce((sum, m) => sum + m.kills + m.assists, 0);
  if (games >= 4 && totalDeaths > totalKillsAssists) {
    return emit("feedingOverall", vars());
  }

  if (games >= 5 && winRate <= 0.3) {
    return emit("sympathy", vars());
  }

  return emit("neutral", vars());
}
