"use client";

import { FormEvent, useEffect, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { academicData, attendanceNotifications, courses, student } from "@/mock/academicData";
import type { Course, Semester } from "@/mock/academicData";
import type { CourseSummary } from "@/src/types/course";
import ComplaintPanel from "@/app/complaints/ComplaintPanel";
import SettingsPanel from "@/app/settings/SettingsPanel";

type DashboardApiCourse = {
  courseId: string;
  courseCode: string;
  courseTitle: string;
  totalSessions: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attended: number;
  eligibleSessions: number;
  attendancePercentage: number | null;
  threshold: number;
  lowAttendance: boolean;
  status: "Good standing" | "At risk" | "No data";
};

type DashboardApiData = {
  student: {
    id: string;
    name: string;
    email: string;
    matricNumber: string | null;
  };
  overallAttendance: {
    present: number;
    absent: number;
    late: number;
    excused: number;
    totalClasses: number;
    attendedClasses: number;
    attendancePercentage: number | null;
    threshold: number;
  };
  courses: DashboardApiCourse[];
  recentAttendance: Array<{
    id: string;
    courseCode: string;
    courseTitle: string;
    status: string;
    date: string;
    time: string;
  }>;
  warnings: Array<{
    courseId: string;
    courseCode: string;
    courseTitle: string;
    attendancePercentage: number;
    threshold: number;
    status: "LOW_ATTENDANCE";
  }>;
};

type IconName = "grid" | "book" | "bell" | "alert" | "settings" | "logout" | "menu" | "close" | "eye" | "eye-off";
type ApiNotification = { id: string; title: string; message: string; type: "ATTENDANCE" | "COURSE" | "SYSTEM" | "WARNING"; isRead: boolean; createdAt: string };
const icons: Record<IconName, string> = { grid: "▦", book: "▤", bell: "♧", alert: "△", settings: "⚙", logout: "↪", menu: "☰", close: "×", eye: "◉", "eye-off": "⊘" };
function Icon({ name }: { name: IconName }) { return <span className={`icon icon-${name}`} aria-hidden="true">{icons[name]}</span>; }
function Brand({ compact = false }: { compact?: boolean }) { return <div className={`brand ${compact ? "brand-compact" : ""}`}><div className="crest">A</div><div><strong>ABUAD</strong><span>{compact ? "Attendance" : "Attendance Management System"}</span></div></div>; }

function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState(""); const [password, setPassword] = useState(""); const [showPassword, setShowPassword] = useState(false); const [loading, setLoading] = useState(false); const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!username.trim() || !password.trim()) {
      setError("Enter your email or matric number and password to continue.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: username.trim(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password.");
      } else {
        onLogin();
      }
    } catch {
      setError("Unable to sign in right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return <main className="login-page"><div className="login-photo" aria-hidden="true" /><div className="login-overlay" aria-hidden="true" /><section className="login-card" aria-label="Student login"><Brand /><div className="login-heading"><p className="eyebrow">STUDENT PORTAL</p><h1>ABUAD Attendance<br />Management System</h1><p>College of Medicine &amp; Health Sciences</p></div><form onSubmit={submit} noValidate><label htmlFor="username">Email or Matric Number</label><input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. joshua.ojo@abuad.edu.ng or ABUAD/20/4521" autoComplete="username" /><label htmlFor="password">Password</label><div className="password-field"><input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" /><button type="button" className="input-action" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}><Icon name={showPassword ? "eye-off" : "eye"} /></button></div>{error && <p className="form-error" role="alert">{error}</p>}<button className="login-button" type="submit" disabled={loading}>{loading ? "Signing in..." : "Login"}</button><button type="button" className="forgot" onClick={() => setError("Please contact your college administrator to reset your password.")}>Forgot password?</button></form><div className="login-footer"><p>Developed by <strong>OJO JOSHUA OLUWAPELUMI</strong><span className="developer-nickname">PilotDev✈️ @2026</span></p><p>Courtesy of the Dean,<br />College of Medicine &amp; Health Sciences</p></div></section></main>;
}

const navItems: { label: string; icon: IconName; path: string }[] = [{ label: "Dashboard", icon: "grid", path: "/student/dashboard" }, { label: "My Courses", icon: "book", path: "/courses" }, { label: "Notifications", icon: "bell", path: "/notifications" }, { label: "Complaints", icon: "alert", path: "/complaints" }, { label: "Settings", icon: "settings", path: "/settings" }];
function navigate(path: string) { window.history.pushState({}, "", path); window.dispatchEvent(new PopStateEvent("popstate")); }
function Navigation({ mobile = false, onClose, onLogout, currentPath = "/student/dashboard", unreadCount = 0 }: { mobile?: boolean; onClose?: () => void; onLogout: () => void; currentPath?: string; unreadCount?: number }) { return <nav className={mobile ? "mobile-nav" : "sidebar"} aria-label="Student navigation">{mobile && <button className="drawer-close" onClick={onClose} aria-label="Close navigation"><Icon name="close" /></button>}<Brand /><div className="nav-links">{navItems.map((item) => <button className={`nav-item ${currentPath === item.path || (item.path === "/settings" && currentPath.startsWith("/settings/")) ? "active" : ""}`} key={item.label} onClick={() => { navigate(item.path); onClose?.(); }} type="button"><Icon name={item.icon} /><span>{item.label}</span>{item.label === "Notifications" && unreadCount > 0 && <em className="nav-badge">{unreadCount}</em>}</button>)}</div><div className="sidebar-bottom"><div className="mini-profile"><div className="avatar avatar-small">JA</div><div><strong>{student.name}</strong><span>{student.matricNumber}</span></div></div><button className="logout" onClick={onLogout} type="button"><Icon name="logout" /> Logout</button></div></nav>; }
function Avatar({ large = false }: { large?: boolean }) { return <div className={`avatar ${large ? "avatar-large" : ""}`} aria-label={`${student.name} profile photo`}>JA</div>; }
function ProfileCard() { return <section className="profile-card card"><div className="profile-top"><div><p className="eyebrow">STUDENT PROFILE</p><h2>{student.name}</h2><p className="matric">Matric No: {student.matricNumber}</p></div><button className="avatar-button" type="button" aria-label="Change profile image"><Avatar large /><span>Change photo</span></button></div><div className="profile-details"><div><span>Level</span><strong>{student.level}</strong></div><div><span>Department</span><strong>{student.department}</strong></div><div><span>College</span><strong>{student.college}</strong></div></div></section>; }
function OverallCard({ percentage, present, total, warning }: { percentage: number | null; present: number; total: number; warning: string }) {
  const display = percentage ?? 0;
  return <section className="overall-card"><div className="card-kicker">SEMESTER OVERVIEW</div><h2>Overall Attendance</h2><div className="attendance-number"><strong>{display}</strong><span>%</span></div><div className="overall-bar"><span style={{ width: `${Math.min(100, Math.max(0, display))}%` }} /></div><div className="overall-foot"><span><b>{present}</b> Present</span><span><b>{total}</b> Total Classes</span></div><p>{warning}</p></section>;
}
function CourseCard({ course }: { course: DashboardApiCourse }) {
  const percentage = course.attendancePercentage ?? 0;
  const status = course.status === "Good standing" ? "status-good" : course.status === "At risk" ? "status-warning" : "status-neutral";

  return <button type="button" className="course-card" onClick={() => window.alert(`${course.courseCode} attendance details are loaded from the database.`)}><div className="course-title"><div><strong>{course.courseCode}</strong><span>{course.courseTitle}</span></div><b>{percentage}%</b></div><div className="course-meta"><span>{course.present + course.late} / {course.eligibleSessions || course.totalSessions} classes</span><span className={status}>{course.status}</span></div><div className="course-bar"><span style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }} /></div></button>;
}
function RecentAttendance({ items }: { items: DashboardApiData["recentAttendance"] }) {
  return <section className="recent card"><div className="section-heading"><div><p className="eyebrow">ACTIVITY LOG</p><h2>Recent Attendance</h2></div><button className="text-button" type="button">View all</button></div><div className="attendance-list">{items.map((record) => <div className="attendance-row" key={record.id}><div className="record-course"><strong>{record.courseCode}</strong><span>{record.courseTitle}</span></div><div className="record-date"><strong>{record.date}</strong><span>{record.time}</span></div><span className="record-lecturer">{record.status}</span><span className={`status-badge status-${record.status.toLowerCase()}`}><i />{record.status}</span></div>)}</div></section>;
}
function Notifications({ warnings }: { warnings: DashboardApiData["warnings"] }) {
  const notices = warnings.length > 0 ? warnings.map((warning) => ({
    kind: "warning",
    text: `${warning.courseCode}: ${warning.attendancePercentage}% attendance is below ${warning.threshold}%`,
    time: "Now",
  })) : attendanceNotifications;

  return <section className="notifications card"><div className="section-heading"><div><p className="eyebrow">STAY INFORMED</p><h2>Attendance Notifications</h2></div><span className="notification-count">{notices.length}</span></div>{notices.map((notification, index) => <div className="notification-row" key={`${notification.text}-${index}`}><span className={`notification-dot dot-${notification.kind}`} /><p>{notification.text}</p><time>{notification.time}</time></div>)}</section>;
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [semester, setSemester] = useState<Semester>("First Semester");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [data, setData] = useState<DashboardApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");
        const response = await fetch("/api/dashboard");
        if (!response.ok) {
          throw new Error("Unable to load dashboard.");
        }

        const payload = await response.json();
        setData(payload.data ?? null);
      } catch {
        setError("Unable to load your attendance dashboard right now.");
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const courseList = data?.courses ?? [];
  const overall = data?.overallAttendance;
  const recent = data?.recentAttendance ?? [];
  const warnings = data?.warnings ?? [];

  return <div className="dashboard-shell"><Navigation onLogout={onLogout} /><header className="mobile-header"><button className="icon-button" onClick={() => setDrawerOpen(true)} aria-label="Open navigation"><Icon name="menu" /></button><Brand compact /><button className="icon-button" aria-label="View notifications"><Icon name="bell" /><i /></button></header>{drawerOpen && <><button className="drawer-scrim" onClick={() => setDrawerOpen(false)} aria-label="Close navigation" /><Navigation mobile onClose={() => setDrawerOpen(false)} onLogout={onLogout} /></>}<main className="dashboard-main"><header className="dashboard-header"><div><p className="eyebrow">STUDENT PORTAL</p><h1>Welcome, {data?.student?.name ?? student.firstName}</h1><p>{student.college}</p></div><div className="header-profile"><button className="header-notification" aria-label="View notifications" type="button"><Icon name="bell" /><i /></button><Avatar /><span>{data?.student?.name ?? student.name}</span><span className="chevron">⌄</span></div></header><div className="dashboard-grid"><div className="welcome-column"><div className="mobile-welcome"><p className="eyebrow">STUDENT PORTAL</p><h1>Welcome, {data?.student?.name ? data.student.name.split(" ")[0] : student.firstName}.</h1><p>Here is your attendance overview for this semester.</p></div><ProfileCard />{loading ? <div className="empty-state card"><span className="empty-icon">○</span><h3>Loading attendance...</h3><p>Please wait while we calculate your statistics.</p></div> : error ? <div className="empty-state card"><span className="empty-icon">○</span><h3>Unable to load dashboard</h3><p>{error}</p></div> : <><OverallCard percentage={overall?.attendancePercentage ?? null} present={overall?.attendedClasses ?? 0} total={overall?.totalClasses ?? 0} warning={overall && overall.attendancePercentage !== null && overall.attendancePercentage < overall.threshold ? "Below the 75% attendance requirement." : "Above the 75% attendance requirement."} /><section className="courses-section"><div className="section-heading"><div><p className="eyebrow">ACADEMIC RECORD</p><h2>My Courses</h2></div><div className="semester-switcher" role="tablist" aria-label="Select semester">{(["First Semester", "Second Semester"] as Semester[]).map((item) => <button key={item} type="button" role="tab" aria-selected={semester === item} className={semester === item ? "selected" : ""} onClick={() => setSemester(item)}>{item}</button>)}</div></div><div className="course-grid">{courseList.filter((course) => course.courseTitle.toLowerCase().includes(semester === "First Semester" ? "" : "")).map((course) => <CourseCard key={course.courseId} course={course} />)}</div></section><RecentAttendance items={recent} /><Notifications warnings={warnings} /></>}</div><aside className="dashboard-aside"><ProfileCard /><Notifications warnings={warnings} /></aside></div></main></div>;
}

