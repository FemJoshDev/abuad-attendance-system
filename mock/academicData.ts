import { attendanceNotifications, attendanceRecords } from "./attendance";
import { courses } from "./courses";
import { student } from "./student";

export type PortalNotification = {
  id: number;
  title: string;
  message: string;
  time: string;
  category: "Course" | "System";
  unread: boolean;
  icon: "book" | "bell" | "settings" | "alert";
};

export const academicData = {
  student,
  courses,
  attendanceRecords,
  attendanceNotifications,
  notifications: [
    { id: 1, title: "Course material successfully uploaded", message: "New materials are available in MBBS 505 Biochemistry.", time: "10 minutes ago", category: "Course", unread: true, icon: "book" },
    { id: 2, title: "New course announcement", message: "Your lecturer shared an announcement for MBBS 501 Anatomy.", time: "2 hours ago", category: "Course", unread: true, icon: "bell" },
    { id: 3, title: "Teaching card generation completed", message: "Your attendance teaching card is ready to view.", time: "Yesterday", category: "System", unread: true, icon: "settings" },
    { id: 4, title: "System update", message: "The attendance portal will be updated this weekend.", time: "3 days ago", category: "System", unread: false, icon: "alert" },
  ] as PortalNotification[],
  complaints: [
    { id: "CMP-2048", subject: "Attendance record correction", category: "Course Issue", date: "Aug 18, 2024", status: "In Review", priority: "Medium" },
    { id: "CMP-1992", subject: "Unable to access teaching card", category: "Technical Issue", date: "Aug 05, 2024", status: "Resolved", priority: "High" },
    { id: "CMP-1876", subject: "Update department information", category: "Account Issue", date: "Jul 22, 2024", status: "Pending", priority: "Low" },
  ],
} as const;

export { student, courses, attendanceRecords, attendanceNotifications };
export type { Course, Semester } from "./courses";

export const courseAttendance = (course: { present: number; total: number }) => Math.round((course.present / course.total) * 100);

export const overallAttendance = {
  present: 42,
  total: 51,
};
