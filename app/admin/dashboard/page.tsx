"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Session = { id: string; date: string; isOpen: boolean; course: { courseCode: string; courseTitle: string }; _count: { records: number } };
type Dashboard = { students: number; lecturers: number; courses: number; sessions: number; openComplaints: number; totalEnrollments: number; registeredToday: number; recentSessions: Session[] };
type LecturerForm = { fullName: string; email: string };
const blankLecturer: LecturerForm = { fullName: "", email: "" };
const cards = [["Students", "students", "Registered student accounts"], ["Lecturers", "lecturers", "Active teaching accounts"], ["Courses", "courses", "Courses in the catalogue"], ["Attendance sessions", "sessions", "Sessions across all courses"], ["Open complaints", "openComplaints", "Pending or in review"], ["Course enrollments", "totalEnrollments", "Total registrations"], ["Registered today", "registeredToday", "New registrations today"]] as const;

export default function AdminDashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState<LecturerForm>(blankLecturer);
  const [message, setMessage] = useState("");
  const [registering, setRegistering] = useState(false);

  async function loadDashboard() {
    const response = await fetch("/api/admin/dashboard");
    if (!response.ok) throw new Error();
    setData((await response.json()).data);
  }

  useEffect(() => { const timer = window.setTimeout(() => { loadDashboard().catch(() => setError("Unable to load the admin dashboard.")); }, 0); return () => window.clearTimeout(timer); }, []);

  async function registerLecturer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setRegistering(true); setError(""); setMessage("");
    const response = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, role: "LECTURER" }) });
    const payload = await response.json().catch(() => null);
    if (!response.ok) setError(payload?.error ?? "Unable to register lecturer.");
    else { setForm(blankLecturer); setMessage("Lecturer registered with the initial lecturer password."); await loadDashboard(); }
    setRegistering(false);
  }

  return <main className="min-h-screen bg-[var(--background)] px-5 py-8 text-[var(--ink)] md:px-10"><div className="mx-auto max-w-7xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--outline)]">Administration</p><h1 className="mt-2 font-[Manrope] text-3xl font-extrabold text-[var(--primary)]">System overview</h1><p className="mt-2 text-sm text-[var(--muted)]">Monitor users, courses, attendance, and complaint resolution from one place.</p>{error && <p className="mt-6 rounded-md bg-red-50 p-4 text-sm text-red-700" role="alert">{error}</p>}{message && <p className="mt-6 rounded-md bg-green-50 p-4 text-sm text-green-700" role="status">{message}</p>}{!data && !error && <p className="mt-8 text-sm text-[var(--muted)]">Loading system overview...</p>}{data && <><div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{cards.map(([label, key, detail]) => <article className="rounded-lg border border-[var(--outline-light)] bg-[var(--surface)] p-5 shadow-sm" key={key}><p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--outline)]">{label}</p><p className="mt-4 font-[Manrope] text-3xl font-extrabold text-[var(--primary)]">{data[key]}</p><p className="mt-2 text-sm text-[var(--muted)]">{detail}</p></article>)}</div><section className="mt-8 rounded-lg border border-[var(--outline-light)] bg-[var(--surface)] p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--outline)]">Account management</p><h2 className="mt-1 font-[Manrope] text-xl font-bold">Register lecturer</h2><p className="mt-1 text-sm text-[var(--muted)]">Create an active ABUAD lecturer account. The initial password is assigned securely by the server.</p></div><Link className="rounded-md border border-[var(--primary)] px-3 py-2 text-sm font-bold text-[var(--primary)]" href="/admin/lecturers">Manage lecturers</Link></div><form className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_auto]" onSubmit={registerLecturer}><input className="rounded-md border border-[var(--outline-light)] bg-[var(--background)] px-3 py-2 text-sm" type="text" placeholder="Lecturer name" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} required /><input className="rounded-md border border-[var(--outline-light)] bg-[var(--background)] px-3 py-2 text-sm" type="email" placeholder="ABUAD email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /><button className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white disabled:opacity-50" disabled={registering} type="submit">{registering ? "Registering..." : "Register lecturer"}</button></form></section><section className="mt-10 overflow-hidden rounded-lg border border-[var(--outline-light)] bg-[var(--surface)] shadow-sm"><div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--outline-light)] px-5 py-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--outline)]">Live activity</p><h2 className="mt-1 font-[Manrope] text-xl font-bold">Recent attendance sessions</h2></div><Link className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white" href="/admin/attendance">View all</Link></div><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-[var(--surface-low)] text-xs uppercase tracking-wide text-[var(--outline)]"><tr><th className="px-5 py-3">Course</th><th className="px-5 py-3">Date</th><th className="px-5 py-3">Records</th><th className="px-5 py-3">Status</th></tr></thead><tbody className="divide-y divide-[var(--outline-light)]">{data.recentSessions.map((session) => <tr key={session.id}><td className="px-5 py-4"><strong className="text-[var(--primary)]">{session.course.courseCode}</strong><span className="mt-1 block text-[var(--muted)]">{session.course.courseTitle}</span></td><td className="px-5 py-4 text-[var(--muted)]">{new Date(session.date).toLocaleDateString()}</td><td className="px-5 py-4">{session._count.records}</td><td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${session.isOpen ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{session.isOpen ? "OPEN" : "CLOSED"}</span></td></tr>)}</tbody></table></div></section></>}</div></main>;
}
