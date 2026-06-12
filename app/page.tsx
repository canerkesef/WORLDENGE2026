import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import MatchCard from "@/components/MatchCard";
import type { Match, LeaderboardRow } from "@/lib/types/database";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: upcomingMatches } = await supabase
    .from("matches")
    .select("*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)")
    .order("match_date", { ascending: true })
    .limit(3);

  const { data: leaderboard } = await supabase.rpc("get_leaderboard");
  const topThree = ((leaderboard ?? []) as LeaderboardRow[]).slice(0, 3);

  return (
    <div>
      {/* HERO */}
      <section className="bg-pitch text-paper led-dots">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24">
          <div className="max-w-2xl">
            <p className="text-gold font-semibold text-sm tracking-widest uppercase mb-3">
              11 Haziran – 19 Temmuz 2026 · Kanada · Meksika · ABD
            </p>
            <h1 className="stadium-heading text-4xl sm:text-6xl mb-4">
              Ofis Kupası
              <br />
              <span className="text-card">2026</span>
            </h1>
            <p className="text-paper/70 text-base sm:text-lg mb-8 max-w-lg">
              48 takım, 104 maç, 1 şampiyon — ve sen tahmin et. Maç maç,
              tur tur tahminlerini gir, takım arkadaşlarınla rekabete gir,
              puan tablosunda zirveye oyna.
            </p>
            <div className="flex flex-wrap gap-3">
              {user ? (
                <Link
                  href="/tahminler"
                  className="bg-gold text-pitch font-semibold px-6 py-3 rounded-lg hover:bg-gold/90 transition-colors"
                >
                  Tahminlerimi Gir
                </Link>
              ) : (
                <Link
                  href="/kayit"
                  className="bg-gold text-pitch font-semibold px-6 py-3 rounded-lg hover:bg-gold/90 transition-colors"
                >
                  Yarışmaya Katıl
                </Link>
              )}
              <Link
                href="/puan-tablosu"
                className="border border-paper/30 text-paper font-semibold px-6 py-3 rounded-lg hover:border-paper/60 transition-colors"
              >
                Puan Tablosuna Bak
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* PUANLAMA AÇIKLAMASI */}
      <section className="bg-paper-dim border-b border-pitch/10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-3">
              <span className="scoreboard-digit text-2xl text-grass">+5</span>
              <span className="text-pitch/70">Tam skor tahmini</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="scoreboard-digit text-2xl text-gold">+2</span>
              <span className="text-pitch/70">Doğru sonuç (1 / X / 2)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="scoreboard-digit text-2xl text-pitch/40">+0</span>
              <span className="text-pitch/70">Yanlış tahmin</span>
            </div>
          </div>
        </div>
      </section>

      {/* YAKLAŞAN MAÇLAR */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="stadium-heading text-2xl sm:text-3xl">Yaklaşan Maçlar</h2>
          <Link href="/tahminler" className="text-sm font-semibold text-grass hover:underline">
            Tüm fikstür →
          </Link>
        </div>

        {upcomingMatches && upcomingMatches.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(upcomingMatches as Match[]).map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        ) : (
          <div className="bg-pitch/5 rounded-2xl p-8 text-center text-pitch/50">
            Henüz fikstür yüklenmedi. Yönetici fikstür senkronizasyonunu
            çalıştırdığında maçlar burada görünecek.
          </div>
        )}
      </section>

      {/* LİDERLİK ÖZETİ */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="stadium-heading text-2xl sm:text-3xl">Zirvedekiler</h2>
          <Link href="/puan-tablosu" className="text-sm font-semibold text-grass hover:underline">
            Tam tablo →
          </Link>
        </div>

        {topThree.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {topThree.map((row, i) => (
              <div
                key={row.user_id}
                className="bg-pitch text-paper rounded-2xl p-5 flex items-center gap-4 led-dots"
              >
                <span className="stadium-heading text-3xl text-gold">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">
                    {row.avatar_emoji} {row.display_name}
                  </p>
                  {row.department && (
                    <p className="text-xs text-paper/50 truncate">{row.department}</p>
                  )}
                </div>
                <span className="scoreboard-digit text-2xl text-grass">
                  {row.total_points}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-pitch/5 rounded-2xl p-8 text-center text-pitch/50">
            Henüz puanlanmış tahmin yok. İlk maçlar oynandığında tablo burada
            oluşacak.
          </div>
        )}
      </section>
    </div>
  );
}
