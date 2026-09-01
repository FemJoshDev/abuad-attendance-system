# Database Architecture

## Overview

The attendance system is built around an academic data model that reflects the current ABUAD student portal prototype. The frontend already standardizes around the College of Medicine & Health Sciences and MBBS course codes, so the database keeps that context consistent rather than introducing unrelated academic prototypes.

## Core entities

- User: stores the identity and role for all platform actors, including future student, lecturer, and admin accounts.
- StudentProfile: holds the academic details specific to a student, such as department, faculty, level, and academic session.
- Course: stores the course definition, including code, title, unit, semester, and academic session.
- Enrollment: maps a user to a course for a specific academic session/semester in a normalized many-to-many relationship.
- AttendanceSession: represents a specific class or lecture date and time for a course.
- AttendanceRecord: stores the attendance status for one student in one session.
- Notification: tracks notices and alerts specific to a user.
- Complaint: captures account or academic issues raised by users.
- UserPreferences: stores notification and language settings for each user.

## Relationships

- One User may have one StudentProfile.
- One User may have many Enrollments.
- One Course may have many Enrollments.
- One Course may have many AttendanceSessions.
- One AttendanceSession may have many AttendanceRecords.
- One User may have many AttendanceRecords.
- One User may have many Notifications.
- One User may have many Complaints.
- One User may have one UserPreferences.

## Why Enrollment exists

Enrollment is necessary because a student can take many courses and a course can be taken by many students. Storing a single course list directly on the student would duplicate academic relationships and make it difficult to track the same student across multiple terms or sessions.

## Why AttendanceSession and AttendanceRecord are separate

AttendanceSession models the class itself (for example, MBBS 501 on a specific date and time). AttendanceRecord captures the individual outcome for each student in that class. This avoids storing a single percentage or a duplicate field on the course and makes it possible to calculate attendance accurately from actual attendance events.

## Attendance calculation approach

Attendance percentage is calculated later from AttendanceRecord rows, not stored as a denormalized value.

A typical calculation is:

- Present and Late statuses count as attended when required by the academic rule.
- Absent and Excused statuses are treated according to policy.
- The percentage is computed as:

  $$\text{attendance\%} = \frac{\text{attended sessions}}{\text{total recorded sessions}} \times 100$$

The database keeps the raw session and status data, and reporting logic determines the final percentage in application code or SQL.

## Persisted in PostgreSQL

The following data is persisted in PostgreSQL:

- user accounts and roles
- student academic profiles
- course definitions
- enrollment records
- attendance sessions and statuses
- notifications
- complaints
- user preferences

## Frontend-only preference for now

The application currently stores theme preference locally in browser storage. That remains appropriate for Phase 1 because it is a UI preference and does not require server persistence. The database model already includes an optional `theme` field in `UserPreferences` so it can be moved to the backend later without schema changes.
