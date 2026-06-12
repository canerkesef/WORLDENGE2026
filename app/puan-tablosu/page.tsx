import { createClient } from "@/lib/supabase/server";
import type { LeaderboardRow } from "@/lib/types/database";

export default async function PuanTablosuPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data } = await supabase.rpc("get_leaderboard");
  const rows = (data ?? []) as LeaderboardRow[];

  const medal = (rank: number) => {
    if (rank === 0) return "🥇";
    if (rank === 1) return "🥈";
    if (rank === 2) return "🥉";
    return null;
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <h1 className="stadium-heading text-3xl sm:text-4xl mb-2">Puan Tablosu</h1>
      <p className="text-pitch/60 mb-8">
        Maç başına tam skor +5, doğru sonuç +2 puan. Şampiyon tahmini
        turnuva sonunda ek puan kazandırır.
      </p>

      {rows.length === 0 ? (
        <div className="bg-pitch/5 rounded-2xl p-8 text-center text-pitch/50">
          Henüz puanlanmış tahmin yok.
        </div>
      ) : (
        <div className="bg-pitch text-paper rounded-2xl overflow-hidden led-dots">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-paper/10 text-paper/50 text-xs uppercase tracking-wide">
                <th className="text-left px-4 sm:px-6 py-3 w-12">#</th>
                <th className="text-left px-2 py-3">Katılımcı</th>
                <th className="text-center px-2 py-3 hidden sm:table-cell">Tam Skor</th>
                <th className="text-right px-4 sm:px-6 py-3">Puan</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.user_id}
                  className={`border-b border-paper/5 ${
                    row.user_id === user?.id ? "bg-gold/10" : ""
                  }`}
                >
                  <td className="px-4 sm:px-6 py-3 stadium-heading text-lg">
                    {medal(i) ?? i + 1}
                  </td>
                  <td className="px-2 py-3">
                    <div className="font-medium truncate">
                      {row.avatar_emoji} {row.display_name}
                      {row.user_id === user?.id && (
                        <span className="text-gold text-xs ml-1.5">(sen)</span>
                      )}
                    </div>
                    {row.department && (
                      <div className="text-xs text-paper/40 truncate">
                        {row.department}
                      </div>
                    )}
                  </td>
                  <td className="text-center px-2 py-3 hidden sm:table-cell scoreboard-digit text-grass">
                    {row.exact_scores}
                  </td>
                  <td className="text-right px-4 sm:px-6 py-3 scoreboard-digit text-xl text-gold">
                    {row.total_points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
