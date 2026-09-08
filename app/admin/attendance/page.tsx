"use client";

import { useEffect, useState } from "react";

type RecordItem = { student: { fullName: string; matricNumber: string | null }; status: string };
type Session = { id: string; date: string; isOpen: boolean; course: { courseCode: string; courseTitle: string }; createdBy: { fullName: string; email: string } | null; records: RecordItem[] };

export default function AdminAttendancePage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [courseId, setCourseId] = useState("");
  const [lecturerId, setLecturerId] = useState("");
  const [date, setDate] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const query = new URLSearchParams({ ...(courseId ? { courseId } : {}), ...(lecturerId ? { lecturerId } : {}), ...(date ? { date } : {}) });
    const response = await fetch(`/api/admin/attendance?${query}`);
    if (!response.ok) { setError("Unable to load attendance records."); return; }
    const payload = await response.json();
    setSessions(payload.data ?? []);
  }

  useEffect(() => {
    fetch("/api/admin/attendance")
      .then(async (response) => { if (!response.ok) throw new Error(); return response.json(); })
      .then((payload) => setSessions(payload.data ?? []))
      .catch(() => setError("Unable to load attendance records."));
  }, []);

  return <main><h1>Attendance Administration</h1><p>Review sessions and records through the protected administrative API.</p><form onSubmit={(event) => { event.preventDefault(); load(); }}><input value={courseId} onChange={(event) => setCourseId(event.target.value)} placeholder="Course ID" /><input value={lecturerId} onChange={(event) => setLecturerId(event.target.value)} placeholder="Lecturer ID" /><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /><button type="submit">Filter</button></form><a href="/api/admin/attendance?format=csv" download="attendance-export.csv">Download Attendance CSV</a>{error && <p role="alert">{error}</p>}{sessions.map((session) => <article key={session.id}><h2>{session.course.courseCode} · {new Date(session.date).toLocaleDateString()}</h2><p>{session.isOpen ? "OPEN" : "CLOSED"} · {session.createdBy?.fullName ?? "Unknown lecturer"} · {session.records.length} records</p>{session.records.map((record) => <p key={`${session.id}-${record.student.matricNumber}`}>{record.student.fullName} ({record.student.matricNumber ?? "No matric"}): {record.status}</p>)}</article>)}</main>;
}