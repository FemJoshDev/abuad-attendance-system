export default function AdminAttendancePage() {
  return <main><h1>Attendance Administration</h1><p>Review attendance sessions and export records through the protected server endpoint.</p><a href="/api/admin/attendance" download="attendance-export.csv">Download Attendance CSV</a></main>;
}