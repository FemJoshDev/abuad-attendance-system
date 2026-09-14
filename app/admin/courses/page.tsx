"use client";

import { useCallback, useEffect, useState } from "react";

type Lecturer = { id: string; fullName: string; email: string };
type Course = { id: string; courseCode: string; courseTitle: string; unit: number | null; department: string | null; level: string | null; semester: string | null; academicSession: string | null; isActive: boolean; _count: { enrollments: number; attendanceSessions: number; lecturerAssignments: number }; lecturerAssignments: Array<{ lecturer: Lecturer }> };
type CourseForm = { courseCode: string; courseTitle: string; unit: string; department: string; level: string; semester: string; academicSession: string };
const blankForm: CourseForm = { courseCode: "", courseTitle: "", unit: "", department: "", level: "", semester: "", academicSession: "" };

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [form, setForm] = useState<CourseForm>(blankForm);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    const [courseResponse, lecturerResponse] = await Promise.all([fetch(`/api/admin/courses?search=${encodeURIComponent(search)}`), fetch("/api/admin/users?role=LECTURER&limit=100")]);
    if (!courseResponse.ok || !lecturerResponse.ok) throw new Error();
    const [coursePayload, lecturerPayload] = await Promise.all([courseResponse.json(), lecturerResponse.json()]);
    setCourses(coursePayload.data ?? []);
    setLecturers(lecturerPayload.data?.users ?? []);
  }, [search]);

  useEffect(() => { const timer = window.setTimeout(() => { load().catch(() => setError("Unable to load course management.")); }, 0); return () => window.clearTimeout(timer); }, [load]);

  async function createCourse(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("create"); setError(""); setMessage("");
    const response = await fetch("/api/admin/courses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, unit: form.unit ? Number(form.unit) : undefined }) });
    if (!response.ok) setError((await response.json().catch(() => null))?.error ?? "Unable to create course.");
    else { setForm(blankForm); setMessage("Course created and activated."); await load(); }
    setBusy("");
  }

  async function updateCourse(course: Course, changes: Record<string, unknown>) {
    setBusy(course.id); setError(""); setMessage("");
    const response = await fetch(`/api/admin/courses/${course.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(changes) });
    if (!response.ok) setError((await response.json().catch(() => null))?.error ?? "Unable to update course.");
    else { setMessage("Course updated."); await load(); }
    setBusy("");
  }

  async function assign(courseId: string, lecturerId: string) {
    if (!lecturerId) return;
    setBusy(courseId); setError("");
    const response = await fetch("/api/admin/assignments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ courseId, lecturerId }) });
    if (!response.ok) setError((await response.json().catch(() => null))?.error ?? "Unable to assign lecturer.");
    else { setMessage("Lecturer assignment updated."); await load(); }
    setBusy("");
  }

  async function removeAssignment(courseId: string, lecturerId: string) {
    setBusy(courseId); setError("");
    const response = await fetch("/api/admin/assignments", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ courseId, lecturerId }) });
    if (!response.ok) setError("Unable to remove lecturer assignment.");
    else { setMessage("Lecturer assignment removed."); await load(); }
    setBusy("");
  }

  return <main className="min-h-screen bg-[var(--background)] px-5 py-8 text-[var(--ink)] md:px-10"><div className="mx-auto max-w-7xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--outline)]">Academic catalogue</p><h1 className="mt-2 font-[Manrope] text-3xl font-extrabold text-[var(--primary)]">Courses</h1><p className="mt-2 text-sm text-[var(--muted)]">Create, publish, assign, and monitor courses using live database data.</p>{message && <p className="mt-4 text-sm text-green-700" role="status">{message}</p>}{error && <p className="mt-4 text-sm text-red-700" role="alert">{error}</p>}<form className="mt-7 grid gap-3 rounded-lg border border-[var(--outline-light)] bg-[var(--surface)] p-5 shadow-sm md:grid-cols-4" onSubmit={createCourse}><input className="rounded-md border border-[var(--outline-light)] px-3 py-2 text-sm" placeholder="Course code" value={form.courseCode} onChange={(event) => setForm({ ...form, courseCode: event.target.value })} required /><input className="rounded-md border border-[var(--outline-light)] px-3 py-2 text-sm md:col-span-2" placeholder="Course title" value={form.courseTitle} onChange={(event) => setForm({ ...form, courseTitle: event.target.value })} required /><input className="rounded-md border border-[var(--outline-light)] px-3 py-2 text-sm" placeholder="Units" type="number" min="0" value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} /><input className="rounded-md border border-[var(--outline-light)] px-3 py-2 text-sm" placeholder="Department" value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} /><input className="rounded-md border border-[var(--outline-light)] px-3 py-2 text-sm" placeholder="Level" value={form.level} onChange={(event) => setForm({ ...form, level: event.target.value })} /><input className="rounded-md border border-[var(--outline-light)] px-3 py-2 text-sm" placeholder="Semester" value={form.semester} onChange={(event) => setForm({ ...form, semester: event.target.value })} /><input className="rounded-md border border-[var(--outline-light)] px-3 py-2 text-sm" placeholder="Academic session" value={form.academicSession} onChange={(event) => setForm({ ...form, academicSession: event.target.value })} /><button className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white disabled:opacity-50" disabled={busy === "create"} type="submit">{busy === "create" ? "Creating..." : "Create course"}</button></form><form className="mt-5 flex max-w-xl gap-2" onSubmit={(event) => { event.preventDefault(); load().catch(() => setError("Unable to load courses.")); }}><input className="min-w-0 flex-1 rounded-md border border-[var(--outline-light)] bg-[var(--surface)] px-4 py-3 text-sm" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search course code or title" /><button className="rounded-md border border-[var(--primary)] px-4 py-2 text-sm font-bold text-[var(--primary)]" type="submit">Search</button></form><div className="mt-7 grid gap-4">{courses.map((course) => <article className="rounded-lg border border-[var(--outline-light)] bg-[var(--surface)] p-5 shadow-sm" key={course.id}><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-bold text-[var(--primary)]">{course.courseCode}</p><h2 className="mt-1 font-[Manrope] text-xl font-bold">{course.courseTitle}</h2><p className="mt-2 text-sm text-[var(--muted)]">{course.unit ?? "-"} units · {course.department ?? "All departments"} · {course.level ?? "All levels"}</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${course.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{course.isActive ? "PUBLISHED" : "INACTIVE"}</span></div><div className="mt-5 grid gap-3 text-sm md:grid-cols-3"><span><b>{course._count.enrollments}</b> enrolled</span><span><b>{course._count.attendanceSessions}</b> sessions</span><label>Assign lecturer<select className="mt-1 block w-full rounded-md border border-[var(--outline-light)] px-2 py-2" value="" disabled={busy === course.id} onChange={(event) => void assign(course.id, event.target.value)}><option value="">Select lecturer</option>{lecturers.map((lecturer) => <option key={lecturer.id} value={lecturer.id}>{lecturer.fullName}</option>)}</select></label></div><div className="mt-4 flex flex-wrap gap-2">{course.lecturerAssignments.map(({ lecturer }) => <span className="rounded-md bg-[var(--surface-low)] px-3 py-2 text-xs" key={lecturer.id}>{lecturer.fullName}<button className="ml-2 font-bold text-red-700" type="button" onClick={() => void removeAssignment(course.id, lecturer.id)} aria-label={`Remove ${lecturer.fullName}`}>×</button></span>)}<button className="rounded-md border border-[var(--primary)] px-3 py-2 text-xs font-bold text-[var(--primary)]" type="button" disabled={busy === course.id} onClick={() => void updateCourse(course, { isActive: !course.isActive })}>{course.isActive ? "Deactivate course" : "Publish course"}</button></div></article>)}{!courses.length && <p className="rounded-lg border border-dashed border-[var(--outline-light)] p-8 text-center text-sm text-[var(--muted)]">No courses found.</p>}</div></div></main>;
}
