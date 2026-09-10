"use client";

import { useEffect, useState } from "react";

type Complaint = { id: string; subject: string; priority: string; description: string; status: "PENDING" | "IN_REVIEW" | "RESOLVED" | "CLOSED"; lecturerResponse: string | null; createdAt: string; user: { fullName: string; email: string; matricNumber: string | null }; assignedLecturer: { id: string; fullName: string } | null };
type Lecturer = { id: string; fullName: string; email: string };
const statuses = ["ALL", "PENDING", "IN_REVIEW", "RESOLVED", "CLOSED"] as const;

export default function AdminComplaintsPage() {
  const [items, setItems] = useState<Complaint[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [status, setStatus] = useState<(typeof statuses)[number]>("ALL");
  const [error, setError] = useState("");

  async function load(selectedStatus = status) {
    const query = selectedStatus === "ALL" ? "" : `?status=${selectedStatus}`;
    const response = await fetch(`/api/admin/complaints${query}`);
    if (!response.ok) throw new Error();
    const payload = await response.json();
    setItems(payload.data ?? []);
  }

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/complaints").then(async (response) => { if (!response.ok) throw new Error(); return response.json(); }),
      fetch("/api/admin/users?role=LECTURER&limit=100").then(async (response) => { if (!response.ok) throw new Error(); return response.json(); }),
    ]).then(([complaints, users]) => { setItems(complaints.data ?? []); setLecturers(users.data?.users ?? []); }).catch(() => setError("Unable to load complaint administration."));
  }, []);

  async function assign(complaintId: string, lecturerId: string) {
    const response = await fetch("/api/admin/complaints/assign", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ complaintId, lecturerId }) });
    if (!response.ok) { setError("Unable to assign this complaint."); return; }
    await load();
  }

  async function updateStatus(complaintId: string, nextStatus: string) {
    const response = await fetch(`/api/admin/complaints/${complaintId}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: nextStatus }) });
    if (!response.ok) { setError("That status transition is not available."); return; }
    await load();
  }

  return <main className="min-h-screen bg-[var(--background)] px-5 py-8 text-[var(--ink)] md:px-10"><div className="mx-auto max-w-7xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--outline)]">Student support</p><h1 className="mt-2 font-[Manrope] text-3xl font-extrabold text-[var(--primary)]">Complaint triage</h1><p className="mt-2 text-sm text-[var(--muted)]">Assign, review, and resolve student complaints without losing the conversation history.</p><div className="mt-7 flex flex-wrap gap-2">{statuses.map((item) => <button className={`rounded-md px-3 py-2 text-sm font-semibold ${status === item ? "bg-[var(--primary)] text-white" : "border border-[var(--outline-light)] bg-[var(--surface)] text-[var(--primary)]"}`} key={item} type="button" onClick={() => { setStatus(item); load(item).catch(() => setError("Unable to load complaints.")); }}>{item === "IN_REVIEW" ? "In review" : item[0] + item.slice(1).toLowerCase()}</button>)}</div>{error && <p className="mt-4 text-sm text-red-700" role="alert">{error}</p>}<div className="mt-6 grid gap-4">{items.map((item) => <article className="rounded-lg border border-[var(--outline-light)] bg-[var(--surface)] p-5 shadow-sm" key={item.id}><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-[Manrope] text-lg font-bold text-[var(--primary)]">{item.subject}</h2><span className="rounded-full bg-[var(--surface-low)] px-2 py-1 text-xs font-bold">{item.priority}</span></div><p className="mt-1 text-sm text-[var(--muted)]">{item.user.fullName} · {item.user.matricNumber ?? item.user.email} · {new Date(item.createdAt).toLocaleDateString()}</p></div><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">{item.status}</span></div><p className="mt-4 text-sm leading-6 text-[var(--muted)]">{item.description}</p>{item.lecturerResponse && <div className="mt-4 rounded-md bg-[var(--surface-low)] p-4"><p className="text-xs font-bold uppercase tracking-wide text-[var(--outline)]">Lecturer response</p><p className="mt-2 text-sm">{item.lecturerResponse}</p></div>}<div className="mt-5 flex flex-wrap items-center gap-3 border-t border-[var(--outline-light)] pt-4"><label className="text-xs font-bold uppercase tracking-wide text-[var(--outline)]" htmlFor={`lecturer-${item.id}`}>Assign</label><select id={`lecturer-${item.id}`} className="rounded-md border border-[var(--outline-light)] bg-[var(--surface)] px-3 py-2 text-sm" value={item.assignedLecturer?.id ?? ""} onChange={(event) => event.target.value && assign(item.id, event.target.value)}><option value="">{item.assignedLecturer?.fullName ?? "Select lecturer"}</option>{lecturers.map((lecturer) => <option key={lecturer.id} value={lecturer.id}>{lecturer.fullName}</option>)}</select><select className="rounded-md border border-[var(--outline-light)] bg-[var(--surface)] px-3 py-2 text-sm" value={item.status} onChange={(event) => updateStatus(item.id, event.target.value)}><option value={item.status}>{item.status}</option>{item.status === "PENDING" && <option value="IN_REVIEW">IN_REVIEW</option>}{(item.status === "PENDING" || item.status === "IN_REVIEW") && <><option value="RESOLVED">RESOLVED</option><option value="CLOSED">CLOSED</option></>}</select></div></article>)}{!items.length && <p className="rounded-lg border border-dashed border-[var(--outline-light)] p-8 text-center text-sm text-[var(--muted)]">No complaints in this status.</p>}</div></div></main>;
}
