export const attendanceRecords = [
  { course: "Anatomy", code: "MBBS 501", date: "Aug 21, 2024", time: "08:00 AM", lecturer: "Dr. O. Williams", status: "Present" },
  { course: "Physiology", code: "MBBS 503", date: "Aug 20, 2024", time: "10:30 AM", lecturer: "Prof. A. Salami", status: "Present" },
  { course: "Biochemistry", code: "MBBS 505", date: "Aug 19, 2024", time: "02:00 PM", lecturer: "Dr. K. Nwachukwu", status: "Absent" },
  { course: "Pharmacology", code: "MBBS 504", date: "Aug 18, 2024", time: "09:00 AM", lecturer: "Dr. E. Ajayi", status: "Present" },
] as const;

export const attendanceNotifications = [
  { text: "MBBS 501 attendance is currently open.", time: "Now", kind: "open" },
  { text: "MBBS 503 attendance closes in 5 minutes.", time: "5 min", kind: "soon" },
  { text: "Your Biochemistry attendance is approaching the required threshold.", time: "Today", kind: "attention" },
] as const;