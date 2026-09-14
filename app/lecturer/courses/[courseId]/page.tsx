"use client";

import { FormEvent, useState } from "react";
import { getBrowserLocation } from "@/src/lib/browser-location";

export default function LecturerCourseControls({ params }: { params: Promise<{ courseId: string }> }) {
  const [message, setMessage] = useState("");
  async function openSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const courseId = (await params).courseId;
    try {
      const location = await getBrowserLocation();
      const response = await fetch(`/api/lecturer/courses/${courseId}/sessions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date: form.get("date"), startTime: form.get("startTime"), endTime: form.get("endTime"), ...location }) });
      const payload = await response.json().catch(() => null);
      setMessage(response.ok ? "Attendance session opened." : payload?.error ?? "Unable to open attendance for this course.");
    } catch (reason) { setMessage(reason instanceof Error ? reason.message : "Unable to obtain lecturer location."); }
  }
  return <main><h1>Attendance Control</h1><p>Open attendance only for this assigned course. Student records are not administered here.</p><form onSubmit={openSession}><label>Date <input name="date" type="date" required /></label><label>Start <input name="startTime" type="time" required /></label><label>End <input name="endTime" type="time" /></label><button type="submit">Open Attendance</button></form>{message && <p role="status">{message}</p>}<p>Use the assigned session controls to close or reopen an existing session.</p></main>;
}