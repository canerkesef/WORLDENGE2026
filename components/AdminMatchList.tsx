"use client";

import { useState } from "react";
import { updateMatchResult } from "@/app/admin/actions";
import { STAGE_LABELS, formatMatchDate, teamLabel } from "@/lib/utils/format";
import type { Match, MatchStatus } from "@/lib/types/database";

export default function AdminMatchList({ matches }: { matches: Match[] }) {
  return (
    <div className="space-y-2">
      {matches.map((m) => (
        <MatchRow key={m.id} match={m} />
      ))}
      {matches.length === 0 && (
        <div className="bg-pitch/5 rounded-2xl p-8 text-center text-pitch/50">
          Henüz fikstür yüklenmedi. Yukarıdaki &quot;Fikstürü Senkronize Et&quot;
          butonuna basın.
        </div>
      )}
    </div>
  );
}

function MatchRow({ match }: { match: Match }) {
  const [home, setHome] = useState(match.home_score?.toString() ?? "");
  const [away, setAway] = useState(match.away_score?.toString() ?? "");
  const [status, setStatus] = useState<MatchStatus>(match.status);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    await updateMatchResult(match.id, {
      home_score: home === "" ? null : Number(home),
      away_score: away === "" ? null : Number(away),
      status,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="bg-white border border-pitch/10 rounded-xl px-4 py-3 flex flex-wrap items-center gap-3">
      <div className="flex-1 min-w-[200px]">
        <p className="text-xs text-pitch/40 mb-0.5">
          {STAGE_LABELS[match.stage]}
          {match.group_name ? ` · Grup ${match.group_name}` : ""} ·{" "}
          {formatMatchDate(match.match_date)}
        </p>
        <p className="font-medium">
          {teamLabel(match.home_team?.name, match.home_placeholder)} vs{" "}
          {teamLabel(match.away_team?.name, match.away_placeholder)}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          value={home}
          onChange={(e) => setHome(e.target.value)}
          className="w-14 text-center scoreboard-digit border border-pitch/15 rounded-md py-1.5"
          aria-label="Ev sahibi skor"
        />
        <span className="text-pitch/30">:</span>
        <input
          type="number"
          min={0}
          value={away}
          onChange={(e) => setAway(e.target.value)}
          className="w-14 text-center scoreboard-digit border border-pitch/15 rounded-md py-1.5"
          aria-label="Konuk skor"
        />
      </div>

      <select
        value={status}
        onChange={(e) => setStatus(e.target.value as MatchStatus)}
        className="border border-pitch/15 rounded-md px-2 py-1.5 text-sm"
      >
        <option value="SCHEDULED">Planlandı</option>
        <option value="LIVE">Canlı</option>
        <option value="FINISHED">Bitti</option>
      </select>

      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-pitch text-paper text-sm font-semibold px-4 py-1.5 rounded-md hover:bg-pitch/90 transition-colors disabled:opacity-50"
      >
        {saving ? "Kaydediliyor…" : saved ? "Kaydedildi ✓" : "Kaydet"}
      </button>
    </div>
  );
}
