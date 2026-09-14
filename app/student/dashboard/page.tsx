"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getBrowserLocation } from "@/src/lib/browser-location";

type Course = { courseId: string; courseCode: string; courseTitle: string; present: number; late: number; totalSessions: number; eligibleSessions: number; attendancePercentage: number | null; status: "Good standing" | "At risk" | "No data" };
type Record = { id: string; courseCode: string; courseTitle: string; status: string; date: string; time: string };
type Dashboard = { student: { name: string; email: string; matricNumber: string | null; avatarUrl: string | null }; overallAttendance: { attendancePercentage: number | null; attendedClasses: number; totalClasses: number; threshold: number }; courses: Course[]; recentAttendance: Record[]; warnings: Array<{ courseId: string; courseCode: string; attendancePercentage: number; threshold: number }> };
type LiveSession = { id: string; course: { courseCode: string; courseTitle: string }; records: Array<{ id: string; status: string }> };

function Avatar({ student, large = false }: { student: Dashboard["student"]; large?: boolean }) {
  const initials = student.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return student.avatarUrl ? (
    // User-uploaded avatar URLs are dynamic and are not constrained to configured Next image hosts.
    // eslint-disable-next-line @next/next/no-img-element
    <img className={`avatar ${large ? "avatar-large" : ""}`} src={student.avatarUrl} alt={`${student.name} profile`} />
  ) : <div className={`avatar ${large ? "avatar-large" : ""}`} aria-label={`${student.name} profile photo`}>{initials}</div>;
}

function ProfileCard({ student }: { student: Dashboard["student"] }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  async function upload(file: File) { if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) { setUploadError("Choose a JPG, PNG, or WebP image smaller than 5 MB."); return; } setUploading(true); setUploadError(""); try { const body = new FormData(); body.append("file", file); const response = await fetch("/api/settings/profile/avatar", { method: "POST", body }); const payload = await response.json().catch(() => null); if (!response.ok) throw new Error(payload?.error ?? "Upload failed."); window.location.reload(); } catch (reason) { setUploadError(reason instanceof Error ? reason.message : "Upload failed."); } finally { setUploading(false); } }
  return <section className="profile-card card"><div className="profile-top"><div><p className="eyebrow">STUDENT PROFILE</p><h2>{student.name}</h2><p className="matric">Matric No: {student.matricNumber ?? "Not provided"}</p></div><label className="avatar-button cursor-pointer"><Avatar student={student} large /><span>{uploading ? "Uploading..." : "Change photo"}</span><input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); event.currentTarget.value = ""; }} /></label></div>{uploadError && <p className="form-error" role="alert">{uploadError}</p>}<div className="profile-details"><div><span>Student</span><strong>{student.email}</strong></div><div><span>Account</span><strong>Active</strong></div></div></section>;
}

function Notifications({ warnings }: { warnings: Dashboard["warnings"] }) {
  return <section className="notifications card"><div className="section-heading"><div><p className="eyebrow">STAY INFORMED</p><h2>Attendance Notifications</h2></div><span className="notification-count">{warnings.length}</span></div>{warnings.map((warning) => <div className="notification-row" key={warning.courseId}><span className="notification-dot dot-attention" /><p>{warning.courseCode}: {warning.attendancePercentage}% attendance is below {warning.threshold}%</p><time>Now</time></div>)}</section>;
}

