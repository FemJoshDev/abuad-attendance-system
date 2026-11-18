// src/app/admin/dashboard/page.tsx
'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();

  const [adminName, setAdminName] = useState('ABUAD System Admin');
  const [adminEmail, setAdminEmail] = useState('admin@abuad.edu.ng');
  const [stats, setStats] = useState({ totalUsers: 0, totalStudents: 0, totalLecturers: 0, activeCourses: 0 });
  
  const [staffList, setStaffList] = useState<any[]>([]);
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Staff creation form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('LECTURER');
  const [department, setDepartment] = useState('College of Medicine & Health Sciences');

  // Course assignment state
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedLecturerIds, setSelectedLecturerIds] = useState<string[]>([]);

  // Carryover assignment & search states
  const [carryoverStudentId, setCarryoverStudentId] = useState('');
  const [carryoverCourseId, setCarryoverCourseId] = useState('');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [courseSearchQuery, setCourseSearchQuery] = useState('');

  // CSV Bulk Upload state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreviewCount, setCsvPreviewCount] = useState(0);
  const [parsedCsvData, setParsedCsvData] = useState<any[]>([]);
  const [uploadingCsv, setUploadingCsv] = useState(false);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    const { signOut } = await import('next-auth/react');
    await signOut({ callbackUrl: '/login' });
  };

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/dashboard');
      if (res.ok) {
        const data = await res.json();
        setAdminName(data.adminName);
        setAdminEmail(data.adminEmail);
        setStats(data.stats);
        setStaffList(data.staffList || []);
        setStudentsList(data.studentsList || []);
        setCoursesList(data.coursesList || []);
        setComplaints(data.complaints || []);
      } else if (res.status === 401 || res.status === 403) {
        router.replace('/admin/login');
      }
    } catch (err) {
      console.error('Error fetching admin data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [router]);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CREATE_STAFF', fullName, email, password, role, department }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setFullName('');
        setEmail('');
        setPassword('');
        fetchData();
      } else {
        alert(data.error || 'Failed to create staff.');
      }
    } catch (err) {
      console.error('Error creating staff', err);
    }
  };

  const handleAssignLecturers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) {
      alert('Please select a course.');
      return;
    }

    try {
      const res = await fetch('/api/admin/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ASSIGN_LECTURERS', courseId: selectedCourseId, lecturerIds: selectedLecturerIds }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchData();
      } else {
        alert(data.error || 'Failed to update course assignments.');
      }
    } catch (err) {
      console.error('Error assigning lecturers', err);
    }
  };

  const handlePushCarryoverCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!carryoverStudentId || !carryoverCourseId) {
      alert('Please select both a student and a course.');
      return;
    }

    try {
      const res = await fetch('/api/admin/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ASSIGN_CARRYOVER',
          studentId: carryoverStudentId,
          courseId: carryoverCourseId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setCarryoverStudentId('');
        setCarryoverCourseId('');
        setStudentSearchQuery('');
        setCourseSearchQuery('');
        fetchData();
      } else {
        alert(data.error || 'Failed to push course to student.');
      }
    } catch (err) {
      console.error('Error pushing carryover course', err);
    }
  };

  // CSV File Handler and Parser
  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim() !== '');
      if (lines.length < 2) {
        alert('CSV file appears empty or missing headers.');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/^"(.*)"$/, '$1'));
      const rows = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/^"(.*)"$/, '$1'));
        let obj: any = {};
        headers.forEach((header, index) => {
          obj[header] = values[index] || '';
        });
        return obj;
      });

      setParsedCsvData(rows);
      setCsvPreviewCount(rows.length);
    };
    reader.readAsText(file);
  };

  // Submit CSV Courses to API
  const handleUploadCsvSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedCsvData.length === 0) {
      alert('No course data found in CSV.');
      return;
    }

    setUploadingCsv(true);
    try {
      const res = await fetch('/api/admin/courses/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courses: parsedCsvData }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Courses successfully uploaded!');
        setCsvFile(null);
        setParsedCsvData([]);
        setCsvPreviewCount(0);
        fetchData();
      } else {
        alert(data.error || 'Failed to upload courses.');
      }
    } catch (err) {
      console.error('Error uploading CSV courses:', err);
      alert('Network error during course upload.');
    } finally {
      setUploadingCsv(false);
    }
  };

  const handleResolveComplaint = async (complaintId: string, sessionId?: string, studentId?: string) => {
    const note = prompt('Enter resolution note for network/attendance dispute:', 'Verified by admin. Attendance overridden to PRESENT.');
    if (note === null) return;

    try {
      const res = await fetch('/api/admin/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RESOLVE_COMPLAINT',
          complaintId,
          resolutionNote: note,
          sessionId,
          studentId,
          overrideStatus: 'PRESENT',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchData();
      } else {
        alert(data.error || 'Failed to resolve complaint.');
      }
    } catch (err) {
      console.error('Error resolving complaint', err);
    }
  };

  const handleDownloadCSV = (sessionId: string) => {
    window.open(`/api/admin/dashboard?exportSessionId=${sessionId}`, '_blank');
  };

  return (
    <main className="text-[#171717]">
      {/* Mobile Top Header */}
      <div className="flex lg:hidden items-center justify-between bg-[#570015] text-white px-5 py-4 sticky top-0 z-30 shadow-md">
        <div className="flex items-center space-x-3">
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 rounded-md bg-white/10 hover:bg-white/25 transition cursor-pointer">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div>
            <p className="text-sm font-bold">ABUAD Portal</p>
            <p className="text-[10px] text-white/70">Admin Navigation</p>
          </div>
        </div>
        <p className="text-xs font-semibold">{adminName}</p>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setIsMobileMenuOpen(false)} />
          <aside className="relative z-10 w-64 max-w-xs bg-[#570015] text-white flex flex-col px-5 py-7 shadow-2xl">
            <div className="mb-8 flex items-center justify-between border-b border-white/15 pb-4">
              <div>
                <p className="text-lg font-bold">ABUAD</p>
                <p className="text-xs text-white/65">Admin Portal</p>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-white/80 hover:text-white text-xl font-bold cursor-pointer">
                &times;
              </button>
            </div>
            <nav className="space-y-2 text-sm">
              <a href="#overview" onClick={() => setIsMobileMenuOpen(false)} className="block rounded-md bg-white/12 px-3 py-3 font-semibold">Dashboard</a>
              <a href="#staff" onClick={() => setIsMobileMenuOpen(false)} className="block rounded-md px-3 py-3 text-white/75 hover:bg-white/10 transition">Staff Accounts</a>
              <a href="#assignments" onClick={() => setIsMobileMenuOpen(false)} className="block rounded-md px-3 py-3 text-white/75 hover:bg-white/10 transition">Course Rosters</a>
              <a href="#csv-upload" onClick={() => setIsMobileMenuOpen(false)} className="block rounded-md px-3 py-3 text-white/75 hover:bg-white/10 transition">CSV Course Upload</a>
              <a href="#carryover" onClick={() => setIsMobileMenuOpen(false)} className="block rounded-md px-3 py-3 text-white/75 hover:bg-white/10 transition">Carryover Pushing</a>
              <a href="#reports" onClick={() => setIsMobileMenuOpen(false)} className="block rounded-md px-3 py-3 text-white/75 hover:bg-white/10 transition">Attendance Reports</a>
              <a href="#complaints" onClick={() => setIsMobileMenuOpen(false)} className="block rounded-md px-3 py-3 text-white/75 hover:bg-white/10 transition">Complaints &amp; Fixes</a>
            </nav>
            <button onClick={handleSignOut} className="mt-auto rounded-md border border-white/25 px-3 py-2.5 text-left text-sm hover:bg-white/10 cursor-pointer">
              Sign out
            </button>
          </aside>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[205px] flex-col bg-[#570015] px-5 py-7 text-white lg:flex shadow-xl">
        <div className="mb-12 border-b border-white/15 pb-6">
          <p className="text-lg font-bold">ABUAD</p>
          <p className="mt-1 text-xs text-white/65">Admin Portal</p>
        </div>
        <nav className="space-y-2 text-sm">
          <a href="#overview" className="block rounded-md bg-white/12 px-3 py-3 font-semibold">Dashboard</a>
          <a href="#staff" className="block rounded-md px-3 py-3 text-white/75 hover:bg-white/10 transition">Staff Accounts</a>
          <a href="#assignments" className="block rounded-md px-3 py-3 text-white/75 hover:bg-white/10 transition">Course Rosters</a>
          <a href="#csv-upload" className="block rounded-md px-3 py-3 text-white/75 hover:bg-white/10 transition">CSV Course Upload</a>
          <a href="#carryover" className="block rounded-md px-3 py-3 text-white/75 hover:bg-white/10 transition">Carryover Pushing</a>
          <a href="#reports" className="block rounded-md px-3 py-3 text-white/75 hover:bg-white/10 transition">Attendance Reports</a>
          <a href="#complaints" className="block rounded-md px-3 py-3 text-white/75 hover:bg-white/10 transition">Complaints &amp; Fixes</a>
        </nav>
        <button onClick={handleSignOut} className="mt-auto rounded-md border border-white/25 px-3 py-2.5 text-left text-sm hover:bg-white/10 cursor-pointer">
          Sign out
        </button>
      </aside>

      <div className="min-h-screen lg:ml-[205px]">
        <header className="hidden lg:flex min-h-[76px] items-center justify-between border-b border-[#e9e3d8] bg-white/90 backdrop-blur-md px-10 sticky top-0 z-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a6b67]">Admin Dashboard</p>
            <h1 className="mt-1 text-lg font-semibold">College of Medicine &amp; Health Sciences</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold">{adminName}</p>
              <p className="text-xs text-[#746d68]">{adminEmail}</p>
            </div>
            <button onClick={handleSignOut} className="rounded-md border border-[#ead9d5] px-3 py-2 text-xs font-semibold text-[#650019] cursor-pointer">
              Sign out
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-[1440px] space-y-8 px-5 py-7 sm:px-8 lg:px-10">
          {/* Overview Banner */}
          <section id="overview" className="flex flex-col items-start justify-between gap-4 rounded-lg bg-[#590018] p-7 text-white shadow-sm md:flex-row md:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#f0c3ca]">System command</p>
              <h2 className="mt-3 text-2xl font-medium">Administration Panel</h2>
              <p className="mt-2 text-sm text-white/85">Manage bulk course uploads, multi-lecturer assignments, carryover courses, and attendance disputes.</p>
            </div>
            <div className="min-w-44 rounded-lg border border-white/20 bg-white/10 px-5 py-4 text-center">
              <p className="text-[10px] uppercase tracking-wider text-white/75">Registered Users</p>
              <p className="mt-1 text-3xl font-bold text-[#f2cf00]">{loading ? '...' : stats.totalUsers}</p>
            </div>
          </section>

          {/* Metrics */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Total Students', value: stats.totalStudents, color: 'text-[#650019]' },
              { label: 'Total Lecturers', value: stats.totalLecturers, color: 'text-cyan-800' },
              { label: 'Active Courses', value: stats.activeCourses, color: 'text-[#9a7900]' },
              { label: 'System Status', value: 'Operational', color: 'text-emerald-800' },
            ].map((stat) => (
              <article key={stat.label} className="rounded-lg border border-[#ead9d5] bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wider text-[#9a7773]">{stat.label}</p>
                <p className={`mt-2 text-2xl font-semibold ${stat.color}`}>{stat.value}</p>
              </article>
            ))}
          </section>

          {/* Grid: Staff Provisioning & Multi-Lecturer Course Assignment */}
          <div className="grid gap-6 lg:grid-cols-2 items-start">
            
            {/* 1. Provision Staff */}
            <section id="staff" className="rounded-lg border border-[#ead9d5] bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-[#650019]">Provision Staff Account</h2>
              <p className="mb-5 mt-2 text-xs text-[#746d68]">Create secure login credentials for new lecturers or administrators.</p>
              
              <form onSubmit={handleCreateStaff} className="space-y-4">
                <label className="block text-xs font-medium text-[#514949]">Full Name
                  <input type="text" placeholder="e.g. Dr. Ojo Oluwapelumi" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="mt-1.5 w-full rounded-md border border-[#ddd4ca] px-3 py-2.5 text-sm" />
                </label>
                <label className="block text-xs font-medium text-[#514949]">Institutional Email
                  <input type="email" placeholder="e.g. lecturer@abuad.edu.ng" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1.5 w-full rounded-md border border-[#ddd4ca] px-3 py-2.5 text-sm" />
                </label>
                <div className="block text-xs font-medium text-[#514949]">
                  <span>Password</span>
                  <div className="relative mt-1.5">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full rounded-md border border-[#ddd4ca] px-3 py-2.5 pr-14 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 px-3 flex items-center text-xs font-semibold text-[#650019] cursor-pointer"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
                <label className="block text-xs font-medium text-[#514949]">Department / College
                  <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} required className="mt-1.5 w-full rounded-md border border-[#ddd4ca] px-3 py-2.5 text-sm" />
                </label>
                <label className="block text-xs font-medium text-[#514949]">Role
                  <select value={role} onChange={(e) => setRole(e.target.value)} className="mt-1.5 w-full rounded-md border border-[#ddd4ca] px-3 py-2.5 text-sm">
                    <option value="LECTURER">LECTURER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </label>
                <button type="submit" className="w-full rounded-md bg-[#650019] py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#7b1730] cursor-pointer">
                  Provision Staff Account
                </button>
              </form>

              <div className="mt-6 border-t border-[#eee8df] pt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#9a7773]">Staff Roster ({staffList.length})</p>
                <div className="space-y-2 max-h-36 overflow-y-auto">
                  {staffList.map((s) => (
                    <div key={s.id} className="text-xs flex justify-between items-center bg-[#fbf9f0] p-2 rounded">
                      <span className="font-semibold text-[#650019]">{s.fullName} ({s.email})</span>
                      <span className="bg-stone-200 px-2 py-0.5 rounded text-[10px] font-bold">{s.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* 2. Assign Multiple Lecturers to Course */}
            <section id="assignments" className="rounded-lg border border-[#ead9d5] bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-[#650019]">Assign Course Lecturers (Multi-Lecturer Support)</h2>
              <p className="mb-5 mt-2 text-xs text-[#746d68]">Select a course and check all lecturers who teach it (supports team teaching).</p>

              <form onSubmit={handleAssignLecturers} className="space-y-4">
                <label className="block text-xs font-medium text-[#514949]">Select Course
                  <select 
                    value={selectedCourseId} 
                    onChange={(e) => {
                      setSelectedCourseId(e.target.value);
                      const course = coursesList.find(c => c.id === e.target.value);
                      if (course) {
                        setSelectedLecturerIds((course.lecturers || []).map((l: any) => l.id));
                      }
                    }} 
                    required 
                    className="mt-1.5 w-full rounded-md border border-[#ddd4ca] px-3 py-2.5 text-sm"
                  >
                    <option value="">-- Choose Course --</option>
                    {coursesList.map((c) => (
                      <option key={c.id} value={c.id}>{c.code}: {c.title}</option>
                    ))}
                  </select>
                </label>

                <div className="block text-xs font-medium text-[#514949]">
                  <span>Select Lecturers (Check all that apply)</span>
                  <div className="mt-1.5 max-h-40 overflow-y-auto border border-[#ddd4ca] rounded-md p-3 space-y-2 bg-white">
                    {staffList.filter(s => s.role === 'LECTURER').map((lecturer) => (
                      <label key={lecturer.id} className="flex items-center gap-2 text-xs cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={selectedLecturerIds.includes(lecturer.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedLecturerIds([...selectedLecturerIds, lecturer.id]);
                            } else {
                              setSelectedLecturerIds(selectedLecturerIds.filter(id => id !== lecturer.id));
                            }
                          }}
                          className="rounded text-[#650019]"
                        />
                        {lecturer.fullName} ({lecturer.email})
                      </label>
                    ))}
                  </div>
                </div>

                <button type="submit" className="w-full rounded-md bg-cyan-800 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-cyan-900 cursor-pointer">
                  Update Course Lecturers
                </button>
              </form>

              <div className="mt-6 border-t border-[#eee8df] pt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#9a7773]">Assigned Rosters</p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {coursesList.map((c) => (
                    <div key={c.id} className="text-xs flex justify-between items-center bg-[#fbf9f0] p-2 rounded">
                      <span className="font-semibold text-[#650019]">{c.code}</span>
                      <span className="text-stone-700">{(c.lecturers || []).map((l: any) => l.fullName).join(', ') || 'No lecturer assigned'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

          </div>

          {/* 3. Bulk Upload Courses via CSV */}
          <section id="csv-upload" className="rounded-lg border border-[#ead9d5] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#650019]">Bulk Upload Courses (CSV)</h2>
            <p className="mb-5 mt-2 text-xs text-[#746d68]">
              Upload a CSV file containing columns: <code className="bg-stone-100 px-1.5 py-0.5 rounded text-rose-800 font-mono">code, title, description, department, level, semester, units</code>
            </p>

            <form onSubmit={handleUploadCsvSubmit} className="space-y-4">
              <label className="block text-xs font-medium text-[#514949]">Select CSV Course File
                <input 
                  type="file" 
                  accept=".csv" 
                  onChange={handleCsvFileChange}
                  className="mt-1.5 block w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#650019] file:text-white hover:file:bg-[#7b1730] cursor-pointer border border-[#ddd4ca] rounded-md p-1 bg-[#fbf9f0]" 
                />
              </label>

              {csvPreviewCount > 0 && (
                <div className="bg-[#fbf9f0] p-3 rounded text-xs text-stone-700 flex items-center justify-between border border-[#ead9d5]">
                  <span>Ready to import <strong className="text-[#650019]">{csvPreviewCount}</strong> courses from CSV.</span>
                  <span className="text-emerald-700 font-semibold">Valid format ✓</span>
                </div>
              )}

              <button 
                type="submit" 
                disabled={uploadingCsv || csvPreviewCount === 0}
                className="w-full rounded-md bg-[#650019] py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#7b1730] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
              >
                {uploadingCsv ? 'Importing Courses...' : 'Push CSV Courses to Database'}
              </button>
            </form>
          </section>

          {/* 4. Push Course / Carryover to Student with Working Search Filters */}
          <section id="carryover" className="rounded-lg border border-[#ead9d5] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#650019]">Push Course / Carryover to Student</h2>
            <p className="mb-5 mt-2 text-xs text-[#746d68]">Manually assign a course to a student's schedule (for carryovers or cross-level registrations).</p>

            <form onSubmit={handlePushCarryoverCourse} className="space-y-4">
              
              {/* Searchable Student Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#514949]">Search &amp; Select Student</label>
                <input 
                  type="text"
                  placeholder="Filter by student name, email, or matric number..."
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  className="w-full rounded-md border border-[#ddd4ca] px-3 py-2 text-xs bg-[#fbf9f0] focus:outline-none focus:ring-1 focus:ring-[#650019]"
                />
                <select 
                  value={carryoverStudentId} 
                  onChange={(e) => setCarryoverStudentId(e.target.value)} 
                  required 
                  className="w-full rounded-md border border-[#ddd4ca] px-3 py-2.5 text-sm mt-1"
                >
                  <option value="">-- Choose Student --</option>
                  {studentsList
                    .filter((s) => {
                      const query = studentSearchQuery.toLowerCase();
                      const name = (s.fullName || '').toLowerCase();
                      const matric = (s.matricNumber || '').toLowerCase();
                      const email = (s.email || '').toLowerCase();
                      return name.includes(query) || matric.includes(query) || email.includes(query);
                    })
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.matricNumber || s.email}) - {s.level}
                      </option>
                    ))}
                </select>
              </div>

              {/* Searchable Course Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#514949]">Search &amp; Select Course to Push</label>
                <input 
                  type="text"
                  placeholder="Filter by course code or title (e.g., CHM101)..."
                  value={courseSearchQuery}
                  onChange={(e) => setCourseSearchQuery(e.target.value)}
                  className="w-full rounded-md border border-[#ddd4ca] px-3 py-2 text-xs bg-[#fbf9f0] focus:outline-none focus:ring-1 focus:ring-[#650019]"
                />
                <select 
                  value={carryoverCourseId} 
                  onChange={(e) => setCarryoverCourseId(e.target.value)} 
                  required 
                  className="w-full rounded-md border border-[#ddd4ca] px-3 py-2.5 text-sm mt-1"
                >
                  <option value="">-- Choose Course --</option>
                  {coursesList
                    .filter((c) => {
                      const query = courseSearchQuery.toLowerCase();
                      const code = (c.code || '').toLowerCase();
                      const title = (c.title || '').toLowerCase();
                      return code.includes(query) || title.includes(query);
                    })
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code}: {c.title} ({c.level})
                      </option>
                    ))}
                </select>
              </div>

              <button type="submit" className="w-full rounded-md bg-[#650019] py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#7b1730] cursor-pointer shadow-sm">
                Push Course to Student Schedule
              </button>
            </form>
          </section>

          {/* Closed Attendance Reports & CSV Downloads */}
          <section id="reports" className="rounded-lg border border-[#ead9d5] bg-white p-6 shadow-sm overflow-hidden">
            <h2 className="text-lg font-semibold text-[#650019]">Closed Attendance Sessions &amp; CSV Reports</h2>
            <p className="mb-5 mt-2 text-xs text-[#746d68]">Master attendance logs across all courses. Downloadable CSVs update universally when admin overrides attendance.</p>
            
            <div className="w-full overflow-x-auto pb-2">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#ece6dd] text-[#766c68]">
                    <th className="pb-3 font-semibold">Course Code &amp; Title</th>
                    <th className="pb-3 font-semibold">Date</th>
                    <th className="pb-3 font-semibold">Total Present</th>
                    <th className="pb-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0ece5]">
                  {coursesList.flatMap(c => c.attendanceSessions || []).length === 0 ? (
                    <tr><td colSpan={4} className="py-6 text-center text-xs text-stone-500 italic">No attendance sessions recorded yet.</td></tr>
                  ) : (
                    coursesList.flatMap((course: any) => 
                      (course.attendanceSessions || []).map((session: any) => (
                        <tr key={session.id} className="hover:bg-[#fbf9f0]">
                          <td className="py-4 font-semibold text-[#650019]">{course.code}: {course.title}</td>
                          <td className="py-4 text-stone-600">{new Date(session.createdAt).toLocaleDateString()}</td>
                          <td className="py-4 font-bold text-cyan-800">{session.logs?.length || 0} students</td>
                          <td className="py-4 text-right">
                            <button onClick={() => handleDownloadCSV(session.id)} className="rounded bg-cyan-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-900 cursor-pointer">
                              Download CSV
                            </button>
                          </td>
                        </tr>
                      ))
                    )
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Student Complaints & Attendance Overrides */}
          <section id="complaints" className="rounded-lg border border-[#ead9d5] bg-white p-6 shadow-sm overflow-hidden">
            <h2 className="text-lg font-semibold text-[#650019]">Student Network &amp; Geofence Complaints</h2>
            <p className="mb-5 mt-2 text-xs text-[#746d68]">Resolving complaints overrides attendance in the database, updating lecturer CSV exports instantly.</p>
            
            <div className="w-full overflow-x-auto pb-2">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#ece6dd] text-[#766c68]">
                    <th className="pb-3 font-semibold">Student &amp; Matric</th>
                    <th className="pb-3 font-semibold">Complaint Issue</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 text-right font-semibold">Admin Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0ece5]">
                  {complaints.length === 0 ? (
                    <tr><td colSpan={4} className="py-6 text-center text-xs text-stone-500 italic">No complaints filed.</td></tr>
                  ) : (
                    complaints.map((c: any) => (
                      <tr key={c.id} className="hover:bg-[#fbf9f0]">
                        <td className="py-4">
                          <p className="font-semibold">{c.student?.fullName || 'Student'}</p>
                          <p className="text-xs text-[#817874]">{c.student?.matricNumber || c.student?.email}</p>
                        </td>
                        <td className="py-4 max-w-sm text-stone-700">
                          <p className="font-medium">{c.title}</p>
                          <p className="text-xs">{c.description}</p>
                        </td>
                        <td className="py-4">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${c.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          {c.status !== 'RESOLVED' ? (
                            <button onClick={() => handleResolveComplaint(c.id, c.attendanceSessionId, c.studentId)} className="rounded bg-[#650019] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#7b1730] cursor-pointer">
                              Resolve &amp; Grant Attendance
                            </button>
                          ) : (
                            <span className="text-xs font-medium text-emerald-700">Resolved ✓</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

        </div>
      </div>
    </main>
  );
}