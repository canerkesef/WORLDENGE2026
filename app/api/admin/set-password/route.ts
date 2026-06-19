import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  // Sadece admin profili olan kullanicilar bu islemi yapabilir
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

  const { email, newPassword } = await req.json();
  if (!email || !newPassword) {
    return NextResponse.json({ error: "E-posta ve sifre gerekli" }, { status: 400 });
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ error: "Sifre en az 6 karakter olmali" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Kullaniciyi e-posta ile bul
  const { data: list, error: listError } = await admin.auth.admin.listUsers();
  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 500 });
  }
  const targetUser = list.users.find(
    (u) => u.email?.toLowerCase() === String(email).toLowerCase()
  );
  if (!targetUser) {
    return NextResponse.json({ error: "Kullanici bulunamadi" }, { status: 404 });
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(
    targetUser.id,
    { password: newPassword }
  );
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
