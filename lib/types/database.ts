export type Team = {
  id: string;
  name: string;
  flag_emoji: string | null;
  group_name: string | null;
};

export type MatchStage = "GROUP" | "R32" | "R16" | "QF" | "SF" | "F3" | "FINAL";
export type MatchStatus = "SCHEDULED" | "LIVE" | "FINISHED";

export type Match = {
  id: number;
  stage: MatchStage;
  group_name: string | null;
  match_number: number | null;
  home_team_id: string | null;
  away_team_id: string | null;
  home_placeholder: string | null;
  away_placeholder: string | null;
  match_date: string;
  venue: string | null;
  status: MatchStatus;
  home_score: number | null;
  away_score: number | null;
  home_score_et: number | null;
  away_score_et: number | null;
  home_penalties: number | null;
  away_penalties: number | null;
  updated_at: string;
  home_team?: Team | null;
  away_team?: Team | null;
};

export type Profile = {
  id: string;
  display_name: string;
  department: string | null;
  avatar_emoji: string | null;
  is_admin: boolean;
  created_at: string;
};

export type Prediction = {
  id: string;
  user_id: string;
  match_id: number;
  predicted_home_score: number;
  predicted_away_score: number;
  predicted_winner_id: string | null;
  points_awarded: number | null;
  created_at: string;
  updated_at: string;
};

export type TournamentPrediction = {
  user_id: string;
  champion_team_id: string | null;
  runner_up_team_id: string | null;
  third_place_team_id: string | null;
  top_scorer_player: string | null;
  locked_at: string | null;
  points_awarded: number | null;
};

export type LeaderboardRow = {
  user_id: string;
  display_name: string;
  department: string | null;
  avatar_emoji: string | null;
  match_points: number;
  tournament_points: number;
  total_points: number;
  exact_scores: number;
  predictions_scored: number;
};
