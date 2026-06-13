export type MatchStatus = "SCHEDULED" | "LIVE" | "FINISHED";

/**
 * Veritabanindaki durumu, mac saatine gore "anlik" goruntulenecek
 * duruma cevirir. Veritabanini degistirmez, sadece ekranda gosterimi
 * gerceğe yakin tutar (cron gunde bir kez calistigi icin).
 */
export function displayStatus(
  dbStatus: MatchStatus,
  matchDate: string | null
): MatchStatus {
  if (dbStatus === "FINISHED") return "FINISHED";
  if (dbStatus === "LIVE") return "LIVE";

  if (dbStatus === "SCHEDULED" && matchDate) {
    const start = new Date(matchDate).getTime();
    const now = Date.now();
    if (now >= start) {
      return "LIVE";
    }
  }

  return "SCHEDULED";
}
