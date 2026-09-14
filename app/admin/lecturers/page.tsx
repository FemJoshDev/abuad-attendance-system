"use client";

import { useCallback, useEffect, useState } from "react";

type User = { id: string; fullName: string; email: string; isActive: boolean; _count: { complaints: number } };
type LecturerForm = { fullName: string; email: string };
const blankForm: LecturerForm = { fullName: "", email: "" };

export default function AdminLecturersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState<LecturerForm>(blankForm);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch(`/api/admin/users?role=LECTURER&search=${encodeURIComponent(search)}`);
    if (!response.ok) throw new Error();
    setUsers((await response.json()).data?.users ?? []);
  }, [search]);

  useEffect(() => { const timer = window.setTimeout(() => { load().catch(() => setError("Unable to load lecturers.")); }, 0); return () => window.clearTimeout(timer); }, [load]);

  async function register(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    const response = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, role: "LECTURER" }) });
    const payload = await response.json().catch(() => null);
    if (!response.ok) setError(payload?.error ?? "Unable to register lecturer.");
    else { setForm(blankForm); setMessage("Lecturer registered with the initial lecturer password."); await load(); }
    setBusy(false);
  }

  async function toggle(user: User) {
    const response = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id, isActive: !user.isActive }) });
    if (!response.ok) { setError("Unable to update account status."); return; }
    setUsers((items) => items.map((item) => item.id === user.id ? { ...item, isActive: !item.isActive } : item));
  }

  return <main className="min-h-screen bg-[var(--background)] px-5 py-8 text-[var(--ink)] md:px-10"><div className="mx-auto max-w-7xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--outline)]">Directory</p><h1 className="mt-2 font-[Manrope] text-3xl font-extrabold text-[var(--primary)]">Lecturers</h1><p className="mt-2 text-sm text-[var(--muted)]">Register ABUAD lecturer accounts and manage their active status.</p>{message && <p className="mt-4 text-sm text-green-700" role="status">{message}</p>}{error && <p className="mt-4 text-sm text-red-700" role="alert">{error}</p>}<form className="mt-7 grid gap-3 rounded-lg border border-[var(--outline-light)] bg-[var(--surface)] p-5 shadow-sm md:grid-cols-3" onSubmit={register}><input className="rounded-md border border-[var(--outline-light)] px-3 py-2 text-sm" placeholder="Lecturer name" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} required /><input className="rounded-md border border-[var(--outline-light)] px-3 py-2 text-sm" type="email" placeholder="ABUAD email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /><button className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white disabled:opacity-50" disabled={busy} type="submit">{busy ? "Registering..." : "Register lecturer"}</button></form><form className="mt-7 flex max-w-xl gap-2" onSubmit={(event) => { event.preventDefault(); load().catch(() => setError("Unable to load lecturers.")); }}><input className="min-w-0 flex-1 rounded-md border border-[var(--outline-light)] bg-[var(--surface)] px-4 py-3 text-sm" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search lecturer name or email" /><button className="rounded-md border border-[var(--primary)] px-4 py-2 text-sm font-bold text-[var(--primary)]" type="submit">Search</button></form><div className="mt-7 overflow-x-auto rounded-lg border border-[var(--outline-light)] bg-[var(--surface)] shadow-sm"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-[var(--surface-low)] text-xs uppercase tracking-wide text-[var(--outline)]"><tr><th className="px-5 py-3">Lecturer</th><th className="px-5 py-3">Complaints</th><th className="px-5 py-3">Account</th><th className="px-5 py-3">Action</th></tr></thead><tbody className="divide-y divide-[var(--outline-light)]">{users.map((user) => <tr key={user.id}><td className="px-5 py-4"><strong>{user.fullName}</strong><span className="mt-1 block text-[var(--muted)]">{user.email}</span></td><td className="px-5 py-4">{user._count.complaints}</td><td className="px-5 py-4">{user.isActive ? "Active" : "Inactive"}</td><td className="px-5 py-4"><button className="rounded-md border border-[var(--primary)] px-3 py-2 text-xs font-bold text-[var(--primary)]" type="button" onClick={() => toggle(user)}>{user.isActive ? "Deactivate" : "Activate"}</button></td></tr>)}</tbody></table></div></div></main>;
}
