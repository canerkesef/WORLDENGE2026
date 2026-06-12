import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";

export default async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let displayName: string | null = null;
  let isAdmin = false;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, is_admin")
      .eq("id", user.id)
      .single();
    displayName = profile?.display_name ?? null;
    isAdmin = profile?.is_admin ?? false;
  }

  return (
    <header className="bg-pitch text-paper led-dots">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl">🏆</span>
            <span className="stadium-heading text-lg sm:text-xl tracking-tight">
              KUPA<span className="text-gold">26</span>
            </span>
          </Link>

          <nav className="hidden sm:flex items-center gap-6 text-sm font-medium">
            <Link href="/" className="hover:text-gold transition-colors">
              Ana Sayfa
            </Link>
            <Link href="/tahminler" className="hover:text-gold transition-colors">
              Tahminler
            </Link>
            <Link href="/puan-tablosu" className="hover:text-gold transition-colors">
              Puan Tablosu
            </Link>
            <Link href="/katilimcilar" className="hover:text-gold transition-colors">
              Katılımcılar
            </Link>
            {isAdmin && (
              <Link href="/admin" className="hover:text-gold transition-colors">
                Yönetim
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="hidden sm:inline text-sm text-paper/70">
                  {displayName}
                </span>
                <LogoutButton />
              </>
            ) : (
              <>
                <Link
                  href="/giris"
                  className="text-sm font-medium hover:text-gold transition-colors"
                >
                  Giriş Yap
                </Link>
                <Link
                  href="/kayit"
                  className="text-sm font-semibold bg-gold text-pitch px-3 py-1.5 rounded-md hover:bg-gold/90 transition-colors"
                >
                  Kayıt Ol
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobil alt navigasyon */}
        <nav className="flex sm:hidden items-center gap-4 overflow-x-auto pb-3 text-sm font-medium">
          <Link href="/" className="hover:text-gold transition-colors whitespace-nowrap">
            Ana Sayfa
          </Link>
          <Link href="/tahminler" className="hover:text-gold transition-colors whitespace-nowrap">
            Tahminler
          </Link>
          <Link href="/puan-tablosu" className="hover:text-gold transition-colors whitespace-nowrap">
            Puan Tablosu
          </Link>
          <Link href="/katilimcilar" className="hover:text-gold transition-colors whitespace-nowrap">
            Katılımcılar
          </Link>
          {isAdmin && (
            <Link href="/admin" className="hover:text-gold transition-colors whitespace-nowrap">
              Yönetim
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
