import Image from "next/image";
import { PLATFORM_LABELS } from "@/lib/riot/constants";
import type { PlayerProfileResponse } from "@/lib/api-types";
import type { RankInfo } from "@/lib/riot/service";

function RankBadge({ label, rank }: { label: string; rank: RankInfo | null }) {
  return (
    <div className="text-right">
      <p className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</p>
      {rank ? (
        <>
          <p className="font-medium text-zinc-100">
            {rank.tier} {rank.rank}
          </p>
          <p className="text-xs text-zinc-400">
            {rank.leaguePoints} LP · {rank.wins}W {rank.losses}L
          </p>
        </>
      ) : (
        <p className="text-sm text-zinc-600">Unranked</p>
      )}
    </div>
  );
}

export function PlayerCard({ profile }: { profile: PlayerProfileResponse }) {
  return (
    <div className="flex items-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/40 backdrop-blur-xl">
      <Image
        src={profile.profileIconUrl}
        alt=""
        width={64}
        height={64}
        className="rounded-xl"
        unoptimized
      />
      <div className="flex-1">
        <p className="text-lg font-semibold text-zinc-50">
          {profile.gameName}
          <span className="text-zinc-500">#{profile.tagLine}</span>
        </p>
        <p className="text-sm text-zinc-400">
          Level {profile.summonerLevel} · {PLATFORM_LABELS[profile.platform]}
        </p>
      </div>
      <div className="flex gap-5">
        <RankBadge label="Solo/Duo" rank={profile.ranks.solo} />
        <RankBadge label="Flex" rank={profile.ranks.flex} />
      </div>
    </div>
  );
}
