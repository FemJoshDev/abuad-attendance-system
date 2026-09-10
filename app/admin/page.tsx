"use client";

import { useEffect, useState } from "react";

type Dashboard = { students: number; lecturers: number; courses: number; sessions: number; openComplaints: number; unreadNotifications: number; recentSessions: Array<{ id: string; date: string; course: { courseCode: string; courseTitle: string }; _count: { records: number } }> };
export default function AdminDashboard() {
  const [data, setData] = useState<Dashboard | null>(null); const [error, setError] = useState("");
  useEffect(() => { fetch("/api/admin/dashboard").then(async (response) => { if (!response.ok) throw new Error(); return response.json(); }).then((payload) => setData(payload.data)).catch(() => setError("Unable to load admin dashboard.")).finally(() => undefined); }, []);
  if (error) return <main><h1>Admin Portal</h1><p role="alert">{error}</p></main>;
  if (!data) return <main><h1>Admin Portal</h1><p>Loading system overview...</p></main>;
  return <main><h1>Admin Portal</h1><section><p>Students: {data.students}</p><p>Lecturers: {data.lecturers}</p><p>Courses: {data.courses}</p><p>Attendance sessions: {data.sessions}</p><p>Open complaints: {data.openComplaints}</p><p>Unread notifications: {data.unreadNotifications}</p></section><h2>Recent attendance sessions</h2>{data.recentSessions.map((item) => <article key={item.id}><strong>{item.course.courseCode}</strong><span> {item.course.courseTitle} · {new Date(item.date).toLocaleDateString()} · {item._count.records} records</span></article>)}</main>;
}