const prototypeCourses = [...courses["First Semester"], ...courses["Second Semester"]];
function AppFrame({ path, onLogout, unreadCount, children }: { path: string; onLogout: () => void; unreadCount: number; children: React.ReactNode }) { const [drawerOpen, setDrawerOpen] = useState(false); return <div className="dashboard-shell"><Navigation currentPath={path} unreadCount={unreadCount} onLogout={onLogout} /><header className="mobile-header"><button className="icon-button" onClick={() => setDrawerOpen(true)} aria-label="Open navigation"><Icon name="menu" /></button><Brand compact /><button className="icon-button" aria-label="View notifications" onClick={() => navigate("/notifications")}><Icon name="bell" /><i /></button></header>{drawerOpen && <><button className="drawer-scrim" onClick={() => setDrawerOpen(false)} aria-label="Close navigation" /><Navigation mobile currentPath={path} unreadCount={unreadCount} onClose={() => setDrawerOpen(false)} onLogout={onLogout} /></>}<main className="dashboard-main"><header className="dashboard-header"><div><p className="eyebrow">STUDENT PORTAL</p><h1>{path === "/courses" ? "My Courses" : path === "/notifications" ? "Notifications" : path === "/complaints" ? "Complaints & Support" : "Settings"}</h1><p>{student.college}</p></div><div className="header-profile"><button className="header-notification" aria-label="View notifications" type="button" onClick={() => navigate("/notifications")}><Icon name="bell" /><i /></button><Avatar /><span>{student.name}</span><span className="chevron">⌄</span></div></header>{children}</main></div>; }
function PageIntro({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) { return <div className="page-intro"><p className="eyebrow">{eyebrow}</p><h2>{title}</h2><p>{text}</p></div>; }
function CoursesPage() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<CourseSummary | null>(null);
  const [courseItems, setCourseItems] = useState<CourseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCourses() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/courses");
        if (!response.ok) {
          throw new Error("Unable to load your courses.");
        }

        const payload = await response.json();
        const items = Array.isArray(payload.data)
          ? payload.data.map((course: Record<string, any>) => ({
              id: String(course.id ?? ""),
              code: String(course.code ?? course.courseCode ?? ""),
              title: String(course.title ?? course.courseTitle ?? ""),
              description: String(course.description ?? ""),
              lecturer: String(course.lecturer ?? "Course Instructor"),
              learners: Number(course.learners ?? 0),
              resources: Number(course.resources ?? 0),
              updated: String(course.updated ?? new Date().toISOString()),
              present: Number(course.present ?? 0),
              total: Number(course.total ?? 0),
              status: course.status ?? "Good standing",
              unit: Number(course.unit ?? 0),
              semester: String(course.semester ?? ""),
              academicSession: String(course.academicSession ?? ""),
            }))
          : [];

        setCourseItems(items);
      } catch {
        setError("Unable to load your courses right now.");
        setCourseItems([]);
      } finally {
        setLoading(false);
      }
    }

    loadCourses();
  }, []);

  const visible = courseItems.filter((course) => `${course.code} ${course.title}`.toLowerCase().includes(query.toLowerCase()));

  return <div className="prototype-content"><PageIntro eyebrow="ACADEMIC RECORD" title="My Courses" text="Keep track of your current courses, learning progress, and resources in one place." />{selected ? <section className="detail-panel card"><button className="text-button" onClick={() => setSelected(null)} type="button">← Back to courses</button><p className="eyebrow">{selected.code}</p><h2>{selected.title}</h2><p>{selected.description}</p><div className="stats-grid"><div><span>Unit</span><strong>{selected.unit ?? 0}</strong></div><div><span>Semester</span><strong>{selected.semester ?? "—"}</strong></div><div><span>Academic Session</span><strong>{selected.academicSession ?? "—"}</strong></div></div><div className="progress-label"><span>Course progress</span><strong>{Math.min(100, Math.max(0, selected.total ? Math.round((selected.present / selected.total) * 100) : 0))}%</strong></div><div className="progress-track"><span style={{ width: `${Math.min(100, Math.max(0, selected.total ? Math.round((selected.present / selected.total) * 100) : 0))}%` }} /></div><button className="primary-button" type="button" onClick={() => window.alert("Course materials are ready for review.")}>Open materials</button></section> : <><div className="toolbar card"><label htmlFor="course-search">Search courses</label><input id="course-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by code or course name" /></div>{loading ? <div className="empty-state card"><span className="empty-icon">○</span><h3>Loading courses...</h3><p>Please wait while we load your enrolled courses.</p></div> : error ? <div className="empty-state card"><span className="empty-icon">○</span><h3>Unable to load courses</h3><p>{error}</p></div> : visible.length === 0 ? <div className="empty-state card"><span className="empty-icon">○</span><h3>No courses found</h3><p>You are not currently enrolled in any courses.</p></div> : <div className="prototype-course-grid">{visible.map((course) => <article className="prototype-course card" key={course.id}><div className="course-title"><div><strong>{course.code}</strong><h3>{course.title}</h3></div><span className="course-chip">{course.unit ?? 0} units</span></div><p>{course.description}</p><div className="course-detail"><span>Semester<strong>{course.semester ?? "—"}</strong></span><span>Session<strong>{course.academicSession ?? "—"}</strong></span></div><div className="course-bar"><span style={{ width: `${Math.min(100, Math.max(0, course.total ? Math.round((course.present / course.total) * 100) : 0))}%` }} /></div><button className="text-button" type="button" onClick={() => setSelected(course)}>View details</button></article>)}</div>}</>}{selected && <div style={{ marginTop: 16 }} />}</div>;
}
type Notice = ApiNotification;
function EmptyState({ title, text }: { title: string; text: string }) { return <div className="empty-state card"><span className="empty-icon">○</span><h3>{title}</h3><p>{text}</p></div>; }
function NotificationsPage({ items, setItems, setUnreadCount }: { items: Notice[]; setItems: React.Dispatch<React.SetStateAction<Notice[]>>; setUnreadCount: React.Dispatch<React.SetStateAction<number>> }) { const [filter, setFilter] = useState("All"); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const filtered = items.filter((item) => filter === "All" || (filter === "Unread" && !item.isRead) || (filter === "Course" && item.type === "COURSE") || (filter === "System" && item.type === "SYSTEM"));
  useEffect(() => { fetch("/api/notifications").then(async (response) => { if (!response.ok) throw new Error(); return response.json(); }).then((payload) => { setItems(payload.data?.notifications ?? []); setUnreadCount(payload.data?.unreadCount ?? 0); }).catch(() => setError("Unable to load your notifications right now.")).finally(() => setLoading(false)); }, [setItems, setUnreadCount]);
  async function markRead(id: string) { const response = await fetch(`/api/notifications/${id}/read`, { method: "PATCH" }); if (!response.ok) return; setItems((current) => current.map((item) => item.id === id ? { ...item, isRead: true } : item)); setUnreadCount((count) => Math.max(0, count - 1)); }
  async function markAllRead() { const response = await fetch("/api/notifications/read-all", { method: "PATCH" }); if (!response.ok) return; setItems((current) => current.map((item) => ({ ...item, isRead: true }))); setUnreadCount(0); }
  return <div className="prototype-content"><PageIntro eyebrow="STAY INFORMED" title="Notifications" text="Stay updated with your latest activities and important announcements." /><div className="notification-toolbar"><div className="filter-tabs">{["All", "Unread", "Course", "System"].map((item) => <button className={filter === item ? "selected" : ""} key={item} onClick={() => setFilter(item)} type="button">{item}</button>)}</div><button className="text-button" onClick={markAllRead} type="button">Mark all as read</button></div>{loading ? <EmptyState title="Loading notifications..." text="Please wait while we load your notifications." /> : error ? <EmptyState title="Unable to load notifications" text={error} /> : <><div className="full-notifications">{filtered.map((item) => <button className={`full-notification card ${!item.isRead ? "unread" : ""}`} key={item.id} onClick={() => markRead(item.id)} type="button"><span className="notice-icon"><Icon name={item.type === "COURSE" ? "book" : item.type === "SYSTEM" ? "settings" : "bell"} /></span><span className="notice-copy"><strong>{item.title}</strong><span>{item.message}</span><small>{item.type} · {new Date(item.createdAt).toLocaleString()}</small></span>{!item.isRead && <i className="unread-dot" />}</button>)}</div>{filtered.length === 0 && <EmptyState title="No notifications yet" text="There are no notifications in this view." />}</>}</div>; }
