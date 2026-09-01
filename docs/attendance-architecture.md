# Attendance Architecture

## Overview

The attendance system uses two separate Prisma models:

- `AttendanceSession`: represents one class meeting for a course.
- `AttendanceRecord`: represents one student's attendance record for a specific session.

This separation keeps attendance historical data accurate and allows each student to have exactly one record per session.

## Calculation rules

Attendance is calculated dynamically from actual database records and is never stored as the primary source of truth.

The prototype uses the following logic:

- `PRESENT` counts as attended
- `LATE` counts as attended
- `ABSENT` counts as absent
- `EXCUSED` is excluded from the attendance denominator

Attendance percentage formula:

`attendancePercentage = attendedSessions / eligibleSessions * 100`

Where:

- `attendedSessions = PRESENT + LATE`
- `eligibleSessions = totalSessions - EXCUSED`

## Low attendance threshold

The prototype uses a threshold of 75%.

If the calculated attendance percentage is below 75%, the student is flagged as low attendance.

## Authorization rules

Only authenticated student requests are allowed to access their own dashboard and attendance data. The backend verifies:

- valid session
- user exists
- user role is `STUDENT`
- student is enrolled in the requested course

This prevents cross-student data access by checking the server-side identities and enrollment records.

## Data consistency

Dashboard, My Courses, and attendance history all use the same central service logic, so percentages remain consistent across the application. Percentage values are derived from `AttendanceRecord` data instead of manually stored values.
