import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.listUsers({
    perPage: 1000,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const users = data.users
    .map((u) => ({
      id: u.id,
      email: u.email,
      createdAt: u.created_at,
      lastSignInAt: u.last_sign_in_at,
      emailConfirmed: !!u.email_confirmed_at,
    }))
    .sort((a, b) => (a.email ?? "").localeCompare(b.email ?? ""));

  return NextResponse.json({ users });
}
