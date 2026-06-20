export type MatchStatus = "SCHEDULED" | "LIVE" | "FINISHED";

/**
 * Veritabanindaki durumu oldugu gibi dondurur.
 * Senkronizasyon GitHub Actions ile 5 dakikada bir calistigi icin
 * veritabani guncel kabul edilir, ayrica "tahmin" yapmaya gerek yok.
 */
export function displayStatus(
  dbStatus: MatchStatus,
  matchDate: string | null
): MatchStatus {
  return dbStatus;
}
