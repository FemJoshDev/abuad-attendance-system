"use client";

import { useEffect, useState } from "react";

type Dashboard = { students: number; lecturers: number; courses: number; sessions: number; openComplaints: number; unreadNotifications: number; recentSessions: Array<{ id: string; date: string; course: { courseCode: string; courseTitle: string }; _count: { records: number } }> };
export default function AdminDashboard() {
  const [data, setData] = useState<Dashboard | null>(null); const [error, setError] = useState("");
  useEffect(() => { fetch("/api/admin/dashboard").then(async (response) => { if (!response.ok) throw new Error(); return response.json(); }).then((payload) => setData(payload.data)).catch(() => setError("Unable to load admin dashboard.")).finally(() => undefined); }, []);
  if (error) return <main><h1>Admin Portal</h1><p role="alert">{error}</p></main>;
  if (!data) return <main><h1>Admin Portal</h1><p>Loading system overview...</p></main>;
  return <main><h1>Admin Portal</h1><nav aria-label="Admin navigation"><a href="/admin/dashboard">Dashboard</a> <a href="/admin/students">Students</a> <a href="/admin/lecturers">Lecturers</a> <a href="/admin/attendance">Attendance</a> <a href="/admin/complaints">Complaints</a> <a href="/admin">Courses and Enrollment</a> <a href="/settings">Settings</a></nav><section><p>Students: {data.students}</p><p>Lecturers: {data.lecturers}</p><p>Courses: {data.courses}</p><p>Attendance sessions: {data.sessions}</p><p>Open complaints: {data.openComplaints}</p><p>Unread notifications: {data.unreadNotifications}</p></section><h2>Recent attendance sessions</h2>{data.recentSessions.map((item) => <article key={item.id}><strong>{item.course.courseCode}</strong><span> {item.course.courseTitle} · {new Date(item.date).toLocaleDateString()} · {item._count.records} records</span></article>)}</main>;
}
