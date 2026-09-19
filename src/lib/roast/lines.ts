// {placeholder} gets swapped for a computed value. Keep the trigger "soft" —
// this is meant to sting a little, not actually be mean.
export const LINES = {
  lossStreak: [
    "{streak} losses in a row. At this point the enemy team is sending thank-you cards.",
    "{streak}-game losing streak. That's not variance, that's a pattern.",
    "{streak} straight losses, averaging {avgDamage} damage. Might be time to touch grass before queuing again.",
  ],
  winStreak: [
    "{streak} wins in a row, {avgDamage} average damage. Somebody's having a moment.",
    "{streak}-game win streak. The enemy team fears you now, as they should.",
    "{streak} straight wins. Ride it until Riot notices and nerfs you personally.",
  ],
  feedingChampion: [
    "Yeah... maybe never play {champion} again. {losses} losses, 0 wins, and {avgDamage} average damage to show for it.",
    "{champion} owes you nothing and you keep showing up. {losses} straight losses on it.",
    "Not you again on {champion}. That's {losses} losses in a row — it's not you, it's also you.",
  ],
  damageAfk: [
    "Bottom of the damage chart in {count} of your last {games} games. The minions filed a formal complaint.",
    "Averaging {avgDamage} damage while everyone else plays the actual game. Were you scouting?",
    "{count} games this stretch where you did the least damage in the lobby. Gold was earned ({avgGold} avg), spent on... vibes, apparently.",
  ],
  comfortPick: [
    "You should play more {champion}. {wins}-{losses} on it, {avgDamage} avg damage — it clearly likes you back.",
    "{champion} is doing the heavy lifting for you — {wins}-{losses}, keep feeding it games, not enemies.",
    "Whatever you're doing on {champion}, it's working. {wins}-{losses}, {avgGold} average gold banked.",
  ],
  oneTrick: [
    "{count} of your last {games} on {champion}. At this point it's not a champion pool, it's a personality.",
    "One-trick energy: {champion} in {count} of your last {games} games. Respect the commitment.",
    "{champion} again? {count}/{games} games say you've made your peace with that.",
  ],
  feedingOverall: [
    "Deaths outpacing kills and assists combined this stretch. {avgDamage} avg damage doesn't cover the funeral costs.",
    "Rough KDA stretch across the board — happens to everyone, but maybe not back-to-back-to-back.",
    "The last {games} games have been more donation than domination. Take five.",
  ],
  sympathy: [
    "{winRate}% over {games} games, {avgDamage} avg damage. This isn't a slump, it's a losing streak with a name tag.",
    "{wins}-{losses} lately, {avgGold} average gold and not much to show for it. Maybe queue with friends instead of solo for a bit.",
    "{winRate}% win rate across {games} games. No shame in touching grass first, the Rift will still be there.",
  ],
  neutral: [
    "{wins}-{losses} over the last {games} games, {avgDamage} avg damage. Steady as she goes.",
    "Nothing wild here — {winRate}% win rate, {avgGold} average gold. Business as usual.",
    "A perfectly average {games} games. {winRate}% win rate, no headlines, {avgDamage} avg damage.",
  ],
  noGames: [
    "Nothing on record for this mode yet. Clean slate, or you just don't queue this one.",
  ],
} as const;

export type RoastCategory = keyof typeof LINES;

// Coarser grouping used by the UI to pick a color/icon for the comment card.
export const CATEGORY_TONE: Record<RoastCategory, "hype" | "tease" | "roast" | "sympathy" | "neutral"> = {
  lossStreak: "roast",
  winStreak: "hype",
  feedingChampion: "roast",
  damageAfk: "roast",
  comfortPick: "hype",
  oneTrick: "tease",
  feedingOverall: "roast",
  sympathy: "sympathy",
  neutral: "neutral",
  noGames: "neutral",
};

export function pickLine(category: RoastCategory): string {
  const options = LINES[category];
  return options[Math.floor(Math.random() * options.length)];
}
