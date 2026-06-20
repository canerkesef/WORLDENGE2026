import fixedDates from "./worldcup-fixed-dates.json";
/**
 * worldcup26.ir ile entegrasyon (ücretsiz, kimlik doğrulamasız)
 *
 * API-Football'un ücretsiz planı 2026 sezonuna (Dünya Kupası 2026) erişim
 * vermediği için bu açık kaynak, ücretsiz World Cup 2026 API'sini kullanıyoruz.
 *
 * Endpoints:
 *   https://worldcup26.ir/get/games
 *   https://worldcup26.ir/get/teams
 */

const API_BASE = "https://worldcup26.ir";

type Wc26Team = {
  id: string;
  name_en: string;
  name_fa: string;
  flag: string;
  fifa_code: string;
  iso2: string;
  groups: string;
};

type Wc26Game = {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_score: string | null;
  away_score: string | null;
  group: string | null;
  matchday: string;
  local_date: string;
  stadium_id: string;
  finished: string;
  time_elapsed?: string | null;
  type: string;
  home_team_name_en?: string;
  away_team_name_en?: string;
};

export async function fetchWorldCupTeams(): Promise<Wc26Team[]> {
  const res = await fetch(`${API_BASE}/get/teams`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`worldcup26.ir takım isteği başarısız: ${res.status}`);
  }
  const json = await res.json();
  return (json.teams ?? []) as Wc26Team[];
}

export async function fetchWorldCupGames(): Promise<Wc26Game[]> {
  const res = await fetch(`${API_BASE}/get/games`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`worldcup26.ir fikstür isteği başarısız: ${res.status}`);
  }
  const json = await res.json();
  return (json.games ?? []) as Wc26Game[];
}

function parseLocalDate(localDate: string): string {
  const [datePart, timePart] = localDate.split(" ");
  const [month, day, year] = datePart.split("/");
  return `${year}-${month}-${day}T${timePart}:00Z`;
}

function mapStage(game: Wc26Game): { stage: string; groupName: string | null } {
  if (game.type === "group" || game.group) {
    return { stage: "GROUP", groupName: game.group ?? null };
  }

  const t = game.type.toLowerCase();
  if (t.includes("32")) return { stage: "R32", groupName: null };
  if (t.includes("16")) return { stage: "R16", groupName: null };
  if (t.includes("quarter") || t.includes("qf")) return { stage: "QF", groupName: null };
  if (t.includes("semi") || t.includes("sf")) return { stage: "SF", groupName: null };
  if (t.includes("third") || t.includes("3rd") || t.includes("f3")) return { stage: "F3", groupName: null };
  if (t.includes("final")) return { stage: "FINAL", groupName: null };

  const md = Number(game.matchday);
  if (md >= 1 && md <= 3) return { stage: "GROUP", groupName: game.group ?? null };
  return { stage: "R32", groupName: null };
}

function mapStatus(game: Wc26Game): "SCHEDULED" | "LIVE" | "FINISHED" {
  if (game.finished === "TRUE") return "FINISHED";
  if (
    game.time_elapsed &&
    game.time_elapsed !== "finished" &&
    !["not started", "notstarted", "ns", ""].includes(String(game.time_elapsed).toLowerCase())
  ) {
    return "LIVE";
  }
  return "SCHEDULED";
}

function toScore(v: string | null | undefined): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

export function gameToMatchRow(game: Wc26Game) {
  const { stage, groupName } = mapStage(game);
  return {
    id: Number(game.id),
    stage,
    group_name: groupName,
    home_team_id: game.home_team_id === "0" ? null : String(game.home_team_id),
    away_team_id: game.away_team_id === "0" ? null : String(game.away_team_id),
    match_date: (fixedDates as Record<string, string>)[`${game.home_team_name_en}|${game.away_team_name_en}`] ?? parseLocalDate(game.local_date),
    venue: null,
    status: mapStatus(game),
    home_score: toScore(game.home_score),
    away_score: toScore(game.away_score),
    home_score_et: null,
    away_score_et: null,
    home_penalties: null,
    away_penalties: null,
    updated_at: new Date().toISOString(),
  };
}

export function teamToRow(team: Wc26Team) {
  return {
    id: String(team.id),
    name: team.name_en,
    flag_emoji: team.flag ?? null,
    group_name: team.groups || null,
  };
}
