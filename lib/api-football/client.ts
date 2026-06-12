/**
 * API-Football (api-sports.io) ile entegrasyon
 * Dünya Kupası 2026: league=1, season=2026
 *
 * .env.local dosyasına API_FOOTBALL_KEY ekleyin:
 *   https://dashboard.api-football.com/ adresinden ücretsiz hesap oluşturup
 *   API anahtarınızı alabilirsiniz (ücretsiz plan günlük 100 istek sunar).
 */

const API_BASE = "https://v3.football.api-sports.io";
const WC_LEAGUE_ID = 1;
const WC_SEASON = 2026;

type ApiFixture = {
  fixture: {
    id: number;
    date: string;
    venue: { name: string | null; city: string | null };
    status: { short: string };
  };
  league: {
    round: string; // ör: "Group Stage - 1", "Round of 32", "Quarter-finals", ...
  };
  teams: {
    home: { id: number; name: string; logo: string };
    away: { id: number; name: string; logo: string };
  };
  goals: { home: number | null; away: number | null };
  score: {
    extratime: { home: number | null; away: number | null };
    penalty: { home: number | null; away: number | null };
  };
};

function mapStatus(short: string): "SCHEDULED" | "LIVE" | "FINISHED" {
  if (["FT", "AET", "PEN", "PST", "CANC", "AWD", "WO"].includes(short)) {
    if (short === "PST" || short === "CANC") return "SCHEDULED";
    return "FINISHED";
  }
  if (["1H", "2H", "HT", "ET", "BT", "P", "LIVE"].includes(short)) {
    return "LIVE";
  }
  return "SCHEDULED";
}

function mapStage(round: string): { stage: string; groupName: string | null } {
  const r = round.toLowerCase();
  if (r.includes("group")) {
    // "Group Stage - A" gibi formatlar veya "Group Stage - 1"
    const match = round.match(/Group\s+([A-L])/i);
    return { stage: "GROUP", groupName: match ? match[1].toUpperCase() : null };
  }
  if (r.includes("round of 32")) return { stage: "R32", groupName: null };
  if (r.includes("round of 16")) return { stage: "R16", groupName: null };
  if (r.includes("quarter")) return { stage: "QF", groupName: null };
  if (r.includes("semi")) return { stage: "SF", groupName: null };
  if (r.includes("third") || r.includes("3rd")) return { stage: "F3", groupName: null };
  if (r.includes("final")) return { stage: "FINAL", groupName: null };
  return { stage: "GROUP", groupName: null };
}

/** API-Football'dan tüm Dünya Kupası 2026 fikstürünü çeker. */
export async function fetchWorldCupFixtures(): Promise<ApiFixture[]> {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    throw new Error(
      "API_FOOTBALL_KEY tanımlı değil. .env.local dosyasına ekleyin."
    );
  }

  const res = await fetch(
    `${API_BASE}/fixtures?league=${WC_LEAGUE_ID}&season=${WC_SEASON}`,
    {
      headers: { "x-apisports-key": apiKey },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error(`API-Football isteği başarısız: ${res.status}`);
  }

  const json = await res.json();
  return (json.response ?? []) as ApiFixture[];
}

/** Bir API fikstürünü kendi veritabanı satırımıza dönüştürür. */
export function fixtureToMatchRow(f: ApiFixture) {
  const { stage, groupName } = mapStage(f.league.round);
  return {
    id: f.fixture.id,
    stage,
    group_name: groupName,
    home_team_id: String(f.teams.home.id),
    away_team_id: String(f.teams.away.id),
    match_date: f.fixture.date,
    venue: f.fixture.venue?.name ?? null,
    status: mapStatus(f.fixture.status.short),
    home_score: f.goals.home,
    away_score: f.goals.away,
    home_score_et: f.score.extratime?.home ?? null,
    away_score_et: f.score.extratime?.away ?? null,
    home_penalties: f.score.penalty?.home ?? null,
    away_penalties: f.score.penalty?.away ?? null,
    updated_at: new Date().toISOString(),
  };
}

/** Fikstürlerden benzersiz takım listesini çıkarır. */
export function extractTeams(fixtures: ApiFixture[]) {
  const teams = new Map<string, { id: string; name: string; flag_emoji: string | null; group_name: string | null }>();

  for (const f of fixtures) {
    const { groupName } = mapStage(f.league.round);
    for (const side of ["home", "away"] as const) {
      const t = f.teams[side];
      const id = String(t.id);
      if (!teams.has(id)) {
        teams.set(id, {
          id,
          name: t.name,
          flag_emoji: null, // API logo URL döner; istenirse logo gösterimi ayrıca eklenebilir
          group_name: groupName,
        });
      }
    }
  }

  return Array.from(teams.values());
}
