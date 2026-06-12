"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateMatchResult(
  matchId: number,
  data: {
    home_score: number | null;
    away_score: number | null;
    status: "SCHEDULED" | "LIVE" | "FINISHED";
  }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Yetkisiz");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) throw new Error("Yetkisiz");

  const { error } = await supabase
    .from("matches")
    .update({
      home_score: data.home_score,
      away_score: data.away_score,
      status: data.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", matchId);

  if (error) throw error;

  revalidatePath("/admin");
  revalidatePath("/tahminler");
  revalidatePath("/puan-tablosu");
  revalidatePath("/");
}
