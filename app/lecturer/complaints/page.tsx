"use client";

import { useEffect, useState } from "react";

type Complaint = { id: string; subject: string; description: string; status: string; lecturerResponse: string | null };

export default function LecturerComplaintsPage() {
  const [items, setItems] = useState<Complaint[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  useEffect(() => { fetch("/api/lecturer/complaints").then(async (response) => { if (!response.ok) throw new Error(); return response.json(); }).then((payload) => setItems(payload.data ?? [])).catch(() => setError("Unable to load assigned complaints.")); }, []);
  async function respond(complaintId: string) { const response = responses[complaintId]?.trim(); if (!response) return; const result = await fetch("/api/lecturer/complaints", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ complaintId, response }) }); if (!result.ok) { setError("Unable to submit response."); return; } setItems((current) => current.map((item) => item.id === complaintId ? { ...item, lecturerResponse: response, status: "RETURNED_FOR_ADMIN_REVIEW" } : item)); setResponses((current) => ({ ...current, [complaintId]: "" })); }
  return <main className="mx-auto max-w-5xl px-6 py-8 md:px-10"><h1 className="font-[Manrope] text-3xl font-extrabold text-[var(--primary)]">Assigned Complaints</h1><p className="mt-2 text-sm text-[var(--muted)]">Only complaints explicitly assigned by an administrator appear here.</p>{error && <p className="mt-5 text-sm text-[var(--error)]" role="alert">{error}</p>}{items.map((item) => <article className="mt-5 rounded-lg border border-[var(--outline-light)] bg-[var(--surface)] p-5 shadow-sm" key={item.id}><div className="flex justify-between gap-4"><h2 className="font-[Manrope] text-xl font-bold">{item.subject}</h2><span className="text-xs font-bold text-[var(--muted)]">{item.status}</span></div><p className="mt-4 text-sm leading-6 text-[var(--muted)]">{item.description}</p>{item.lecturerResponse ? <p className="mt-4 text-sm"><strong>Response submitted:</strong> {item.lecturerResponse}</p> : <div className="mt-5"><label className="text-sm font-semibold" htmlFor={`response-${item.id}`}>Response for Admin</label><textarea className="mt-2 min-h-28 w-full rounded-md border border-[var(--outline-light)] bg-[var(--background)] p-3 text-sm" id={`response-${item.id}`} value={responses[item.id] ?? ""} onChange={(event) => setResponses((current) => ({ ...current, [item.id]: event.target.value }))} /><button className="mt-3 rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white" onClick={() => respond(item.id)} type="button">Send response to Admin</button></div>}</article>)}</main>;
}
