"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type PredictionFormProps = {
  matchId: number;
  initialHome?: number | null;
  initialAway?: number | null;
  locked: boolean;
};

export default function PredictionForm({
  matchId,
  initialHome,
  initialAway,
  locked,
}: PredictionFormProps) {
  const supabase = createClient();
  const [home, setHome] = useState(initialHome?.toString() ?? "");
  const [away, setAway] = useState(initialAway?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (home === "" || away === "") return;
    setSaving(true);
    setError(null);
    setSaved(false);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Tahmin kaydetmek için giriş yapmalısın.");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("predictions").upsert(
      {
        user_id: user.id,
        match_id: matchId,
        predicted_home_score: Number(home),
        predicted_away_score: Number(away),
      },
      { onConflict: "user_id,match_id" }
    );

    if (error) {
      setError("Tahmin kaydedilemedi. Maç başlamış olabilir.");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  if (locked) {
    return (
      <p className="text-xs text-paper/40 text-center py-1">
        Bu maç için tahmin süresi doldu
      </p>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={0}
        max={20}
        value={home}
        onChange={(e) => setHome(e.target.value)}
        className="w-14 text-center scoreboard-digit bg-paper text-pitch rounded-md px-2 py-1.5"
        aria-label="Ev sahibi tahmin skoru"
        placeholder="0"
      />
      <span className="text-paper/30">:</span>
      <input
        type="number"
        min={0}
        max={20}
        value={away}
        onChange={(e) => setAway(e.target.value)}
        className="w-14 text-center scoreboard-digit bg-paper text-pitch rounded-md px-2 py-1.5"
        aria-label="Konuk tahmin skoru"
        placeholder="0"
      />
      <button
        onClick={handleSave}
        disabled={saving || home === "" || away === ""}
        className="flex-1 bg-gold text-pitch text-sm font-semibold rounded-md py-1.5 hover:bg-gold/90 transition-colors disabled:opacity-50"
      >
        {saving ? "Kaydediliyor…" : saved ? "Kaydedildi ✓" : "Tahmini Kaydet"}
      </button>
      {error && <p className="text-card text-xs">{error}</p>}
    </div>
  );
}
