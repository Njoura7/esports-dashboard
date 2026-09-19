"use client";

import {
  Bar,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MatchResponse } from "@/lib/api-types";

interface ChartPoint {
  label: string;
  champion: string;
  damage: number;
  gold: number;
  win: boolean;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: ChartPoint }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900/90 px-3 py-2 text-xs shadow-xl backdrop-blur-xl">
      <p className="font-medium text-zinc-100">{p.champion}</p>
      <p className={p.win ? "text-emerald-400" : "text-rose-400"}>{p.win ? "Win" : "Loss"}</p>
      <p className="text-zinc-400">{p.damage.toLocaleString()} damage</p>
      <p className="text-amber-400/80">{p.gold.toLocaleString()} gold</p>
    </div>
  );
}

export function ModeStatsChart({ matches }: { matches: MatchResponse[] }) {
  if (matches.length === 0) return null;

  // Matches arrive most-recent-first; charts read left(old) -> right(new).
  const data: ChartPoint[] = [...matches].reverse().map((m, i) => ({
    label: `G${i + 1}`,
    champion: m.championName,
    damage: m.damageDealt,
    gold: m.goldEarned,
    win: m.win,
  }));

  return (
    <div className="h-44 w-full rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#71717a", fontSize: 11 }}
          />
          <YAxis yAxisId="damage" hide domain={[0, (max: number) => max * 1.15]} />
          <YAxis yAxisId="gold" hide domain={[0, (max: number) => max * 1.6]} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
          <Bar yAxisId="damage" dataKey="damage" radius={[6, 6, 0, 0]} maxBarSize={28}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.win ? "#34d399" : "#fb7185"} fillOpacity={0.55} />
            ))}
          </Bar>
          <Line
            yAxisId="gold"
            type="monotone"
            dataKey="gold"
            stroke="#fbbf24"
            strokeWidth={2}
            dot={{ r: 3, fill: "#fbbf24", strokeWidth: 0 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
