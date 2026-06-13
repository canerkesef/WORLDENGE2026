import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchWorldCupGames, fetchWorldCupTeams, gameToMatchRow, teamToRow } from "@/lib/worldcup26/client";

export async function POST(req: NextRequest) {

  try {
    const [wcTeams, wcGames] = await Promise.all([fetchWorldCupTeams(), fetchWorldCupGames()]);
    const supabase = createAdminClient();

    const teams = wcTeams.map(teamToRow);
    if (teams.length > 0) {
      const { error: teamsError } = await supabase
        .from("teams")
        .upsert(teams, { onConflict: "id" });
      if (teamsError) throw teamsError;
    }

    const matches = wcGames.map(gameToMatchRow);
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
      { error: err instanceof Error ? err.message : JSON.stringify(err) },
      { status: 500 }
    );
  }
}
