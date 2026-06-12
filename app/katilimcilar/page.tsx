import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types/database";

export default async function KatilimcilarPage() {
  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("display_name");

  const rows = (profiles ?? []) as Profile[];

  // Departmana göre grupla
  const byDept = new Map<string, Profile[]>();
  for (const p of rows) {
    const key = p.department?.trim() || "Diğer";
    if (!byDept.has(key)) byDept.set(key, []);
    byDept.get(key)!.push(p);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
      <h1 className="stadium-heading text-3xl sm:text-4xl mb-2">Katılımcılar</h1>
      <p className="text-pitch/60 mb-8">
        Yarışmaya kayıtlı {rows.length} kişi.
      </p>

      {rows.length === 0 ? (
        <div className="bg-pitch/5 rounded-2xl p-8 text-center text-pitch/50">
          Henüz katılımcı yok. İlk kayıt olan sen ol!
        </div>
      ) : (
        <div className="space-y-8">
          {Array.from(byDept.entries()).map(([dept, people]) => (
            <section key={dept}>
              <h2 className="stadium-heading text-lg mb-3 text-pitch/70">{dept}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {people.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white border border-pitch/10 rounded-xl px-4 py-3 flex items-center gap-3"
                  >
                    <span className="text-2xl">{p.avatar_emoji ?? "⚽"}</span>
                    <span className="font-medium truncate">{p.display_name}</span>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
