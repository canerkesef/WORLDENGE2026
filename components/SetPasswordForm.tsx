"use client";

import { useState } from "react";

export default function SetPasswordForm() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(`Hata: ${data.error}`);
      } else {
        setMessage("Sifre guncellendi.");
        setNewPassword("");
      }
    } catch {
      setMessage("Bir hata olustu.");
    }
    setLoading(false);
  }

  return (
    <div className="bg-pitch text-paper rounded-2xl p-5 led-dots flex flex-col gap-3 max-w-md">
      <h2 className="stadium-heading text-lg">Kullanici Sifresi Belirle</h2>
      <input
        type="email"
        placeholder="kullanici@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-lg border border-paper/20 bg-pitch-light px-3 py-2.5 text-paper focus:border-gold focus:outline-none"
      />
      <input
        type="text"
        placeholder="Yeni sifre (en az 6 karakter)"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        className="w-full rounded-lg border border-paper/20 bg-pitch-light px-3 py-2.5 text-paper focus:border-gold focus:outline-none"
      />
      <button
        onClick={handleSubmit}
        disabled={loading || !email || !newPassword}
        className="bg-gold text-pitch font-semibold py-2.5 rounded-lg hover:bg-gold/90 transition-colors disabled:opacity-50"
      >
        {loading ? "Guncelleniyor..." : "Sifreyi Guncelle"}
      </button>
      {message && <p className="text-sm text-paper/70">{message}</p>}
    </div>
  );
}
