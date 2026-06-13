import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchWorldCupGames, fetchWorldCupTeams, gameToMatchRow, teamToRow } from "@/lib/worldcup26/client";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  try {
    const [wcTeams, wcGames] = await Promise.all([fetchWorldCupTeams(), fetchWorldCupGames()]);
    const supabase = createAdminClient();

    const teams = wcTeams.map(teamToRow);
    if (teams.length > 0) {
      const { error } = await supabase.from("teams").upsert(teams, { onConflict: "id" });
      if (error) throw error;
    }

    const matches = wcGames.map(gameToMatchRow);
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
      { error: err instanceof Error ? err.message : JSON.stringify(err) },
      { status: 500 }
    );
  }
}
