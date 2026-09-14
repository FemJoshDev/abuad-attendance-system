"use client";

import { useEffect, useState } from "react";

type Notification = { id: string; title: string; message: string; type: string; isRead: boolean; createdAt: string };

export default function StudentNotificationsPanel() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"ALL" | "UNREAD" | "READ">("ALL");
  async function load() { const response = await fetch("/api/notifications"); if (!response.ok) throw new Error(); setItems((await response.json()).data?.notifications ?? []); }
  useEffect(() => { const timer = window.setTimeout(() => { load().catch(() => setError("Unable to load notifications.")).finally(() => setLoading(false)); }, 0); return () => window.clearTimeout(timer); }, []);
  async function markRead(id: string) { const response = await fetch(`/api/notifications/${id}/read`, { method: "PATCH" }); if (!response.ok) { setError("Unable to update this notification."); return; } setItems((current) => current.map((item) => item.id === id ? { ...item, isRead: true } : item)); window.dispatchEvent(new Event("notifications-updated")); }
  async function markAllRead() { const response = await fetch("/api/notifications/read-all", { method: "PATCH" }); if (!response.ok) { setError("Unable to update notifications."); return; } setItems((current) => current.map((item) => ({ ...item, isRead: true }))); window.dispatchEvent(new Event("notifications-updated")); }
  const visible = items.filter((item) => filter === "ALL" || (filter === "UNREAD" ? !item.isRead : item.isRead));
  return <main className="dashboard-main"><div className="prototype-content"><div className="page-intro"><p className="eyebrow">STAY INFORMED</p><h2>Notifications</h2><p>Updates about attendance, complaints, courses, and your account.</p></div><div className="notification-toolbar"><div className="filter-tabs" role="tablist" aria-label="Notification filter">{(["ALL", "UNREAD", "READ"] as const).map((value) => <button type="button" key={value} role="tab" aria-selected={filter === value} className={filter === value ? "selected" : ""} onClick={() => setFilter(value)}>{value[0] + value.slice(1).toLowerCase()}</button>)}</div><button className="text-button" type="button" onClick={markAllRead} disabled={!items.some((item) => !item.isRead)}>Mark all as read</button></div>{error && <p className="form-error" role="alert">{error}</p>}{loading ? <div className="empty-state card"><h3>Loading notifications...</h3><p>Please wait while we load your updates.</p></div> : visible.length === 0 ? <div className="empty-state card"><h3>No notifications yet</h3><p>New attendance and complaint updates will appear here.</p></div> : <div className="full-notifications">{visible.map((item) => <button className={`full-notification card ${item.isRead ? "" : "unread"}`} key={item.id} type="button" onClick={() => !item.isRead && markRead(item.id)}><span className="notice-icon" aria-hidden="true">{item.type === "ATTENDANCE" ? "✓" : "i"}</span><span className="notice-copy"><strong>{item.title}</strong><span>{item.message}</span><small>{item.type} · {new Date(item.createdAt).toLocaleString()}</small></span>{!item.isRead && <i className="unread-dot" aria-label="Unread" />}</button>)}</div>}</div></main>;
}
