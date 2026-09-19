import Image from "next/image";
import { PLATFORM_LABELS } from "@/lib/riot/constants";
import type { PlayerProfileResponse } from "@/lib/api-types";

export function PlayerCard({ profile }: { profile: PlayerProfileResponse }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
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
      {profile.rank ? (
        <div className="text-right">
          <p className="font-medium text-zinc-100">
            {profile.rank.tier} {profile.rank.rank}
          </p>
          <p className="text-sm text-zinc-400">
            {profile.rank.leaguePoints} LP · {profile.rank.wins}W {profile.rank.losses}L
          </p>
        </div>
      ) : (
        <p className="text-sm text-zinc-500">Unranked</p>
      )}
    </div>
  );
}