function ComplaintsPage() { const [form, setForm] = useState({ subject: "", category: "Technical Issue", priority: "Medium", description: "" }); const [error, setError] = useState(""); const [success, setSuccess] = useState(false); function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!form.subject.trim() || !form.description.trim()) { setError("Add a subject and description before submitting."); setSuccess(false); return; } setError(""); setSuccess(true); setForm({ ...form, subject: "", description: "" }); } return <div className="prototype-content"><PageIntro eyebrow="HELP DESK" title="Complaints & Support" text="Report an issue, submit a complaint, or get help with the platform." /><div className="support-layout"><section className="form-card card"><div className="card-heading"><h2>Submit a Complaint</h2><p>We usually respond within two working days.</p></div><form onSubmit={submit} noValidate><label htmlFor="subject">Complaint subject</label><input id="subject" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} placeholder="Briefly describe the issue" /><div className="form-row"><div><label htmlFor="category">Category</label><select id="category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}><option>Technical Issue</option><option>Course Issue</option><option>Account Issue</option><option>Content Issue</option><option>Payment Issue</option><option>Other</option></select></div><div><label htmlFor="priority">Priority</label><select id="priority" value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}><option>Low</option><option>Medium</option><option>High</option></select></div></div><label htmlFor="description">Description</label><textarea id="description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Tell us what happened and how we can help" rows={5} /><label htmlFor="attachment">Attachment <span className="optional">Optional</span></label><input id="attachment" type="file" /><p className="form-hint">PNG, JPG or PDF up to 10 MB</p>{error && <p className="form-error" role="alert">{error}</p>}{success && <p className="form-success" role="status">Complaint submitted successfully. Your support team has been notified.</p>}<button className="primary-button" type="submit">Submit Complaint</button></form></section><section className="previous-card"><div className="card-heading"><h2>Previous Complaints</h2><p>Track your submitted requests.</p></div><div className="complaint-list">{academicData.complaints.map((complaint) => <article className="complaint-item card" key={complaint.id}><div><strong>{complaint.id}</strong><h3>{complaint.subject}</h3><p>{complaint.category} · {complaint.date}</p></div><span className={`status-badge complaint-${complaint.status.toLowerCase().replace(" ", "-")}`}>{complaint.status}</span><small>{complaint.priority} priority</small></article>)}</div></section></div></div>; }
type Theme = "light" | "dark";
const THEME_STORAGE_KEY = "abuad-theme";

