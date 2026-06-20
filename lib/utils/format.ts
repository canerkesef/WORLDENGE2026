import type { MatchStage } from "@/lib/types/database";

export const STAGE_LABELS: Record<MatchStage, string> = {
  GROUP: "Grup Aşaması",
  R32: "Son 32 Turu",
  R16: "Son 16 Turu",
  QF: "Çeyrek Final",
  SF: "Yarı Final",
  F3: "3.lük Maçı",
  FINAL: "Final",
};

export function formatMatchDate(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  }).format(date);
}

export function teamLabel(
  teamName: string | null | undefined,
  placeholder: string | null | undefined
): string {
  if (teamName) return teamName;
  if (placeholder) return placeholder;
  return "?";
}

export function resultFromScore(home: number, away: number): "1" | "X" | "2" {
  if (home > away) return "1";
  if (home < away) return "2";
  return "X";
}
