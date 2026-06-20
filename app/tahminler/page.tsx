import { createClient } from "@/lib/supabase/server";
import MatchCard from "@/components/MatchCard";
import PredictionForm from "@/components/PredictionForm";
import ChampionPredictionForm from "@/components/ChampionPredictionForm";
import { STAGE_LABELS } from "@/lib/utils/format";
import type { Match, MatchStage, Prediction, Team } from "@/lib/types/database";

const STAGE_ORDER: MatchStage[] = ["GROUP", "R32", "R16", "QF", "SF", "F3", "FINAL"];

export default async function TahminlerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-16 text-center">
        <h1 className="stadium-heading text-3xl mb-3">Önce giriş yapmalısın</h1>
        <p className="text-pitch/60">
          Tahminlerini görmek ve girmek için hesabına giriş yap.
        </p>
      </div>
    );
  }

  const { data: matches } = await supabase
    .from("matches")
    .select("*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)")
    .order("match_date", { ascending: true });

  const { data: predictions } = await supabase
    .from("predictions")
    .select("*")
    .eq("user_id", user.id);

  const { data: teams } = await supabase.from("teams").select("*").order("name");

  const { data: tournamentPrediction } = await supabase
    .from("tournament_predictions")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const predictionMap = new Map<number, Prediction>(
    (predictions ?? []).map((p: Prediction) => [p.match_id, p])
  );

  const grouped = new Map<MatchStage, Match[]>();
  for (const m of (matches ?? []) as Match[]) {
    if (!grouped.has(m.stage)) grouped.set(m.stage, []);
    grouped.get(m.stage)!.push(m);
  }

  // Turnuva başladı mı? (ilk maç tarihi geçmişse)
  const firstMatch = (matches ?? [])[0] as Match | undefined;
  const tournamentLocked = !!tournamentPrediction;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <h1 className="stadium-heading text-3xl sm:text-4xl mb-2">Tahminlerim</h1>
      <p className="text-pitch/60 mb-8">
        Her maç için skor tahminini gir. Tahminler maç başlamadan kadar
        değiştirilebilir.
      </p>

      {/* Şampiyon tahmini */}
      <section className="mb-12">
        <h2 className="stadium-heading text-xl sm:text-2xl mb-4">🏆 Şampiyon Tahmini</h2>
        <div className="bg-pitch text-paper rounded-2xl p-5 led-dots">
          <ChampionPredictionForm
            teams={(teams ?? []) as Team[]}
            initial={tournamentPrediction}
            locked={tournamentLocked}
          />
        </div>
      </section>

      {/* Maçlar */}
      {(!matches || matches.length === 0) && (
        <div className="bg-pitch/5 rounded-2xl p-8 text-center text-pitch/50">
          Henüz fikstür yüklenmedi. Yönetici fikstür senkronizasyonunu
          çalıştırdığında maçlar burada görünecek.
        </div>
      )}

      {STAGE_ORDER.filter((s) => grouped.has(s)).map((stage) => (
        <section key={stage} className="mb-12">
          <h2 className="stadium-heading text-xl sm:text-2xl mb-4">
            {STAGE_LABELS[stage]}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {grouped.get(stage)!.map((m) => {
              const pred = predictionMap.get(m.id);
            const locked =
              m.status !== "SCHEDULED" ||
              new Date(m.match_date).getTime() - 15 * 60 * 1000 <= Date.now();

              return (
                <MatchCard
                  key={m.id}
                  match={m}
                  prediction={
                    pred
                      ? {
                          home: pred.predicted_home_score,
                          away: pred.predicted_away_score,
                          points: pred.points_awarded,
                        }
                      : null
                  }
                  rightSlot={
                    !pred || !locked ? (
                      <PredictionForm
                        matchId={m.id}
                        initialHome={pred?.predicted_home_score}
                        initialAway={pred?.predicted_away_score}
                        locked={locked}
                      />
                    ) : undefined
                  }
                />
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
