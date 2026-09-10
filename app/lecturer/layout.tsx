"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
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
        <button type="button" className="mt-auto rounded-md border border-white/25 px-4 py-3 text-left text-sm font-semibold text-[#f8ebeb] transition-colors hover:bg-white/10 hover:text-white" onClick={() => signOut({ callbackUrl: "/lecturer/login" })}>
          Logout
        </button>
      </aside>
      <div className="min-w-0 flex-1">
        <nav className="flex flex-wrap gap-2 border-b border-[var(--outline-light)] bg-[var(--surface)] p-4 md:hidden" aria-label="Lecturer navigation">
          {links.map(([label, href]) => <Link key={href} href={href} className="rounded-md border border-[var(--outline-light)] px-3 py-2 text-xs font-semibold text-[var(--primary)]">{label}</Link>)}
          <button type="button" className="rounded-md border border-[var(--primary)] px-3 py-2 text-xs font-semibold text-[var(--primary)]" onClick={() => signOut({ callbackUrl: "/lecturer/login" })}>Logout</button>
        </nav>
        {children}
      </div>
    </div>
  );
}
