import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminMatchList from "@/components/AdminMatchList";
import SyncFixturesButton from "@/components/SyncFixturesButton";
import SetPasswordForm from "@/components/SetPasswordForm";
import AdminUserList from "@/components/AdminUserList";
import type { Match } from "@/lib/types/database";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/giris");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-16 text-center">
        <h1 className="stadium-heading text-3xl mb-3">Bu sayfa sadece yöneticiler için</h1>
        <p className="text-pitch/60">
          Yönetici yetkisi almak için sistem yöneticinizle iletişime geçin.
        </p>
      </div>
    );
  }

  const { data: matches } = await supabase
    .from("matches")
    .select("*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)")
    .order("match_date", { ascending: true });

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="stadium-heading text-3xl sm:text-4xl mb-2">Yönetim Paneli</h1>
          <p className="text-pitch/60">
            Fikstürü senkronize et ve maç sonuçlarını yönet.
          </p>
        </div>
        <SyncFixturesButton />
          <SetPasswordForm />
          <AdminUserList />
      </div>

      <AdminMatchList matches={(matches ?? []) as Match[]} />
    </div>
  );
}