const settingsTabs = [{ label: "Profile", path: "/settings" }, { label: "Email", path: "/settings/email" }, { label: "Authentication", path: "/settings/authentication" }, { label: "Preferences", path: "/settings/preferences" }];
function SettingsPage({ path, theme, onThemeChange }: { path: string; theme: Theme; onThemeChange: (theme: Theme) => void }) { const active = settingsTabs.find((tab) => tab.path === path) ?? settingsTabs[0]; const [saved, setSaved] = useState(false); return <div className="prototype-content"><PageIntro eyebrow="ACCOUNT" title="Settings" text="Manage your profile, notifications, and account preferences." /><div className="settings-layout"><aside className="settings-tabs">{settingsTabs.map((tab) => <button className={active.path === tab.path ? "selected" : ""} key={tab.path} onClick={() => navigate(tab.path)} type="button">{tab.label}<span>›</span></button>)}</aside><section className="settings-panel card">{active.path === "/settings" && <><SettingsHeading title="Profile information" text="Keep your personal details up to date." /><div className="settings-avatar"><Avatar large /><div><strong>{student.name}</strong><p>JPG or PNG. Max size 2 MB.</p><button className="text-button" type="button">Change photo</button></div></div><div className="settings-form"><label>Full name<input defaultValue={student.name} /></label><label>Email<input defaultValue={student.email} /></label><label>Role<input defaultValue="Student" /></label><label>Institution<input defaultValue={student.institution} /></label><label>Department<input defaultValue={student.department} /></label><label>Phone number<input placeholder="Add phone number" /></label></div><SaveButton saved={saved} onSave={() => setSaved(true)} /></>}{active.path === "/settings/email" && <><SettingsHeading title="Email settings" text="Choose how we keep you informed." /><div className="info-banner"><strong>{student.email}</strong><span>✓ Verified email address</span></div><button className="secondary-button" type="button" onClick={() => setSaved(true)}>Change email</button><Toggle label="Email notifications" text="Receive important account updates by email" checked /><Toggle label="Course announcements" text="Get notified when lecturers post updates" checked /></>}{active.path === "/settings/authentication" && <><SettingsHeading title="Authentication & security" text="Review how your account stays protected." /><div className="security-row"><span>Login method<strong>Username and password</strong></span><span className="verified">Secure</span></div><div className="security-row"><span>Password<strong>Last changed 3 months ago</strong></span><button className="secondary-button" type="button" onClick={() => setSaved(true)}>Update</button></div><div className="security-row"><span>Two-factor authentication<strong>Add an extra layer of security</strong></span><button className="switch" type="button" onClick={() => setSaved(true)} aria-label="Enable two-factor authentication"><i /></button></div><button className="danger-button" type="button" onClick={() => setSaved(true)}>Sign out of other sessions</button></>}{active.path === "/settings/preferences" && <><SettingsHeading title="Preferences" text="Personalize your experience in the portal." /><Toggle label="Email notifications" text="Receive updates in your inbox" checked /><Toggle label="Push notifications" text="Receive alerts on this device" checked /><Toggle label="Course notifications" text="Stay informed about your courses" checked /><Toggle label="System announcements" text="Hear about platform changes" checked /><label className="select-setting">Language<select defaultValue="English"><option>English</option><option>French</option></select></label><label className="select-setting">Theme<select value={theme} onChange={(event) => onThemeChange(event.target.value as Theme)}><option value="light">Light</option><option value="dark">Dark</option></select></label></>}{saved && <p className="form-success" role="status">Your changes have been saved.</p>}</section></div></div>; }
function SettingsHeading({ title, text }: { title: string; text: string }) { return <div className="card-heading"><h2>{title}</h2><p>{text}</p></div>; }
function SaveButton({ saved, onSave }: { saved: boolean; onSave: () => void }) { return <button className="primary-button" type="button" onClick={onSave}>{saved ? "Changes saved" : "Save Changes"}</button>; }
function Toggle({ label, text, checked: initial }: { label: string; text: string; checked: boolean }) { const [checked, setChecked] = useState(initial); return <div className="toggle-row"><span>{label}<small>{text}</small></span><button className={`switch ${checked ? "on" : ""}`} type="button" onClick={() => setChecked(!checked)} aria-label={`Toggle ${label}`}><i /></button></div>; }

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [path, setPath] = useState(""); const [noticeItems, setNoticeItems] = useState<Notice[]>([]); const [unreadCount, setUnreadCount] = useState(0); const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const route = () => setPath(window.location.pathname);
    route();
    window.addEventListener("popstate", route);

    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    const preferredTheme = savedTheme === "light" || savedTheme === "dark" ? savedTheme : "light";
    setTheme(preferredTheme);
    document.documentElement.setAttribute("data-theme", preferredTheme);

    return () => window.removeEventListener("popstate", route);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (status === "authenticated" && path === "/") {
      router.replace("/student/dashboard");
    }
  }, [path, router, status]);

  useEffect(() => {
    if (status !== "authenticated") return;

    fetch("/api/notifications/unread-count")
      .then(async (response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then((payload) => setUnreadCount(payload.data?.count ?? 0))
      .catch(() => setUnreadCount(0));
  }, [status]);

  function goToDashboard() {
    router.push("/student/dashboard");
  }

  function logout() {
    signOut({ callbackUrl: "/" });
  }

  if (status === "loading") return null;
  if (!path) return null;
  if (!session && (path === "/" || !["/student/dashboard", "/courses", "/notifications", "/complaints", "/settings", "/settings/email", "/settings/authentication", "/settings/preferences"].includes(path))) return <LoginPage onLogin={goToDashboard} />;
  if (!session && path !== "/") return <LoginPage onLogin={goToDashboard} />;
  if (path === "/") return <LoginPage onLogin={goToDashboard} />;
  if (path === "/student/dashboard") return <Dashboard onLogout={logout} />;
  return <AppFrame path={path} unreadCount={unreadCount} onLogout={logout}>{path === "/courses" ? <CoursesPage /> : path === "/notifications" ? <NotificationsPage items={noticeItems} setItems={setNoticeItems} setUnreadCount={setUnreadCount} /> : path === "/complaints" ? <ComplaintPanel /> : <SettingsPanel path={path} theme={theme} onThemeChange={setTheme} />}</AppFrame>;
}
