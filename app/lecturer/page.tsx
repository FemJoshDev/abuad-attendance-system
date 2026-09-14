"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Course = { id: string; courseCode: string; courseTitle: string; studentCount: number; sessionCount: number; latestSession: { id: string; isOpen: boolean } | null };
type Dashboard = { assignedCourses: number; attendanceSessions: number; studentAttendancePercentage: number; courses: Course[] };

export default function LecturerDashboard() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/lecturer/dashboard")
      .then(async (response) => { if (!response.ok) throw new Error(); return response.json(); })
      .then((payload) => setData(payload.data))
      .catch(() => setError("Unable to load lecturer dashboard."));
  }, []);

  if (error) return <main className="min-h-screen bg-[var(--background)] p-6 text-[var(--ink)]"><h1 className="font-[Manrope] text-2xl font-bold text-[var(--primary)]">Lecturer Portal</h1><p className="mt-4 text-sm text-[var(--error)]" role="alert">{error}</p></main>;
  if (!data) return <main className="min-h-screen bg-[var(--background)] p-6 text-[var(--ink)]"><p className="text-sm text-[var(--muted)]">Loading dashboard...</p></main>;

  return <main className="min-h-screen bg-[var(--background)] text-[var(--ink)]"><header className="border-b border-[var(--outline-light)] px-6 py-6 md:px-10"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--outline)]">Lecturer Portal</p><h1 className="mt-2 font-[Manrope] text-3xl font-extrabold text-[var(--primary)]">Dashboard</h1><p className="mt-2 text-sm text-[var(--muted)]">Manage your assigned courses and attendance sessions.</p></header><div className="mx-auto max-w-7xl px-6 py-8 md:px-10"><div className="grid gap-4 md:grid-cols-3">{[["Assigned courses", data.assignedCourses, "Active teaching assignments"], ["Attendance sessions", data.attendanceSessions, "Sessions across your courses"], ["Average attendance", `${data.studentAttendancePercentage}%`, "Present or late records"]].map(([label, value, detail]) => <article className="rounded-lg border border-[var(--outline-light)] bg-[var(--surface)] p-5 shadow-sm" key={String(label)}><p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--outline)]">{label}</p><p className="mt-4 font-[Manrope] text-3xl font-extrabold text-[var(--primary)]">{value}</p><p className="mt-2 text-sm text-[var(--muted)]">{detail}</p></article>)}</div><div className="mt-10 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--outline)]">Teaching load</p><h2 className="mt-2 font-[Manrope] text-2xl font-extrabold">My Courses</h2></div><Link className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white" href="/lecturer/courses">View all courses</Link></div>{!data.courses.length ? <p className="mt-5 rounded-lg border border-dashed border-[var(--outline-light)] p-8 text-center text-sm text-[var(--muted)]">Yet to have an active course</p> : <div className="mt-5 grid gap-4 lg:grid-cols-2">{data.courses.map((course) => <article className="rounded-lg border border-[var(--outline-light)] bg-[var(--surface)] p-5 shadow-sm" key={course.id}><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-bold text-[var(--primary)]">{course.courseCode}</p><h3 className="mt-1 font-[Manrope] text-lg font-bold">{course.courseTitle}</h3></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${course.latestSession?.isOpen ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{course.latestSession?.isOpen ? "OPEN" : "READY"}</span></div><p className="mt-4 text-sm text-[var(--muted)]">{course.studentCount} registered students · {course.sessionCount} attendance sessions</p><Link className="mt-5 inline-flex rounded-md border border-[var(--primary)] px-3 py-2 text-sm font-bold text-[var(--primary)]" href={`/lecturer/courses/${course.id}`}>Manage attendance</Link></article>)}</div>}</div></main>;
}
