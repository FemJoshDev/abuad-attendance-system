"use client";

import { useEffect, useState } from "react";

type Profile = { fullName: string; email: string; role: string; isActive: boolean };
export default function AdminSettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [message, setMessage] = useState("");
  useEffect(() => { fetch("/api/settings/profile").then((response) => response.json()).then((payload) => setProfile(payload.data ?? null)).catch(() => setMessage("Unable to load administrator profile.")); }, []);
  return <main className="min-h-screen bg-[var(--background)] px-5 py-8 text-[var(--ink)] md:px-10"><div className="mx-auto max-w-4xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--outline)]">Configuration</p><h1 className="mt-2 font-[Manrope] text-3xl font-extrabold text-[var(--primary)]">Admin settings</h1><p className="mt-2 text-sm text-[var(--muted)]">Review your administrator account and system access.</p>{message && <p className="mt-5 text-sm text-red-700" role="alert">{message}</p>}<section className="mt-8 rounded-lg border border-[var(--outline-light)] bg-[var(--surface)] p-6 shadow-sm"><h2 className="font-[Manrope] text-xl font-bold">Administrator profile</h2>{profile ? <dl className="mt-5 grid gap-4 sm:grid-cols-2"><div><dt className="text-xs font-bold uppercase tracking-wide text-[var(--outline)]">Name</dt><dd className="mt-1">{profile.fullName}</dd></div><div><dt className="text-xs font-bold uppercase tracking-wide text-[var(--outline)]">Email</dt><dd className="mt-1">{profile.email}</dd></div><div><dt className="text-xs font-bold uppercase tracking-wide text-[var(--outline)]">Role</dt><dd className="mt-1">{profile.role}</dd></div><div><dt className="text-xs font-bold uppercase tracking-wide text-[var(--outline)]">Account</dt><dd className="mt-1">{profile.isActive ? "Active" : "Inactive"}</dd></div></dl> : <p className="mt-4 text-sm text-[var(--muted)]">Loading profile...</p>}</section></div></main>;
}
