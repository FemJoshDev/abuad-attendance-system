"use client";

import { useEffect, useState } from "react";

type Session = { id: string; course: { courseCode: string; courseTitle: string }; records: Array<{ status: string; createdAt: string }> };
export default function StudentAttendancePage() {
  const [sessions, setSessions] = useState<Session[]>([]); const [error, setError] = useState("");
  async function load() { const response = await fetch("/api/student/attendance"); if (!response.ok) throw new Error(); setSessions((await response.json()).data ?? []); }
  useEffect(() => { const initial = window.setTimeout(() => load().catch(() => setError("Unable to load live attendance.")), 0); const timer = window.setInterval(() => load().catch(() => undefined), 5000); return () => { window.clearTimeout(initial); window.clearInterval(timer); }; }, []);
  async function mark(sessionId: string) { const response = await fetch("/api/student/attendance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId }) }); if (!response.ok) { setError("Unable to mark attendance."); return; } await load(); }
  return <main className="mx-auto max-w-4xl px-5 py-8 md:px-10"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--outline)]">Live attendance</p><h1 className="mt-2 font-[Manrope] text-3xl font-extrabold text-[var(--primary)]">Mark attendance</h1><p className="mt-2 text-sm text-[var(--muted)]">Open sessions for your enrolled courses appear here.</p>{error && <p className="mt-5 text-sm text-red-700" role="alert">{error}</p>}<div className="mt-7 grid gap-4">{sessions.map((session) => <article className="rounded-lg border border-green-200 bg-green-50 p-5" key={session.id}><h2 className="font-[Manrope] text-xl font-bold text-green-950">{session.course.courseCode} · {session.course.courseTitle}</h2>{session.records[0] ? <p className="mt-3 font-semibold text-green-800">Attendance Recorded — {session.records[0].status}</p> : <button className="mt-4 rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white" type="button" onClick={() => mark(session.id)}>Mark Attendance Now</button>}</article>)}{!sessions.length && !error && <p className="rounded-lg border border-dashed border-[var(--outline-light)] p-8 text-center text-sm text-[var(--muted)]">No live attendance sessions are open.</p>}</div></main>;
}
