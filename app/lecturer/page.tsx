"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Course = { id: string; courseCode: string; courseTitle: string; studentCount: number; sessionCount: number; latestSession: { id: string; date: string; isOpen: boolean } | null };
type Dashboard = { assignedCourses: number; attendanceSessions: number; studentAttendancePercentage: number | null; courses: Course[] };

export default function LecturerDashboard() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { fetch("/api/lecturer/dashboard").then(async (response) => { if (!response.ok) throw new Error(); return response.json(); }).then((payload) => setData(payload.data)).catch(() => setError("Unable to load lecturer dashboard.")).finally(() => setLoading(false)); }, []);
  if (loading) return <main><h1>Lecturer Portal</h1><p>Loading dashboard...</p></main>;
  if (error) return <main><h1>Lecturer Portal</h1><p role="alert">{error}</p></main>;
  return <main><h1>Lecturer Portal</h1><nav aria-label="Lecturer navigation"><Link href="/lecturer/dashboard">Dashboard</Link> <Link href="/lecturer/courses">My Courses</Link> <Link href="/lecturer/complaints">Complaints</Link> <Link href="/notifications">Notifications</Link> <Link href="/settings">Settings</Link></nav><p>Assigned courses: {data?.assignedCourses ?? 0}</p><p>Attendance sessions: {data?.attendanceSessions ?? 0}</p><p>Average attendance: {data?.studentAttendancePercentage ?? "No data"}%</p><h2>My Courses</h2>{data?.courses.map((course) => <article key={course.id}><h3>{course.courseCode}: {course.courseTitle}</h3><p>{course.studentCount} students · {course.sessionCount} sessions</p><p>Latest session: {course.latestSession ? course.latestSession.isOpen ? "Open" : "Closed" : "None"}</p><Link href={`/lecturer/courses/${course.id}`}>Open attendance controls</Link></article>)}</main>;
}
