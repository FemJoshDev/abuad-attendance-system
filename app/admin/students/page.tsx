"use client";

import { useCallback, useEffect, useState } from "react";

type User = { id: string; fullName: string; email: string; matricNumber: string | null; isActive: boolean; _count: { enrollments: number; complaints: number } };
type FormState = { fullName: string; email: string; matricNumber: string; department: string; college: string; level: string; academicSession: string };
const blankForm: FormState = { fullName: "", email: "", matricNumber: "", department: "", college: "CMHS", level: "", academicSession: "" };

export default function AdminStudentsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState<FormState>(blankForm);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch(`/api/admin/users?role=STUDENT&search=${encodeURIComponent(search)}`);
    if (!response.ok) throw new Error();
    setUsers((await response.json()).data?.users ?? []);
  }, [search]);

  useEffect(() => { const timer = window.setTimeout(() => { load().catch(() => setError("Unable to load students.")); }, 0); return () => window.clearTimeout(timer); }, [load]);

  async function register(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    const response = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, role: "STUDENT" }) });
    const payload = await response.json().catch(() => null);
    if (!response.ok) setError(payload?.error ?? "Unable to register student.");
    else { setForm(blankForm); setMessage("Student registered with the initial student password."); await load(); }
    setBusy(false);
  }

  async function toggle(user: User) {
    const response = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id, isActive: !user.isActive }) });
    if (!response.ok) { setError("Unable to update account status."); return; }
    setUsers((items) => items.map((item) => item.id === user.id ? { ...item, isActive: !item.isActive } : item));
  }

  return <main className="min-h-screen bg-[var(--background)] px-5 py-8 text-[var(--ink)] md:px-10"><div className="mx-auto max-w-7xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--outline)]">Directory</p><h1 className="mt-2 font-[Manrope] text-3xl font-extrabold text-[var(--primary)]">Students</h1><p className="mt-2 text-sm text-[var(--muted)]">Register students with the academic profile used for course targeting.</p>{message && <p className="mt-4 text-sm text-green-700" role="status">{message}</p>}{error && <p className="mt-4 text-sm text-red-700" role="alert">{error}</p>}<form className="mt-7 grid gap-3 rounded-lg border border-[var(--outline-light)] bg-[var(--surface)] p-5 shadow-sm md:grid-cols-4" onSubmit={register}><input className="rounded-md border border-[var(--outline-light)] px-3 py-2 text-sm" placeholder="Student name" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} required /><input className="rounded-md border border-[var(--outline-light)] px-3 py-2 text-sm" type="email" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /><input className="rounded-md border border-[var(--outline-light)] px-3 py-2 text-sm" placeholder="Matric number" value={form.matricNumber} onChange={(event) => setForm({ ...form, matricNumber: event.target.value })} required /><input className="rounded-md border border-[var(--outline-light)] px-3 py-2 text-sm" placeholder="Department" value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} /><input className="rounded-md border border-[var(--outline-light)] px-3 py-2 text-sm" placeholder="College / faculty" value={form.college} onChange={(event) => setForm({ ...form, college: event.target.value })} /><input className="rounded-md border border-[var(--outline-light)] px-3 py-2 text-sm" placeholder="Level" value={form.level} onChange={(event) => setForm({ ...form, level: event.target.value })} /><input className="rounded-md border border-[var(--outline-light)] px-3 py-2 text-sm" placeholder="Academic session" value={form.academicSession} onChange={(event) => setForm({ ...form, academicSession: event.target.value })} /><button className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white disabled:opacity-50" disabled={busy} type="submit">{busy ? "Registering..." : "Register student"}</button></form><form className="mt-7 flex max-w-xl gap-2" onSubmit={(event) => { event.preventDefault(); load().catch(() => setError("Unable to load students.")); }}><input className="min-w-0 flex-1 rounded-md border border-[var(--outline-light)] bg-[var(--surface)] px-4 py-3 text-sm" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, or matric number" /><button className="rounded-md border border-[var(--primary)] px-4 py-2 text-sm font-bold text-[var(--primary)]" type="submit">Search</button></form><div className="mt-7 overflow-x-auto rounded-lg border border-[var(--outline-light)] bg-[var(--surface)] shadow-sm"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-[var(--surface-low)] text-xs uppercase tracking-wide text-[var(--outline)]"><tr><th className="px-5 py-3">Student</th><th className="px-5 py-3">Matric number</th><th className="px-5 py-3">Enrollments</th><th className="px-5 py-3">Account</th><th className="px-5 py-3">Action</th></tr></thead><tbody className="divide-y divide-[var(--outline-light)]">{users.map((user) => <tr key={user.id}><td className="px-5 py-4"><strong>{user.fullName}</strong><span className="mt-1 block text-[var(--muted)]">{user.email}</span></td><td className="px-5 py-4">{user.matricNumber ?? "Not provided"}</td><td className="px-5 py-4">{user._count.enrollments}</td><td className="px-5 py-4">{user.isActive ? "Active" : "Inactive"}</td><td className="px-5 py-4"><button className="rounded-md border border-[var(--primary)] px-3 py-2 text-xs font-bold text-[var(--primary)]" type="button" onClick={() => toggle(user)}>{user.isActive ? "Deactivate" : "Activate"}</button></td></tr>)}</tbody></table></div></div></main>;
}
