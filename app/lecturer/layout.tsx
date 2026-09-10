"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";

const links = [
  ["Dashboard", "/lecturer/dashboard"],
  ["My Courses", "/lecturer/courses"],
  ["Complaints", "/lecturer/complaints"],
  ["Notifications", "/lecturer/notifications"],
  ["Settings", "/lecturer/settings"],
] as const;

export default function LecturerLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  if (pathname === "/lecturer/login") return children;

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--ink)] md:flex">
      <aside className="hidden w-64 shrink-0 flex-col bg-[var(--primary)] p-6 text-white md:flex">
        <Link href="/lecturer/dashboard" className="font-[Manrope] text-xl font-extrabold tracking-wide">ABUAD</Link>
        <p className="mt-1 text-xs text-[#f2dfe0]">Lecturer Portal</p>
        <nav className="mt-12 grid gap-2" aria-label="Lecturer navigation">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="rounded-md px-4 py-3 text-sm font-semibold text-[#f8ebeb] transition-colors hover:bg-white/10 hover:text-white">
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t border-white/15 pt-4">
          <button type="button" className="rounded-lg px-4 py-2 text-left text-sm font-medium text-red-300 transition-colors hover:bg-red-900/40 hover:text-white" onClick={() => signOut({ callbackUrl: "/lecturer/login" })}>
            Logout
          </button>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-[var(--outline-light)] bg-[var(--surface)] px-4 py-3 md:hidden">
          <Link href="/lecturer/dashboard" className="font-[Manrope] text-lg font-extrabold text-[var(--primary)]">ABUAD</Link>
          <button type="button" className="rounded-md border border-[var(--outline-light)] px-3 py-2 text-xl leading-none text-[var(--primary)]" onClick={() => setIsMobileOpen(true)} aria-label="Open lecturer navigation">
            ☰
          </button>
        </header>
        {isMobileOpen && <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Lecturer navigation">
          <button type="button" className="absolute inset-0 bg-black/40" onClick={() => setIsMobileOpen(false)} aria-label="Close lecturer navigation" />
          <aside className="relative flex h-full w-72 max-w-[85vw] flex-col bg-[#6b0d18] p-6 text-white shadow-xl">
            <div className="flex items-start justify-between">
              <div><p className="font-[Manrope] text-xl font-extrabold tracking-wide">ABUAD</p><p className="mt-1 text-xs text-[#f2dfe0]">Lecturer Portal</p></div>
              <button type="button" className="rounded-md px-2 py-1 text-2xl leading-none text-white/80 hover:bg-white/10 hover:text-white" onClick={() => setIsMobileOpen(false)} aria-label="Close lecturer navigation">×</button>
            </div>
            <nav className="mt-10 grid gap-2" aria-label="Lecturer navigation">
              {links.map(([label, href]) => <Link key={href} href={href} onClick={() => setIsMobileOpen(false)} className="rounded-md px-4 py-3 text-sm font-semibold text-[#f8ebeb] transition-colors hover:bg-white/10 hover:text-white">{label}</Link>)}
            </nav>
            <div className="mt-auto border-t border-white/20 pt-4">
              <p className="px-4 text-sm font-semibold">{session?.user?.name ?? "Lecturer"}</p>
              <p className="mt-1 px-4 text-xs text-[#e0c8c9]">{session?.user?.email ?? "Lecturer account"}</p>
              <button type="button" className="mt-4 rounded-lg px-4 py-2 text-sm font-medium text-red-200 transition-colors hover:bg-red-900/50 hover:text-white" onClick={() => signOut({ callbackUrl: "/lecturer/login" })}>Logout</button>
            </div>
          </aside>
        </div>}
        {children}
      </div>
    </div>
  );
}
