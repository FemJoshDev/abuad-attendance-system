"use client";

import { useEffect, useState } from "react";

type User = { id: string; fullName: string; email: string; role: string; isActive: boolean };
export default function AdminLecturersPage() {
  const [users, setUsers] = useState<User[]>([]);
  useEffect(() => { fetch("/api/admin/users?role=LECTURER").then((response) => response.json()).then((payload) => setUsers(payload.data?.users ?? [])); }, []);
  async function toggle(user: User) { const response = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id, isActive: !user.isActive }) }); if (response.ok) setUsers((items) => items.map((item) => item.id === user.id ? { ...item, isActive: !item.isActive } : item)); }
  return <main><h1>Lecturer Administration</h1><p>Manage active ABUAD lecturer accounts and course assignments.</p>{users.map((user) => <article key={user.id}><strong>{user.fullName}</strong><span> {user.email} · {user.isActive ? "Active" : "Inactive"}</span><button type="button" onClick={() => toggle(user)}>{user.isActive ? "Deactivate" : "Activate"}</button></article>)}</main>;
}
