const fs = require('fs');
const path = 'c:\\Users\\PROVOST OFFICE(CMHS)\\abuad-attendance-system\\app\\page.tsx';
const s = fs.readFileSync(path, 'utf8');
const start = s.indexOf('function PageIntro');
const end = s.indexOf('type Notice = typeof academicData.notifications[number];');
if (start === -1 || end === -1) {
  throw new Error('Course page markers not found.');
}
const before = s.slice(0, start);
const after = s.slice(end);
const replacement = [
  'function PageIntro({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) { return <div className="page-intro"><p className="eyebrow">{eyebrow}</p><h2>{title}</h2><p>{text}</p></div>; }',
  'function CoursesPage() {',
  '  const [query, setQuery] = useState("");',
  '  const [selected, setSelected] = useState<CourseSummary | null>(null);',
  '  const [courseItems, setCourseItems] = useState<CourseSummary[]>([]);',
  '  const [loading, setLoading] = useState(true);',
  '  const [error, setError] = useState("");',
  '',
  '  useEffect(() => {',
  '    async function loadCourses() {',
  '      setLoading(true);',
  '      setError("");',
  '',
  '      try {',
  '        const response = await fetch("/api/courses");',
  '        if (!response.ok) {',
  '          throw new Error("Unable to load your courses.");',
  '        }',
  '',
  '        const payload = await response.json();',
  '        const items = Array.isArray(payload.data)',
  '          ? payload.data.map((course) => ({',
  '              id: String(course.id ?? ""),',
  '              code: String(course.code ?? course.courseCode ?? ""),',
  '              title: String(course.title ?? course.courseTitle ?? ""),',
  '              description: String(course.description ?? ""),',
  '              lecturer: String(course.lecturer ?? "Course Instructor"),',
  '              learners: Number(course.learners ?? 0),',
  '              resources: Number(course.resources ?? 0),',
  '              updated: String(course.updated ?? new Date().toISOString()),',
  '              present: Number(course.present ?? 0),',
  '              total: Number(course.total ?? 0),',
  '              status: course.status ?? "Good standing",',
  '              unit: Number(course.unit ?? 0),',
  '              semester: String(course.semester ?? ""),',
  '              academicSession: String(course.academicSession ?? ""),',
  '            }))',
  '          : [];',
  '',
  '        setCourseItems(items);',
  '      } catch {',
  '        setError("Unable to load your courses right now.");',
  '        setCourseItems([]);',
  '      } finally {',
  '        setLoading(false);',
  '      }',
  '    }',
  '',
  '    loadCourses();',
  '  }, []);',
  '',
  '  const visible = courseItems.filter((course) => `${course.code} ${course.title}`.toLowerCase().includes(query.toLowerCase()));',
  '',
  '  return <div className="prototype-content"><PageIntro eyebrow="ACADEMIC RECORD" title="My Courses" text="Keep track of your current courses, learning progress, and resources in one place." />{selected ? <section className="detail-panel card"><button className="text-button" onClick={() => setSelected(null)} type="button">← Back to courses</button><p className="eyebrow">{selected.code}</p><h2>{selected.title}</h2><p>{selected.description}</p><div className="stats-grid"><div><span>Unit</span><strong>{selected.unit ?? 0}</strong></div><div><span>Semester</span><strong>{selected.semester ?? "—"}</strong></div><div><span>Academic Session</span><strong>{selected.academicSession ?? "—"}</strong></div></div><div className="progress-label"><span>Course progress</span><strong>{Math.min(100, Math.max(0, selected.total ? Math.round((selected.present / selected.total) * 100) : 0))}%</strong></div><div className="progress-track"><span style={{ width: `${Math.min(100, Math.max(0, selected.total ? Math.round((selected.present / selected.total) * 100) : 0))}%` }} /></div><button className="primary-button" type="button" onClick={() => window.alert("Course materials are ready for review.")}>Open materials</button></section> : <><div className="toolbar card"><label htmlFor="course-search">Search courses</label><input id="course-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by code or course name" /></div>{loading ? <div className="empty-state card"><span className="empty-icon">○</span><h3>Loading courses...</h3><p>Please wait while we load your enrolled courses.</p></div> : error ? <div className="empty-state card"><span className="empty-icon">○</span><h3>Unable to load courses</h3><p>{error}</p></div> : visible.length === 0 ? <div className="empty-state card"><span className="empty-icon">○</span><h3>No courses found</h3><p>You are not currently enrolled in any courses.</p></div> : <div className="prototype-course-grid">{visible.map((course) => <article className="prototype-course card" key={course.id}><div className="course-title"><div><strong>{course.code}</strong><h3>{course.title}</h3></div><span className="course-chip">{course.unit ?? 0} units</span></div><p>{course.description}</p><div className="course-detail"><span>Semester<strong>{course.semester ?? "—"}</strong></span><span>Session<strong>{course.academicSession ?? "—"}</strong></span></div><div className="course-bar"><span style={{ width: `${Math.min(100, Math.max(0, course.total ? Math.round((course.present / course.total) * 100) : 0))}%` }} /></div><button className="text-button" type="button" onClick={() => setSelected(course)}>View details</button></article>)}</div>}</>}{selected && <div style={{ marginTop: 16 }} />}</div>;',
  '}',
  '',
].join('\n');
fs.writeFileSync(path, before + replacement + after);
console.log('Updated app/page.tsx');
