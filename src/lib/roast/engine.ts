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

function fmtPct(n: number) {
  return Math.round(n * 100);
}

export function buildRoast(matches: MatchSummary[]): RoastResult | null {
  if (matches.length === 0) return null;

  const games = matches.length;
  const wins = matches.filter((m) => m.win).length;
  const losses = games - wins;
  const winRate = wins / games;

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
    ...extra,
  });

  const fill = (template: string, values: Record<string, string | number>) =>
    template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ""));

  const emit = (category: RoastCategory, values: Record<string, string | number>): RoastResult => ({
    category,
    tone: CATEGORY_TONE[category],
    text: fill(pickLine(category), values),
  });

  // Priority order matters: most specific / most fun callouts win over generic ones.
  const perfectlyFedChampion = champions.find((c) => c.games >= 3 && c.wins === 0);
  if (perfectlyFedChampion) {
    return emit(
      "feedingChampion",
      vars({ champion: perfectlyFedChampion.championName, losses: perfectlyFedChampion.losses }),
    );
  }

  const comfortPick = champions.find((c) => c.games >= 3 && c.wins / c.games >= 0.7);
  if (comfortPick) {
    return emit(
      "comfortPick",
      vars({ champion: comfortPick.championName, wins: comfortPick.wins, losses: comfortPick.losses }),
    );
  }

  if (games >= 5 && winRate >= 0.7) {
    return emit("hype", vars());
  }

  if (mostPlayed.games >= Math.min(7, games)) {
    return emit("oneTrick", vars({ champion: mostPlayed.championName }));
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
