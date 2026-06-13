"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SyncFixturesButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSync() {
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/sync-fixtures", {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage(`Hata: ${data.error}`);
      } else {
        setMessage(`${data.teams} takım, ${data.matches} maç senkronize edildi.`);
        router.refresh();
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
