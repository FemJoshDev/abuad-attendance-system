"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

const links = [
  ["Dashboard", "▦", "/student/dashboard"],
  ["My Courses", "▤", "/student/courses"],
  ["Notifications", "♧", "/student/notifications"],
  ["Complaints", "△", "/student/complaints"],
  ["Settings", "⚙", "/student/settings"],
] as const;

function Brand({ compact = false }: { compact?: boolean }) {
  return <div className={`brand ${compact ? "brand-compact" : ""}`}><div className="crest">A</div><div><strong>ABUAD</strong><span>{compact ? "Attendance" : "Attendance Management System"}</span></div></div>;
}

export default function StudentLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const name = session?.user?.name ?? "Student";
  const initials = name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  useEffect(() => {
    async function refreshCount() { const response = await fetch("/api/notifications/unread-count"); if (response.ok) setUnreadCount((await response.json()).data?.count ?? 0); }
    void refreshCount();
    const timer = window.setInterval(() => void refreshCount(), 30000);
    window.addEventListener("notifications-updated", refreshCount);
    return () => { window.clearInterval(timer); window.removeEventListener("notifications-updated", refreshCount); };
  }, []);

  if (pathname === "/student/login") return children;

  const navigation = (mobile = false) => <nav className={mobile ? "mobile-nav" : "sidebar"} id={mobile ? "student-navigation" : undefined} aria-label="Student navigation">
    {mobile && <button className="drawer-close" type="button" onClick={() => setIsMobileOpen(false)} aria-label="Close navigation">×</button>}
    <Brand />
    <div className="nav-links">
      {links.map(([label, icon, href]) => <Link key={href} href={href} onClick={() => setIsMobileOpen(false)} className={`nav-item ${pathname === href ? "active" : ""}`}><span className="icon" aria-hidden="true">{icon}</span><span>{label}</span>{label === "Notifications" && unreadCount > 0 && <em className="nav-badge">{unreadCount}</em>}</Link>)}
    </div>
    <div className="sidebar-bottom">
      <div className="mini-profile"><div className="avatar avatar-small" aria-hidden="true">{initials}</div><div><strong>{name}</strong><span>{session?.user?.email ?? "Student account"}</span></div></div>
      <button className="logout" type="button" onClick={() => void signOut({ callbackUrl: "/student/login" })}><span className="icon" aria-hidden="true">↪</span> Logout</button>
    </div>
  </nav>;

  return <div className="dashboard-shell">
    {navigation()}
    <div className="min-w-0 flex-1">
      <header className="mobile-header">
        <button className="icon-button" type="button" onClick={() => setIsMobileOpen(true)} aria-label="Open navigation" aria-expanded={isMobileOpen} aria-controls="student-navigation"><span className="icon" aria-hidden="true">☰</span></button>
        <Link href="/student/dashboard" aria-label="ABUAD student dashboard"><Brand compact /></Link>
        <Link className="icon-button" href="/student/notifications" aria-label="View notifications"><span className="icon" aria-hidden="true">♧</span></Link>
      </header>
      {isMobileOpen && <><button className="drawer-scrim" type="button" onClick={() => setIsMobileOpen(false)} aria-label="Close navigation" /><div role="dialog" aria-modal="true" aria-label="Student navigation">{navigation(true)}</div></>}
      {children}
    </div>
  </div>;
}
