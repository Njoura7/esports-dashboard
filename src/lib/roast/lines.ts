// {champion} gets swapped for the champion display name. Keep the trigger "soft" —
// this is meant to sting a little, not actually be mean.
export const LINES = {
  hype: [
    "Certified heater. {games} games, {winRate}% win rate — whatever you're doing, keep doing it.",
    "You're not losing lately. {winRate}% over your last {games} — somebody tell the enemy team.",
    "This is a genuinely good stretch. {winRate}% win rate doesn't happen by accident.",
  ],
  comfortPick: [
    "You should play more {champion}. {wins}-{losses} on it and it clearly likes you back.",
    "{champion} is doing the heavy lifting for you — {wins}-{losses}, keep feeding it games, not enemies.",
    "Whatever you're doing on {champion}, it's working. {wins}-{losses} says so.",
  ],
  feedingChampion: [
    "Yeah... maybe never play {champion} again. You kinda fed them up every time ({losses} losses, 0 wins).",
    "{champion} owes you nothing and you keep showing up. {losses} straight losses on it.",
    "Not you again on {champion}. That's {losses} losses in a row — it's not you, it's also you.",
  ],
  oneTrick: [
    "{games} of your last 10 on {champion}. At this point it's not a champion pool, it's a personality.",
    "One-trick energy: {champion} in {games} of your last 10 games. Respect the commitment.",
    "{champion} again? {games}/10 games say you've made your peace with that.",
  ],
  feedingOverall: [
    "Deaths are outpacing everything else lately. Might be worth a breather before the next queue.",
    "Rough KDA stretch across the board — happens to everyone, but maybe not back-to-back-to-back.",
    "The last {games} games have been more donation than domination. Take five.",
  ],
  sympathy: [
    "{winRate}% over {games} games — this isn't a slump, it's a losing streak with a name tag.",
    "Tough run: {wins}-{losses} lately. Maybe queue up with friends instead of solo for a bit.",
    "It's been a rough {games} games ({winRate}% win rate). No shame in touching grass first.",
  ],
  neutral: [
    "{wins}-{losses} over the last {games} games. Steady as she goes.",
    "Nothing wild here — {winRate}% win rate across {games} games, business as usual.",
    "A perfectly average {games} games. {winRate}% win rate, no headlines.",
  ],
} as const;

export type RoastCategory = keyof typeof LINES;

// Coarser grouping used by the UI to pick a color/icon for the comment card.
export const CATEGORY_TONE: Record<RoastCategory, "hype" | "tease" | "roast" | "sympathy" | "neutral"> = {
  hype: "hype",
  comfortPick: "hype",
  feedingChampion: "roast",
  oneTrick: "tease",
  feedingOverall: "roast",
  sympathy: "sympathy",
  neutral: "neutral",
};

export function pickLine(category: RoastCategory): string {
  const options = LINES[category];
  return options[Math.floor(Math.random() * options.length)];
}
