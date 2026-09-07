"use client";

import { useEffect, useState } from "react";

type Complaint = { id: string; subject: string; status: string; assignedLecturer: { id: string; fullName: string } | null };
export default function AdminComplaintsPage() {
  const [items, setItems] = useState<Complaint[]>([]);
  const [error, setError] = useState("");
  useEffect(() => { fetch("/api/admin/complaints").then(async (response) => { if (!response.ok) throw new Error(); return response.json(); }).then((payload) => setItems(payload.data ?? [])).catch(() => setError("Unable to load complaints.")); }, []);
  return <main><h1>Complaint Administration</h1><p>Review, assign, resolve, and close complaints without deleting their history.</p>{error && <p role="alert">{error}</p>}{items.map((item) => <article key={item.id}><h2>{item.subject}</h2><p>Status: {item.status}</p><p>Assigned lecturer: {item.assignedLecturer?.fullName ?? "Unassigned"}</p></article>)}</main>;
}