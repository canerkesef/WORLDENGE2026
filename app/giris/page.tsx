"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function GirisPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("E-posta veya şifre hatalı. Tekrar deneyin.");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md px-4 sm:px-6 py-16">
      <h1 className="stadium-heading text-3xl mb-2">Giriş Yap</h1>
      <p className="text-pitch/60 mb-8">
        Şirket e-posta adresinle giriş yap ve tahminlerine devam et.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1.5">
            E-posta
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-pitch/15 px-4 py-2.5 bg-white focus:border-grass focus:outline-none"
            placeholder="ad.soyad@sirket.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1.5">
            Şifre
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-pitch/15 px-4 py-2.5 bg-white focus:border-grass focus:outline-none"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <p className="text-card text-sm font-medium" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-pitch text-paper font-semibold py-3 rounded-lg hover:bg-pitch/90 transition-colors disabled:opacity-50"
        >
          {loading ? "Giriş yapılıyor…" : "Giriş Yap"}
        </button>
      </form>

      <p className="text-sm text-pitch/60 mt-6 text-center">
        Hesabın yok mu?{" "}
        <Link href="/kayit" className="font-semibold text-grass hover:underline">
          Kayıt ol
        </Link>
      </p>
    </div>
  );
}
