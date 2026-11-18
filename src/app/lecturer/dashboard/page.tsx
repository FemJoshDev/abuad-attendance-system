// src/app/lecturer/dashboard/page.tsx
'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LecturerDashboard() {
  const router = useRouter();
  
  const [lecturerName, setLecturerName] = useState('Faculty Member');
  const [lecturerEmail, setLecturerEmail] = useState('');
  const [assignedCourses, setAssignedCourses] = useState<any[]>([]);
  
  const [activeCourse, setActiveCourse] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [radiusMeters, setRadiusMeters] = useState(50);
  const [checkedInCount, setCheckedInCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleSignOut = async () => {
    const { signOut } = await import('next-auth/react');
    await signOut({ callbackUrl: '/login' });
  };

  // Fetch the logged-in lecturer's live data on mount (and poll for live attendee counts)
  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch('/api/lecturer/dashboard');
        if (res.ok) {
          const data = await res.json();
          setLecturerName(data.lecturerName || 'Faculty Member');
          setLecturerEmail(data.lecturerEmail || '');
          setAssignedCourses(data.assignedCourses || []);

          if (data.activeSession) {
            setActiveCourse(data.activeSession.courseCode);
            setActiveSessionId(data.activeSession.id);
            setSessionCode(data.activeSession.sessionCode);
            setRadiusMeters(data.activeSession.radiusMeters);
            setCheckedInCount(data.activeSession.checkedInCount || 0);
          } else {
            setActiveCourse(null);
            setActiveSessionId(null);
            setSessionCode(null);
          }
        } else if (res.status === 401 || res.status === 403) {
          await handleSignOut();
        }
      } catch (err) {
        console.error('Failed to load lecturer dashboard', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();

    // Poll every 5 seconds to update the live attendee count automatically
    const interval = setInterval(fetchDashboard, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStartSession = async (course: any) => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await submitStartSession(course.id, course.code, latitude, longitude);
      },
      (error) => {
        alert('GPS Error: Unable to retrieve live coordinates to anchor the session.');
      },
      geoOptions
    );
  };

  const submitStartSession = async (courseId: number, courseCode: string, lat: number, lon: number) => {
    try {
      const res = await fetch('/api/lecturer/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'START',
          courseId,
          radiusMeters,
          latitude: lat,
          longitude: lon,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setActiveCourse(courseCode);
        setActiveSessionId(data.activeSession.id);
        setSessionCode(data.activeSession.sessionCode);
        setCheckedInCount(0);
        alert('Live attendance session anchored and started successfully!');
      } else {
        alert(data.error || 'Failed to start session.');
      }
    } catch (err) {
      console.error('Error starting session', err);
    }
  };

  const handleEndSession = async () => {
    if (!activeSessionId) return;

    try {
      const res = await fetch('/api/lecturer/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'END',
          sessionId: activeSessionId,
        }),
      });

      if (res.ok) {
        setActiveCourse(null);
        setActiveSessionId(null);
        setSessionCode(null);
        alert('Attendance session ended.');
      }
    } catch (err) {
      console.error('Error ending session', err);
    }
  };

  // Download Attendance CSV Report
  const handleDownloadCSV = () => {
    if (!activeSessionId) return;
    window.open(`/api/lecturer/dashboard?exportSessionId=${activeSessionId}`, '_blank');
  };

  return (
    <main className="text-[#171717]">
      {/* Mobile Header & Drawer */}
      <div className="flex lg:hidden items-center justify-between bg-[#570015] text-white px-5 py-4 sticky top-0 z-30 shadow-md">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-md bg-white/10 hover:bg-white/20 transition focus:outline-none cursor-pointer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div>
            <p className="text-sm font-bold tracking-wide">ABUAD Portal</p>
            <p className="text-[10px] text-white/70">Lecturer Navigation</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold">{lecturerName}</p>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="relative w-[260px] bg-[#570015] px-5 py-7 text-white flex flex-col shadow-2xl z-10">
            <div className="flex items-center justify-between mb-10 border-b border-white/15 pb-4">
              <p className="text-lg font-bold">ABUAD</p>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold">&times;</button>
            </div>
            <nav className="space-y-2 text-sm">
              <Link href="#overview" onClick={() => setIsMobileMenuOpen(false)} className="block rounded-md bg-white/12 px-3 py-3 font-semibold">Dashboard</Link>
            </nav>
            <button onClick={handleSignOut} className="mt-auto rounded-md border border-white/25 px-3 py-2.5 text-left text-sm text-white/85 cursor-pointer">Sign out</button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[205px] flex-col bg-[#570015] px-5 py-7 text-white lg:flex shadow-xl">
        <div className="mb-12 border-b border-white/15 pb-6">
          <p className="text-lg font-bold tracking-wide">ABUAD</p>
          <p className="mt-1 text-xs text-white/65">Lecturer Portal</p>
        </div>
        <nav className="space-y-2 text-sm">
          <Link href="#overview" className="block rounded-md bg-white/12 px-3 py-3 font-semibold">Dashboard</Link>
        </nav>
        <button onClick={handleSignOut} className="mt-auto rounded-md border border-white/25 px-3 py-2.5 text-left text-sm text-white/85 cursor-pointer">
          Sign out
        </button>
      </aside>

      {/* Main Content */}
      <div className="min-h-screen lg:ml-[205px]">
        <header className="hidden lg:flex min-h-[76px] items-center justify-between border-b border-[#e9e3d8] bg-white/90 backdrop-blur-md px-5 sm:px-8 lg:px-10 sticky top-0 z-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a6b67]">Lecturer Dashboard</p>
            <h1 className="mt-1 text-lg font-semibold">College of Medicine &amp; Health Sciences</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">{lecturerName}</p>
              <p className="mt-0.5 text-xs text-[#746d68]">{lecturerEmail}</p>
            </div>
            <button onClick={handleSignOut} className="rounded-md border border-[#ead9d5] px-3 py-2 text-xs font-semibold text-[#650019] cursor-pointer">
              Sign out
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-[1440px] space-y-9 px-5 py-7 sm:px-8 lg:px-10">
          {/* Overview Banner */}
          <section id="overview" className="flex flex-col items-start justify-between gap-5 rounded-lg bg-[#590018] p-7 text-white shadow-sm sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#f0c3ca]">Teaching overview</p>
              <h2 className="mt-3 text-2xl font-medium">Welcome, {lecturerName}</h2>
              <p className="mt-2 text-sm text-white/85">Manage your courses and launch live geofenced attendance sessions.</p>
            </div>
            <div className="min-w-36 rounded-lg border border-white/20 bg-white/10 px-5 py-4 text-center">
              <p className="text-[10px] uppercase tracking-wider text-white/75">Assigned Courses</p>
              <p className="mt-1 text-3xl font-bold text-[#f2cf00]">{assignedCourses.length}</p>
            </div>
          </section>

          {/* Active Session Card with Live Counter and CSV Export Button */}
          {activeCourse && (
            <section id="sessions" className="flex flex-col justify-between gap-6 rounded-lg border border-emerald-200 bg-emerald-50 p-6 sm:flex-row sm:items-center shadow-sm">
              <div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-800">Live session &middot; {activeCourse}</span>
                <h2 className="mt-4 text-3xl font-bold tracking-widest text-[#145b46]">CODE: {sessionCode}</h2>
                <p className="mt-2 text-sm text-[#43534c]">
                  Geofence radius: <span className="font-semibold">{radiusMeters}m</span> | Students Checked In: <span className="font-extrabold text-emerald-900 text-base">{checkedInCount}</span>
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleDownloadCSV}
                  className="rounded-md bg-emerald-700 hover:bg-emerald-800 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white transition shadow-sm cursor-pointer"
                >
                  📥 Download CSV
                </button>
                <button
                  onClick={handleEndSession}
                  className="rounded-md bg-[#650019] px-5 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#7b1730] cursor-pointer"
                >
                  End session
                </button>
              </div>
            </section>
          )}

          {/* Assigned Courses Section */}
          <section id="courses" className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9a7773]">Academic record</p>
              <h2 className="mt-2 text-[27px] font-medium">My Assigned Courses</h2>
            </div>

            {loading ? (
              <div className="text-center py-10 text-sm text-[#746d68]">Loading assigned courses...</div>
            ) : assignedCourses.length === 0 ? (
              <div className="text-center py-10 text-xs text-[#746d68] italic bg-white p-6 rounded-lg border border-[#ead9d5]">No courses currently assigned to your profile.</div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {assignedCourses.map((course) => (
                  <article key={course.id} className="flex flex-col justify-between gap-7 rounded-lg border border-[#ead9d5] bg-white p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="rounded-md bg-[#f7f2ec] px-3 py-1 text-xs font-bold text-[#650019]">{course.code}</span>
                        <h3 className="mt-4 text-lg font-semibold">{course.title}</h3>
                      </div>
                      <span className="shrink-0 text-sm font-medium text-cyan-800">{course.studentsEnrolled} students</span>
                    </div>
                    <div className="space-y-4 border-t border-[#eee8df] pt-4">
                      <label className="flex items-center justify-between gap-3 text-sm text-[#746d68]">Geofence radius
                        <select
                          value={radiusMeters}
                          onChange={(e) => setRadiusMeters(Number(e.target.value))}
                          className="rounded-md border border-[#ddd4ca] bg-white px-3 py-2 text-sm text-[#292323] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]"
                        >
                          <option value={20}>20 meters (Strict)</option>
                          <option value={50}>50 meters (Standard)</option>
                          <option value={100}>100 meters (Wide)</option>
                        </select>
                      </label>
                      <button
                        onClick={() => handleStartSession(course)}
                        disabled={activeCourse !== null}
                        className="w-full rounded-md bg-[#650019] py-3 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-[#7b1730] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                      >
                        {activeCourse === course.code ? 'Session in progress' : 'Start attendance session'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}