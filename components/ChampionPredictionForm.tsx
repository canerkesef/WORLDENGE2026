"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Team, TournamentPrediction } from "@/lib/types/database";

type Props = {
  teams: Team[];
  initial?: TournamentPrediction | null;
  locked: boolean;
};

export default function ChampionPredictionForm({ teams, initial, locked }: Props) {
  const supabase = createClient();
  const [champion, setChampion] = useState(initial?.champion_team_id ?? "");
  const [runnerUp, setRunnerUp] = useState(initial?.runner_up_team_id ?? "");
  const [thirdPlace, setThirdPlace] = useState(initial?.third_place_team_id ?? "");
  const [topScorer, setTopScorer] = useState(initial?.top_scorer_player ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Tahmin kaydetmek için giriş yapmalısın.");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("tournament_predictions").upsert(
      {
        user_id: user.id,
        champion_team_id: champion || null,
        runner_up_team_id: runnerUp || null,
        third_place_team_id: thirdPlace || null,
        top_scorer_player: topScorer || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (error) {
      setError("Kaydedilemedi. Turnuva başladıktan sonra değiştirilemez.");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  const selectClass =
    "w-full rounded-lg border border-paper/20 bg-pitch-light px-3 py-2.5 text-paper focus:border-gold focus:outline-none disabled:opacity-50";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-1.5 text-paper/70">
          🥇 Şampiyon
        </label>
        <select
          value={champion}
          onChange={(e) => setChampion(e.target.value)}
          disabled={locked}
          className={selectClass}
        >
          <option value="">Takım seç…</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5 text-paper/70">
          🥈 Finalist (2.)
        </label>
        <select
          value={runnerUp}
          onChange={(e) => setRunnerUp(e.target.value)}
          disabled={locked}
          className={selectClass}
        >
          <option value="">Takım seç…</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5 text-paper/70">
          🥉 3. takım
        </label>
        <select
          value={thirdPlace}
          onChange={(e) => setThirdPlace(e.target.value)}
          disabled={locked}
          className={selectClass}
        >
          <option value="">Takım seç…</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5 text-paper/70">
          ⚽ Gol kralı (isim)
        </label>
        <input
          type="text"
          value={topScorer}
          onChange={(e) => setTopScorer(e.target.value)}
          disabled={locked}
          placeholder="Oyuncu adı"
          className={selectClass}
        />
      </div>

      <div className="sm:col-span-2">
        {locked ? (
          <p className="text-paper/40 text-sm text-center py-2">
            Turnuva başladığı için şampiyon tahmini kilitlendi
          </p>
        ) : (
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-gold text-pitch font-semibold py-2.5 rounded-lg hover:bg-gold/90 transition-colors disabled:opacity-50"
          >
            {saving ? "Kaydediliyor…" : saved ? "Kaydedildi ✓" : "Tahmini Kaydet"}
          </button>
        )}
        {error && <p className="text-card text-sm mt-2">{error}</p>}
      </div>
    </div>
  );
}
