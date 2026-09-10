"use client";

import { useEffect, useState } from "react";

type Notification = { id: string; title: string; message: string; type: string; isRead: boolean; createdAt: string };

export default function LecturerNotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [error, setError] = useState("");
  useEffect(() => { fetch("/api/notifications?limit=50").then(async (response) => { if (!response.ok) throw new Error(); return response.json(); }).then((payload) => { const notifications = payload.data?.notifications; setItems(Array.isArray(notifications) ? notifications : []); }).catch(() => setError("Unable to load notifications.")); }, []);
  return <main className="mx-auto max-w-5xl px-6 py-8 md:px-10"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--outline)]">Updates</p><h1 className="mt-2 font-[Manrope] text-3xl font-extrabold text-[var(--primary)]">Notifications</h1><p className="mt-2 text-sm text-[var(--muted)]">System alerts and administrator referrals for your lecturer account.</p>{error && <p className="mt-5 text-sm text-[var(--error)]" role="alert">{error}</p>}<div className="mt-8 grid gap-3">{items.map((item) => <article className={`rounded-lg border bg-[var(--surface)] p-4 ${item.isRead ? "border-[var(--outline-light)]" : "border-[var(--secondary)]"}`} key={item.id}><div className="flex justify-between gap-4"><h2 className="font-semibold">{item.title}</h2><time className="text-xs text-[var(--outline)]">{new Date(item.createdAt).toLocaleDateString()}</time></div><p className="mt-2 text-sm text-[var(--muted)]">{item.message}</p></article>)}</div>{!items.length && !error && <p className="mt-8 text-sm text-[var(--muted)]">No notifications yet.</p>}</main>;
}
