import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchWorldCupFixtures, fixtureToMatchRow, extractTeams } from "@/lib/api-football/client";

/**
 * POST /api/sync-fixtures
 *
 * API-Football'dan Dünya Kupası 2026 fikstür ve sonuçlarını çekip
 * teams ve matches tablolarına yazar. Maç sonuçlandığında (status=FINISHED)
 * veritabanı trigger'ı otomatik olarak puanları hesaplar.
 *
 * Güvenlik: CRON_SECRET header'ı ile korunur. Vercel Cron veya
 * harici bir zamanlayıcı (ör. cron-job.org) ile periyodik çağırın.
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  try {
    const fixtures = await fetchWorldCupFixtures();
    const supabase = createAdminClient();

    // 1. Takımları upsert et
    const teams = extractTeams(fixtures);
    if (teams.length > 0) {
      const { error: teamsError } = await supabase
        .from("teams")
        .upsert(teams, { onConflict: "id" });
      if (teamsError) throw teamsError;
    }

    // 2. Maçları upsert et (trigger sonuçlanan maçları otomatik puanlar)
    const matches = fixtures.map(fixtureToMatchRow);
    if (matches.length > 0) {
      const { error: matchesError } = await supabase
        .from("matches")
        .upsert(matches, { onConflict: "id" });
      if (matchesError) throw matchesError;
    }

    return NextResponse.json({
      ok: true,
      teams: teams.length,
      matches: matches.length,
      syncedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Bilinmeyen hata" },
      { status: 500 }
    );
  }
}
