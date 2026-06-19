"use client";

import { useEffect, useState } from "react";

type AdminUser = {
  id: string;
  email: string | null;
  createdAt: string | null;
  lastSignInAt: string | null;
  emailConfirmed: boolean;
};

export default function AdminUserList() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/list-users");
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users ?? []);
      } else {
        setMessage("Hata: " + data.error);
      }
    } catch {
      setMessage("Kullanicilar yuklenirken bir hata olustu.");
    }
    setLoading(false);
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleDelete(u: AdminUser) {
    const ok = confirm(u.email + " kullanicisini silmek istediginize emin misiniz?");
    if (!ok) {
      return;
    }
    setBusyId(u.id);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: u.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage("Hata: " + data.error);
      } else {
        setMessage(u.email + " silindi.");
        setUsers((prev) => prev.filter((x) => x.id !== u.id));
      }
    } catch {
      setMessage("Bir hata olustu.");
    }
    setBusyId(null);
  }

  async function handleSetPassword(u: AdminUser) {
    if (!newPassword || newPassword.length < 6) {
      setMessage("Sifre en az 6 karakter olmali");
      return;
    }
    setBusyId(u.id);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: u.email, newPassword: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage("Hata: " + data.error);
      } else {
        setMessage(u.email + " icin sifre guncellendi.");
        setNewPassword("");
        setEditingId(null);
      }
    } catch {
      setMessage("Bir hata olustu.");
    }
    setBusyId(null);
  }

  function formatDate(d: string | null) {
    if (!d) return "-";
    return new Date(d).toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="bg-pitch text-paper rounded-2xl p-5 led-dots flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="stadium-heading text-lg">Kullanicilar</h2>
        <button
          onClick={loadUsers}
          disabled={loading}
          className="text-sm text-paper/70 hover:text-paper transition-colors disabled:opacity-50"
        >
          {loading ? "Yenileniyor..." : "Yenile"}
        </button>
      </div>

      {message && <p className="text-sm text-paper/70">{message}</p>}

      {loading ? (
        <p className="text-sm text-paper/60">Yukleniyor...</p>
      ) : users.length === 0 ? (
        <p className="text-sm text-paper/60">Kullanici bulunamadi.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {users.map((u) => (
            <div
              key={u.id}
              className="rounded-lg border border-paper/20 bg-pitch-light p-3 flex flex-col gap-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{u.email ?? "-"}</p>
                  <p className="text-xs text-paper/60">
                    Kayit: {formatDate(u.createdAt)} - Son giris: {formatDate(u.lastSignInAt)}
                    {!u.emailConfirmed && " - Email onaylanmamis"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingId(editingId === u.id ? null : u.id);
                      setNewPassword("");
                    }}
                    className="text-sm bg-gold text-pitch font-semibold px-3 py-1.5 rounded-lg hover:bg-gold/90 transition-colors"
                  >
                    Sifre
                  </button>
                  <button
                    onClick={() => handleDelete(u)}
                    disabled={busyId === u.id}
                    className="text-sm bg-red-600 text-paper font-semibold px-3 py-1.5 rounded-lg hover:bg-red-600/90 transition-colors disabled:opacity-50"
                  >
                    {busyId === u.id ? "..." : "Sil"}
                  </button>
                </div>
              </div>

              {editingId === u.id && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-paper/10">
                  <input
                    type="text"
                    placeholder="Yeni sifre (en az 6 karakter)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="flex-1 min-w-[160px] rounded-lg border border-paper/20 bg-pitch px-3 py-2 text-paper focus:border-gold focus:outline-none"
                  />
                  <button
                    onClick={() => handleSetPassword(u)}
                    disabled={busyId === u.id}
                    className="bg-gold text-pitch font-semibold px-3 py-2 rounded-lg hover:bg-gold/90 transition-colors disabled:opacity-50"
                  >
                    {busyId === u.id ? "Guncelleniyor..." : "Guncelle"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
