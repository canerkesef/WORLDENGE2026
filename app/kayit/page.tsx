"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function KayitPage() {
  const supabase = createClient();
  const [displayName, setDisplayName] = useState("");
  const [department, setDepartment] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName, department },
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes("already registered")) {
        setError("Bu e-posta adresi zaten kayıtlı. Giriş yapmayı deneyin.");
      } else if (error.message.toLowerCase().includes("password")) {
        setError("Şifre en az 6 karakter olmalıdır.");
      } else {
        setError("Kayıt sırasında bir sorun oluştu. Tekrar deneyin.");
      }
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="mx-auto max-w-md px-4 sm:px-6 py-16 text-center">
        <div className="text-5xl mb-4">📬</div>
        <h1 className="stadium-heading text-2xl mb-2">E-postanı kontrol et</h1>
        <p className="text-pitch/60">
          Hesabını onaylamak için <strong>{email}</strong> adresine gönderdiğimiz
          bağlantıya tıkla. Onayladıktan sonra giriş yapabilirsin.
        </p>
        <Link
          href="/giris"
          className="inline-block mt-6 font-semibold text-grass hover:underline"
        >
          Giriş sayfasına dön
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 sm:px-6 py-16">
      <h1 className="stadium-heading text-3xl mb-2">Yarışmaya Katıl</h1>
      <p className="text-pitch/60 mb-8">
        Bilgilerini gir, hesabını oluştur ve tahminlerine başla.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium mb-1.5">
            Ad Soyad
          </label>
          <input
            id="displayName"
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-lg border border-pitch/15 px-4 py-2.5 bg-white focus:border-grass focus:outline-none"
            placeholder="Ayşe Yılmaz"
          />
        </div>

        <div>
          <label htmlFor="department" className="block text-sm font-medium mb-1.5">
            Departman <span className="text-pitch/40">(opsiyonel)</span>
          </label>
          <input
            id="department"
            type="text"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full rounded-lg border border-pitch/15 px-4 py-2.5 bg-white focus:border-grass focus:outline-none"
            placeholder="Pazarlama"
          />
        </div>

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
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-pitch/15 px-4 py-2.5 bg-white focus:border-grass focus:outline-none"
            placeholder="En az 6 karakter"
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
          className="w-full bg-grass text-pitch font-semibold py-3 rounded-lg hover:bg-grass/90 transition-colors disabled:opacity-50"
        >
          {loading ? "Kayıt oluşturuluyor…" : "Kayıt Ol"}
        </button>
      </form>

      <p className="text-sm text-pitch/60 mt-6 text-center">
        Zaten hesabın var mı?{" "}
        <Link href="/giris" className="font-semibold text-grass hover:underline">
          Giriş yap
        </Link>
      </p>
    </div>
  );
}
