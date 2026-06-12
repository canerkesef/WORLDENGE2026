import type { Match } from "@/lib/types/database";
import { formatMatchDate, STAGE_LABELS, teamLabel } from "@/lib/utils/format";

type MatchCardProps = {
  match: Match;
  /** Kullanıcının bu maça yaptığı tahmin (varsa) */
  prediction?: { home: number; away: number; points?: number | null } | null;
  /** sağ tarafta gösterilecek özel içerik (ör. tahmin formu) */
  rightSlot?: React.ReactNode;
};

export default function MatchCard({ match, prediction, rightSlot }: MatchCardProps) {
  const isLive = match.status === "LIVE";
  const isFinished = match.status === "FINISHED";

  return (
    <div className="bg-pitch text-paper rounded-2xl overflow-hidden led-dots">
      {/* Üst şerit: tur bilgisi + tarih */}
      <div className="flex items-center justify-between px-4 py-2 bg-pitch-light/60 text-xs font-medium text-paper/60">
        <span>
          {STAGE_LABELS[match.stage]}
          {match.group_name ? ` · Grup ${match.group_name}` : ""}
        </span>
        <span className="flex items-center gap-1.5">
          {isLive && (
            <span className="live-dot inline-block w-1.5 h-1.5 rounded-full bg-card" />
          )}
          {isLive ? "CANLI" : isFinished ? "TAMAMLANDI" : formatMatchDate(match.match_date)}
        </span>
      </div>

      {/* Skor tabelası */}
      <div className="px-4 sm:px-6 py-5">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
          {/* Ev sahibi */}
          <div className="text-right">
            <div className="stadium-heading text-base sm:text-lg truncate">
              {teamLabel(match.home_team?.name, match.home_placeholder)}
            </div>
          </div>

          {/* Skor */}
          <div className="flex items-center gap-2 sm:gap-3 bg-pitch-light rounded-lg px-3 sm:px-4 py-2 border border-paper/10">
            <span className="scoreboard-digit text-2xl sm:text-3xl text-gold tabular-nums">
              {match.home_score ?? "–"}
            </span>
            <span className="text-paper/30 text-sm">:</span>
            <span className="scoreboard-digit text-2xl sm:text-3xl text-gold tabular-nums">
              {match.away_score ?? "–"}
            </span>
          </div>

          {/* Konuk */}
          <div className="text-left">
            <div className="stadium-heading text-base sm:text-lg truncate">
              {teamLabel(match.away_team?.name, match.away_placeholder)}
            </div>
          </div>
        </div>

        {match.venue && (
          <p className="text-center text-xs text-paper/40 mt-2">{match.venue}</p>
        )}
      </div>

      {/* Tahmin bilgisi veya form */}
      {(prediction || rightSlot) && (
        <div className="border-t border-paper/10 px-4 sm:px-6 py-3 bg-pitch-light/40">
          {prediction && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-paper/60">Senin tahminin</span>
              <div className="flex items-center gap-2">
                <span className="scoreboard-digit text-paper">
                  {prediction.home} - {prediction.away}
                </span>
                {typeof prediction.points === "number" && (
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      prediction.points === 5
                        ? "bg-grass text-pitch"
                        : prediction.points === 2
                        ? "bg-gold text-pitch"
                        : "bg-paper/10 text-paper/50"
                    }`}
                  >
                    {prediction.points === 5
                      ? "Tam skor! +5"
                      : prediction.points === 2
                      ? "Doğru sonuç +2"
                      : "0 puan"}
                  </span>
                )}
              </div>
            </div>
          )}
          {rightSlot}
        </div>
      )}
    </div>
  );
}