export default function StudentDashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [attendanceAlert, setAttendanceAlert] = useState<LiveSession | null>(null);
  const [error, setError] = useState("");
  const [marking, setMarking] = useState("");
  const notifiedSessionIds = useRef(new Set<string>());

  async function loadDashboard() { const response = await fetch("/api/dashboard"); if (!response.ok) throw new Error(); setData((await response.json()).data ?? null); }
  async function loadLive() {
    const response = await fetch("/api/student/attendance");
    if (!response.ok) return;
    const sessions: LiveSession[] = (await response.json()).data ?? [];
    const newlyOpened = sessions.find((session) => !notifiedSessionIds.current.has(session.id));
    if (newlyOpened) { notifiedSessionIds.current.add(newlyOpened.id); setAttendanceAlert(newlyOpened); }
  }

  useEffect(() => { const initial = window.setTimeout(() => { loadDashboard().catch(() => setError("Unable to load your attendance dashboard right now.")); loadLive().catch(() => undefined); }, 0); const timer = window.setInterval(() => loadLive().catch(() => undefined), 5000); return () => { window.clearTimeout(initial); window.clearInterval(timer); }; }, []);
  useEffect(() => { if (!attendanceAlert) return; const timeout = window.setTimeout(() => setAttendanceAlert(null), 5000); return () => window.clearTimeout(timeout); }, [attendanceAlert]);

  async function mark(sessionId: string) {
    setMarking(sessionId);
    try {
      const location = await getBrowserLocation();
      const response = await fetch("/api/student/attendance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId, ...location }) });
      if (!response.ok) setError((await response.json().catch(() => null))?.error ?? "Unable to mark attendance.");
      else await Promise.all([loadLive(), loadDashboard().catch(() => undefined)]);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to mark attendance."); }
    setMarking("");
  }

  const overall = data?.overallAttendance;
  const percentage = overall?.attendancePercentage ?? 0;
  return <main className="dashboard-main">
    {attendanceAlert && <aside className="fixed right-4 top-4 z-[60] w-[calc(100%-2rem)] max-w-sm rounded-lg border border-green-200 bg-green-50 p-4 shadow-lg sm:right-6 sm:top-6" role="status" aria-live="polite"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold text-green-900">Attendance is now open</p><p className="mt-1 text-sm text-green-800">{attendanceAlert.course.courseCode} · {attendanceAlert.course.courseTitle}</p>{attendanceAlert.records[0] && <p className="mt-1 text-xs font-semibold text-green-700">Attendance recorded — {attendanceAlert.records[0].status}</p>}</div><button type="button" className="text-lg leading-none text-green-800" onClick={() => setAttendanceAlert(null)} aria-label="Dismiss attendance alert">×</button></div>{!attendanceAlert.records[0] && <button className="mt-3 rounded-md bg-[var(--primary)] px-3 py-2 text-sm font-bold text-white disabled:opacity-50" disabled={marking === attendanceAlert.id} type="button" onClick={() => mark(attendanceAlert.id)}>{marking === attendanceAlert.id ? "Marking..." : "Mark attendance"}</button>}</aside>}
    <header className="dashboard-header"><div><p className="eyebrow">STUDENT PORTAL</p><h1>Welcome{data ? `, ${data.student.name}` : ""}</h1><p>College of Medicine &amp; Health Sciences</p></div>{data && <div className="header-profile"><Avatar student={data.student} /><span>{data.student.name}</span></div>}</header>
    {error && <p className="form-error mt-5" role="alert">{error}</p>}
    {!data && !error && <div className="empty-state card mt-8"><span className="empty-icon">○</span><h2>Loading attendance...</h2><p>Please wait while we calculate your statistics.</p></div>}
    {data && <div className="dashboard-grid"><div className="welcome-column"><div className="mobile-welcome"><p className="eyebrow">STUDENT PORTAL</p><h1>Welcome, {data.student.name.split(" ")[0]}.</h1><p>Here is your attendance overview for this semester.</p></div><ProfileCard student={data.student} /><section className="overall-card"><div className="card-kicker">SEMESTER OVERVIEW</div><h2>Overall Attendance</h2><div className="attendance-number"><strong>{percentage}</strong><span>%</span></div><div className="overall-bar"><span style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }} /></div><div className="overall-foot"><span><b>{data.overallAttendance.attendedClasses}</b> Present</span><span><b>{data.overallAttendance.totalClasses}</b> Total Classes</span></div><p>{data.overallAttendance.attendancePercentage !== null && data.overallAttendance.attendancePercentage < data.overallAttendance.threshold ? `Below the ${data.overallAttendance.threshold}% attendance requirement.` : `Above the ${data.overallAttendance.threshold}% attendance requirement.`}</p></section><section className="courses-section"><div className="section-heading"><div><p className="eyebrow">ACADEMIC RECORD</p><h2>My Courses</h2></div><Link className="text-button" href="/student/courses">Manage courses</Link></div><div className="course-grid">{data.courses.map((course) => { const coursePercentage = course.attendancePercentage ?? 0; const statusClass = course.status === "Good standing" ? "status-good" : course.status === "At risk" ? "status-warning" : "status-neutral"; return <Link className="course-card" href="/student/courses" key={course.courseId}><div className="course-title"><div><strong>{course.courseCode}</strong><span>{course.courseTitle}</span></div><b>{coursePercentage}%</b></div><div className="course-meta"><span>{course.present + course.late} / {course.eligibleSessions || course.totalSessions} classes</span><span className={statusClass}>{course.status}</span></div><div className="course-bar"><span style={{ width: `${Math.min(100, Math.max(0, coursePercentage))}%` }} /></div></Link>; })}</div></section><section className="recent card"><div className="section-heading"><div><p className="eyebrow">ACTIVITY LOG</p><h2>Recent Attendance</h2></div></div>{data.recentAttendance.map((record) => <div className="attendance-row" key={record.id}><div className="record-course"><strong>{record.courseCode}</strong><span>{record.courseTitle}</span></div><div className="record-date"><strong>{record.date}</strong><span>{record.time}</span></div><span className="record-lecturer">{record.status}</span><span className={`status-badge status-${record.status.toLowerCase()}`}><i />{record.status}</span></div>)}{!data.recentAttendance.length && <p className="p-5 text-sm text-[var(--muted)]">No attendance records yet.</p>}</section><Notifications warnings={data.warnings} /></div><aside className="dashboard-aside"><ProfileCard student={data.student} /><Notifications warnings={data.warnings} /></aside></div>}
  </main>;
}
