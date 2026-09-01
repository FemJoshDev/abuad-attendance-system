# ABUAD Attendance Management System

## Project Overview

This repository contains a Next.js attendance management prototype for the ABUAD student portal. The application currently combines a frontend prototype with a real authentication and data layer built on PostgreSQL and Prisma.

The current codebase includes:

- a student login flow using NextAuth credentials
- route protection for authenticated pages
- Prisma models for users, courses, enrollments, and attendance
- real backend API routes for courses and attendance summary data
- a dashboard and course UI shell that is partly connected to live data and partly still backed by mock data

This project is best described as a hybrid prototype: some pieces are fully functional backend features, while others are still UI/mock-based placeholders.

## Problem Statement

The product aims to help students track attendance, view course participation, and see attendance-related alerts while preserving a campus portal style UI. The system is intended to support a student-facing workflow where attendance records are calculated from real database data rather than manually stored percentage values.

## Current Development Status

| Area | Status | Notes |
| --- | --- | --- |
| Next.js app shell | Implemented | App Router project with page routing and session handling |
| Student login | Implemented | Credentials auth with NextAuth and Prisma |
| Route protection | Implemented | Middleware protects dashboard, courses, notifications, complaints, and settings |
| Prisma schema | Implemented | PostgreSQL models exist for users, courses, attendance, and support data |
| Course API | Implemented | Student courses are fetched from Prisma-backed routes |
| Dashboard backend | Implemented | /api/dashboard returns calculated attendance summaries |
| Attendance service | Implemented | Centralized calculation logic exists |
| Attendance history API | Implemented | Pagination and record retrieval exists |
| My Courses UI | Partially implemented | Connected to /api/courses but some presentation remains prototype-like |
| Dashboard UI | Partially implemented | Uses live API data, but some UI values and content still rely on existing prototype patterns |
| Notifications backend | Not implemented | Page exists as a frontend slice, but no real backend API |
| Complaints backend | Not implemented | Form exists but no persistence layer |
| Lecturer/admin flows | Not implemented | Roles exist in Prisma but no corresponding UI/backend modules are present |
| Production deployment | Not implemented | Local development is the current target |

## Technology Stack

The project currently uses the following technologies that are actually present in the repository:

- Next.js 16.3.2 — app router application framework
- React 19 — UI rendering layer
- TypeScript — application typing
- PostgreSQL — primary database engine
- Prisma ORM — schema, migrations, database access, seed support
- NextAuth v4 — credentials-based authentication
- bcryptjs — password hashing and verification
- Tailwind CSS — installed and configured via PostCSS; current UI uses custom CSS plus some utility-oriented styling patterns
- ESLint — code quality checks
- Node.js runtime — backend execution environment

Technologies not found as meaningful implementation artifacts include:

- Zod
- React Hook Form
- Zustand
- Apollo / GraphQL
- Axios
- SWR
- React Query
- Lucide Icons
- any charting library

## Architecture Summary

The project is currently a hybrid of prototype frontend and real backend foundations.

```text
User
  ↓
Next.js App Router
  ↓
Login / protected pages
  ↓
NextAuth Credentials Provider
  ↓
Prisma Client
  ↓
PostgreSQL
```

For attendance-related logic, the architecture is:

```text
Frontend page
  ↓
API route handler
  ↓
Attendance service
  ↓
Prisma queries
  ↓
PostgreSQL attendance records
```

The app is not fully backend-driven across every screen. Some pages still present prototype/mock data rather than database-backed views.

## Current Features

### Implemented Features

- Student login page with email or matric number input
- NextAuth credentials authentication flow
- Role-based route protection via middleware
- Prisma-based user model and password hashing
- Course retrieval API for the authenticated student
- Course detail API with enrollment verification
- Dashboard API with overall attendance summary and course-level summaries
- Attendance service with percentage calculations from attendance records
- Attendance history API with pagination
- Seed script for demo student/lecturer/admin users and sample course data
- PostgreSQL schema setup with Prisma

### Partially Implemented Features

- Dashboard UI is connected to live data, but still uses a single-page shell and prototype styling patterns
- My Courses page loads from /api/courses, but presentation remains a prototype pattern rather than a fully modern data-driven view
- Notifications UI exists but does not have a dedicated backend for persistence
- Complaints screen exists as a frontend-only form without server storage
- Settings pages exist as prototype screens rather than connected account management flows

### Planned Features

- Lecturer dashboard and attendance marking flows
- Admin dashboard and administrative controls
- persistent complaints backend
- notification backend and push/email integration
- full student profile editing backend
- production deployment and operational hardening

## Project Structure

