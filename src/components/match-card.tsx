import Image from "next/image";
import type { MatchResponse } from "@/lib/api-types";

function kda(k: number, d: number, a: number) {
  return d === 0 ? "Perfect" : ((k + a) / d).toFixed(2);
}

function formatK(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

export function MatchCard({ match, onClick }: { match: MatchResponse; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left backdrop-blur-xl transition hover:brightness-125 ${
        match.win
          ? "border-emerald-400/15 bg-emerald-500/[0.06]"
          : "border-rose-400/15 bg-rose-500/[0.06]"
      }`}
    >
      <Image
        src={match.championIconUrl}
        alt={match.championName}
        width={40}
        height={40}
        className="rounded-lg"
        unoptimized
      />
      <div className="flex-1">
        <p className="text-sm font-medium text-zinc-100">{match.championName}</p>
        <p className="text-xs text-zinc-400">{match.role || "—"}</p>
      </div>
      <div className="text-right">
        <p className="text-sm text-zinc-100">
          {match.kills}/{match.deaths}/{match.assists}
        </p>
        <p className="text-xs text-zinc-400">
          {kda(match.kills, match.deaths, match.assists)} KDA · {match.cs} CS
        </p>
      </div>
      <div className="hidden w-24 text-right sm:block">
        <p className="text-xs text-zinc-300">{formatK(match.damageDealt)} dmg</p>
        <p className="text-xs text-amber-400/70">{formatK(match.goldEarned)} gold</p>
      </div>
      <span
        className={`w-14 text-center text-xs font-semibold ${
          match.win ? "text-emerald-400" : "text-rose-400"
        }`}
      >
        {match.win ? "WIN" : "LOSS"}
      </span>
    </button>
  );
}
