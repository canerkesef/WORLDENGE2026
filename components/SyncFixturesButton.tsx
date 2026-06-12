"use client";

import { useState } from "react";

export default function SyncFixturesButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSync() {
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/sync-fixtures", {
        method: "POST",
        headers: {
          "x-cron-secret": prompt("CRON_SECRET değerini girin:") ?? "",
        },
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage(`Hata: ${data.error}`);
      } else {
        setMessage(`${data.teams} takım, ${data.matches} maç senkronize edildi.`);
      }
    } catch {
      setMessage("Senkronizasyon başarısız oldu.");
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleSync}
        disabled={loading}
        className="bg-grass text-pitch font-semibold px-4 py-2 rounded-lg hover:bg-grass/90 transition-colors disabled:opacity-50"
      >
        {loading ? "Senkronize ediliyor…" : "Fikstürü Senkronize Et"}
      </button>
      {message && <p className="text-xs text-pitch/60">{message}</p>}
    </div>
  );
}