```text
.
├── app/
│   ├── api/
│   │   ├── attendance/
│   │   │   └── route.ts
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts
│   │   ├── courses/
│   │   │   ├── route.ts
│   │   │   └── [courseId]/
│   │   │       ├── route.ts
│   │   │       └── attendance/
│   │   │           └── route.ts
│   │   └── dashboard/
│   │       └── route.ts
│   ├── complaints/
│   │   └── page.tsx
│   ├── courses/
│   │   └── page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   ├── login/
│   │   └── page.tsx
│   ├── notifications/
│   │   └── page.tsx
│   ├── page.tsx
│   ├── providers.tsx
│   ├── settings/
│   │   ├── authentication/
│   │   ├── email/
│   │   ├── page.tsx
│   │   └── preferences/
│   └── student/
│       └── dashboard/
│           └── page.tsx
├── docs/
│   ├── attendance-architecture.md
│   └── database-architecture.md
├── mock/
│   ├── academicData.ts
│   ├── attendance.ts
│   ├── courses.ts
│   └── student.ts
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.ts
├── public/
├── src/
│   ├── lib/
│   │   ├── password.ts
│   │   └── prisma.ts
│   ├── services/
│   │   ├── attendance.service.ts
│   │   └── course.service.ts
│   ├── middleware.ts
│   └── types/
│       └── course.ts
├── .env
├── .env.example
├── AGENTS.md
├── CLAUDE.md
├── eslint.config.mjs
├── next.config.ts
├── next-env.d.ts
├── package.json
├── package-lock.json
├── postcss.config.mjs
├── prisma
├── tsconfig.json
└── README.md
```

## Frontend Pages and Status

### / (root)

The root page acts as the main portal shell and login entry point. It contains route-like UI switching and uses session state from NextAuth.

### /login

Login page exists and is functional for credentials-based authentication.

### /student/dashboard

Dashboard page exists and is wired to live attendance data through /api/dashboard, but it still retains prototype patterns and static shell-like rendering in the current page file.

### /courses

Course page exists and reads course data from /api/courses.

### /notifications

Notifications page exists as a UI prototype and does not have a persisted backend data source.

### /complaints

Complaints page exists as a frontend form and does not persist complaint submissions.

### /settings

Settings screens exist for profile, email, authentication, and preferences. They are prototype UI screens and not connected to a backend persistence system.

## Database Architecture

The Prisma schema is defined in [prisma/schema.prisma](prisma/schema.prisma).

### Actual Models

- User
  - stores authentication data, role, basic identity, and related profile references
- StudentProfile
  - student-specific academic metadata such as department, faculty, level, and academic session
- Course
  - course definition and academic metadata
- Enrollment
  - links students to courses and academic session/semester context
- AttendanceSession
  - represents one class session for a course
- AttendanceRecord
  - stores a single student's result for one session
- Notification
  - stores user notifications
- Complaint
  - supports complaint records and status tracking
- UserPreferences
  - stores personal notification and UI preferences

### Enums

- UserRole: STUDENT, LECTURER, ADMIN
- AttendanceStatus: PRESENT, ABSENT, LATE, EXCUSED
- NotificationType: ATTENDANCE, COURSE, SYSTEM, WARNING
- ComplaintCategory: TECHNICAL_ISSUE, COURSE_ISSUE, ACCOUNT_ISSUE, CONTENT_ISSUE, PAYMENT_ISSUE, OTHER
- ComplaintPriority: LOW, MEDIUM, HIGH
- ComplaintStatus: PENDING, IN_REVIEW, RESOLVED, CLOSED

### Relationship Notes

- One User can have one StudentProfile
- One User can have many Enrollments
- One Course can have many Enrollments
- One Course can have many AttendanceSessions
- One AttendanceSession can have many AttendanceRecords
- One User can have many AttendanceRecords
- One User can have many Notifications
- One User can have many Complaints
- One User can have one UserPreferences

## Authentication and Authorization

Authentication is implemented with NextAuth credentials login.

### Actual Flow

1. User enters email or matric number and password on the login page
2. Credentials provider calls Prisma to find a user by email or matric number
3. Password hash is verified using bcryptjs
4. If valid, the provider returns a user object with id and role
5. JWT session stores the user id and role
6. Middleware protects student-facing routes

### Security Notes

- Passwords are hashed with bcryptjs via [src/lib/password.ts](src/lib/password.ts)
- Middleware uses NextAuth with a protected route matcher
- Session strategy is JWT
- Role checks are performed in API handlers before returning protected data

### Current Roles

Only the following roles are defined in the schema and used by the auth flow:

- STUDENT
- LECTURER
- ADMIN

The actual app is currently student-focused, and the most complete route access logic is around the student role.

## API Routes

The following endpoints are implemented in the current codebase:

| Method | Path | Purpose | Auth |
| --- | --- | --- | --- |
| GET | /api/auth/session | NextAuth session check | Required for session-aware routes |
| GET | /api/auth/providers | Lists auth providers | Public |
| GET | /api/auth/csrf | CSRF token info | Public |
| POST | /api/auth/callback/credentials | Credentials login callback | Public |
| GET | /api/courses | Fetch courses for the authenticated student | Required |
| GET | /api/courses/[courseId] | Fetch one enrolled course for the authenticated student | Required |
| GET | /api/courses/[courseId]/attendance | Fetch attendance summary for one course | Required |
| GET | /api/dashboard | Fetch student dashboard summary | Required |
| GET | /api/attendance | Fetch paginated student attendance history | Required |

