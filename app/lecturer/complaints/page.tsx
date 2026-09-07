"use client";

import { useEffect, useState } from "react";

type Complaint = { id: string; subject: string; description: string; status: string; lecturerResponse: string | null };

export default function LecturerComplaintsPage() {
  const [items, setItems] = useState<Complaint[]>([]);
  const [error, setError] = useState("");
  useEffect(() => { fetch("/api/lecturer/complaints").then(async (response) => { if (!response.ok) throw new Error(); return response.json(); }).then((payload) => setItems(payload.data ?? [])).catch(() => setError("Unable to load assigned complaints.")); }, []);
  async function respond(complaintId: string) { const response = window.prompt("Response to admin"); if (!response?.trim()) return; const result = await fetch("/api/lecturer/complaints", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ complaintId, response }) }); if (!result.ok) { setError("Unable to submit response."); return; } setItems((current) => current.map((item) => item.id === complaintId ? { ...item, lecturerResponse: response, status: "IN_REVIEW" } : item)); }
  return <main><h1>Assigned Complaints</h1><p>Only complaints explicitly assigned by an administrator appear here.</p>{error && <p role="alert">{error}</p>}{items.map((item) => <article key={item.id}><h2>{item.subject}</h2><p>{item.description}</p><p>Status: {item.status}</p><p>{item.lecturerResponse ? `Response submitted: ${item.lecturerResponse}` : "No response submitted"}</p>{!item.lecturerResponse && <button type="button" onClick={() => respond(item.id)}>Respond to Admin</button>}</article>)}</main>;
}