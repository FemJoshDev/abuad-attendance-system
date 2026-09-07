"use client";

import { useEffect, useState } from "react";

type Course = { id: string; courseCode: string; courseTitle: string; unit: number | null; studentCount: number; latestSession: { id: string; isOpen: boolean } | null };

export default function LecturerCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState("");
  useEffect(() => { fetch("/api/lecturer/courses").then(async (response) => { if (!response.ok) throw new Error(); return response.json(); }).then((payload) => setCourses(payload.data ?? [])).catch(() => setError("Unable to load assigned courses.")); }, []);
  return <main><h1>My Courses</h1><p>Only courses assigned to your lecturer account are shown.</p>{error && <p role="alert">{error}</p>}{courses.map((course) => <article key={course.id}><h2>{course.courseCode} · {course.courseTitle}</h2><p>{course.unit ?? "-"} units · {course.studentCount} enrolled · {course.latestSession?.isOpen ? "Attendance open" : "Attendance closed"}</p><a href={`/lecturer/courses/${course.id}`}>Manage session</a></article>)}</main>;
}