## Services and Business Logic

### Course Service

File: [src/services/course.service.ts](src/services/course.service.ts)

This service exposes:

- getStudentCourses
- getStudentCourseById
- validateStudentCourseAccess

Its purpose is to limit course access to the authenticated student and ensure the server checks enrollment before returning data.

### Attendance Service

File: [src/services/attendance.service.ts](src/services/attendance.service.ts)

This file centralizes real attendance logic, including:

- overall attendance summary
- per-course attendance summary
- present/absent/late/excused counting
- percentage calculation
- low attendance warnings
- recent attendance history retrieval

### Password Utilities

File: [src/lib/password.ts](src/lib/password.ts)

This module contains:

- hashPassword
- verifyPassword
- validatePassword

## Data Flow

The actual data flow is mixed:

- some pages are still UI prototypes using mock seed data from [mock/academicData.ts](mock/academicData.ts)
- some pages and API handlers now pull real data from Prisma and PostgreSQL
- the backend logic centralizes course and attendance calculations in services

A practical description of the current implementation is:

```text
Frontend UI
  ↓
NextAuth session
  ↓
API route handlers
  ↓
Prisma service logic
  ↓
PostgreSQL database
```

This is not yet a fully unified “all pages from database” system. It is a staged prototype with real backend foundations.

## Mock Data Status

The repository still includes a mock data layer under [mock](mock):

- [mock/academicData.ts](mock/academicData.ts)
- [mock/attendance.ts](mock/attendance.ts)
- [mock/courses.ts](mock/courses.ts)
- [mock/student.ts](mock/student.ts)

This mock data is used by the current prototype UI and should be treated as sample data rather than the canonical source of truth for attendance calculations.

Attendance calculations should be interpreted as dynamic values from database-backed services, not from mock data files.

## Environment Variables

The project currently references the following environment variables in code and setup:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/abuad_attendance?schema=public"
NEXTAUTH_SECRET="replace-with-a-random-secret"
NEXTAUTH_URL="http://localhost:3000"
DEMO_STUDENT_PASSWORD=Student123!
DEMO_LECTURER_PASSWORD=Lecturer123!
DEMO_ADMIN_PASSWORD=Admin123!
```

The repo contains [.env.example](.env.example), but it currently only includes the database URL. The README is the authoritative documentation for the current required values.

## Database Setup

To set up the database locally:

1. Ensure PostgreSQL is running on localhost:5432
2. Create a database named abuad_attendance
3. Set DATABASE_URL in the project environment
4. Run Prisma schema sync:

```bash
npx prisma db push
```

5. Seed demo records:

```bash
npx prisma db seed
```

## Available Scripts

The project defines the following scripts in [package.json](package.json):

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run db:generate
npm run db:migrate
npm run db:deploy
npm run db:seed
npm run db:studio
```

## Development Setup

### Prerequisites

- Node.js 20+
- PostgreSQL installed locally
- access to a database named abuad_attendance
- npm package manager

### Install dependencies

```bash
npm install
```

### Configure environment variables

Create a local .env file in the project root and add the values described above.

### Run the app

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

If port 3000 is occupied, Next.js may automatically choose another port such as 3001.

## Demo Credentials

The seed file creates demo accounts with the following values:

- Student email: joshua.ojo@abuad.edu.ng
- Student matric number: ******
- Student password: ******

Other demo accounts include:

- Lecturer: **********
- Admin: ******

These values are created by [prisma/seed.ts](prisma/seed.ts) and should be treated as prototype seed credentials only.

## Known Limitations

The project is not a production-ready attendance platform yet. Current limitations include:

- some screens still rely on mock data and prototype presentations
- notifications are not backed by a real API endpoint
- complaints are not persisted to the database
- lecturer/admin features are not implemented as complete workflows
- there is no production deployment configuration
- profile updates and account management are still prototype-only
- not every route is fully backend-driven

## Development Roadmap

The current project direction suggests future work in the following areas:

- lecturer attendance marking workflows
- admin analytics and approvals
- complaint backend persistence
- notification backend and email delivery
- full profile management and settings persistence
- production-ready auth hardening and deployment
- expanded attendance analytics and reports

## Documentation Notes

This README was written from the current repository state only. It intentionally avoids claiming features that are not present in the codebase.

The following documentation files also exist and reflect the project’s underlying architecture:

- [docs/database-architecture.md](docs/database-architecture.md)
- [docs/attendance-architecture.md](docs/attendance-architecture.md)

## License

No explicit project license file was found in the current repository.

## Summary

The repository is a working Next.js prototype with real database-backed authentication and attendance APIs, but it is not yet a fully completed attendance system. The strongest implemented areas are:

- authentication
- route protection
- Prisma schema and database setup
- course API
- dashboard attendance service and API

The weakest areas are still the complete persistence of notifications, complaints, and broader admin/lecturer workflows.
