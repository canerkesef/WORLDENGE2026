import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchWorldCupFixtures, fixtureToMatchRow, extractTeams } from "@/lib/api-football/client";

/**
 * GET /api/cron-sync
 *
 * Vercel Cron tarafından saatlik çağrılır (bkz. vercel.json).
 * Vercel cron istekleri "Authorization: Bearer $CRON_SECRET" header'ı
 * ile gelir (CRON_SECRET ortam değişkenini Vercel panelinde ayarlayın).
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  try {
    const fixtures = await fetchWorldCupFixtures();
    const supabase = createAdminClient();

    const teams = extractTeams(fixtures);
    if (teams.length > 0) {
      const { error } = await supabase.from("teams").upsert(teams, { onConflict: "id" });
      if (error) throw error;
    }

    const matches = fixtures.map(fixtureToMatchRow);
    if (matches.length > 0) {
      const { error } = await supabase.from("matches").upsert(matches, { onConflict: "id" });
      if (error) throw error;
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
