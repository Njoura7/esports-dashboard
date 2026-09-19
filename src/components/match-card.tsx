import Image from "next/image";
import type { MatchResponse } from "@/lib/api-types";

function kda(k: number, d: number, a: number) {
  return d === 0 ? "Perfect" : ((k + a) / d).toFixed(2);
}

export function MatchCard({ match }: { match: MatchResponse }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
        match.win
          ? "border-emerald-500/20 bg-emerald-500/5"
          : "border-rose-500/20 bg-rose-500/5"
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
      <span
        className={`w-14 text-center text-xs font-semibold ${
          match.win ? "text-emerald-400" : "text-rose-400"
        }`}
      >
        {match.win ? "WIN" : "LOSS"}
      </span>
    </div>
  );
}
