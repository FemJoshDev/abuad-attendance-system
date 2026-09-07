# ABUAD Attendance Management System

Next.js attendance portal for students, lecturers, and administrators. The application uses PostgreSQL through Prisma and credentials authentication through NextAuth.

## Requirements

- Node.js 20 or newer
- npm
- PostgreSQL 14 or newer
- An S3-compatible object storage bucket for production profile photos

## Environments

Local development can use `STORAGE_PROVIDER=local` and a disposable PostgreSQL database. Staging should use a separate database, storage bucket, authentication secret, and seed credentials. Production must use managed PostgreSQL, an S3-compatible bucket, HTTPS, strong secrets, and provider-managed backups.

## Environment Variables

Copy `.env.example` to `.env.local` for local development. The file contains placeholders only.

Required in production:

- `DATABASE_URL`: PostgreSQL connection string. Use the provider's pooled/runtime URL for the application and its direct connection URL when the provider requires one for migrations.
- `NEXTAUTH_SECRET`: long random secret, unique to the environment.
- `NEXTAUTH_URL`: public HTTPS URL of the application.
- `STORAGE_PROVIDER=s3`
- `STORAGE_BUCKET`, `STORAGE_REGION`, `STORAGE_PUBLIC_URL`, `STORAGE_ACCESS_KEY_ID`, and `STORAGE_SECRET_ACCESS_KEY`
- `STORAGE_ENDPOINT` only when the provider is S3-compatible but not AWS; set `STORAGE_FORCE_PATH_STYLE=true` when required by that provider.

Never commit `.env`, `.env.local`, `.env.production`, database URLs, access keys, or passwords.

## PostgreSQL and Prisma

Create an empty PostgreSQL database with the production provider, then configure `DATABASE_URL` in the deployment environment. Apply the checked-in migration history with:

```powershell
npx prisma migrate deploy
npx prisma generate
```

Verify the resulting schema with the provider's database inspection tools and the application's health/smoke checks. Do not use `prisma migrate reset` against production. Do not use `prisma db push` for production schema changes. New schema changes must be developed as reviewed migrations and deployed with `prisma migrate deploy`.

The migration history is ordered and additive: the initial schema is followed by indexes, the avatar URL column, and lecturer portal operations. A disposable PostgreSQL database should be used to replay all migrations before a release. This repository cannot verify a real production database without its external connection details.

## Profile Photo Storage

The avatar route validates MIME type, file signature, and a 5 MB limit, then stores the object through `src/lib/storage.ts` and saves only its resulting URL in `User.avatarUrl`. The authenticated session identity determines the object path, so a client cannot select another user's avatar record.

Local development uses `public/uploads/avatars`. Production defaults to the S3 adapter and requires the storage variables above. Configure a private bucket with a public read URL or a CDN URL for the object path, restrict the access key to the avatar bucket, and configure lifecycle cleanup according to the provider. No storage provider or bucket is configured in this repository.

## Authentication and Seed Data

NextAuth credentials authentication requires a production HTTPS `NEXTAUTH_URL` and non-default `NEXTAUTH_SECRET`. Demo seed data is blocked when `NODE_ENV=production`. For local development:

```powershell
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Provide `DEMO_STUDENT_PASSWORD`, `DEMO_LECTURER_PASSWORD`, and `DEMO_ADMIN_PASSWORD` explicitly in staging. Never use demo credentials in production.

## Build and Deployment

```powershell
npm ci
npx prisma generate
npx prisma migrate deploy
npm run lint
npm test
npx tsc --noEmit
npm run build
npm start
```

Run migrations as a release step before starting the application. Use HTTPS at the edge, forward the correct public URL, and keep application logs free of credentials, tokens, passwords, and uploaded file contents.

## Backups and Recovery

Backups are **not configured by this repository**. Enable automated backups and point-in-time recovery on the selected managed PostgreSQL provider before production launch. Recommended operational targets are daily snapshots, point-in-time recovery where available, documented retention, least-privilege restore access, and a periodic restore test into a disposable database. Store backup credentials outside the repository. Object storage should have versioning or an equivalent recovery policy if profile-photo recovery is required.

## Testing and Smoke Checks

Repository checks cover attendance calculation rules and static/type/build validation. Backend routes derive authorization from the server session and database role; role and ownership smoke tests still require a running PostgreSQL instance with test accounts. Before release, manually verify student, lecturer, and admin workflows, notification ownership/read authorization, complaint ownership/status authorization, profile ownership, avatar persistence across logout/login, and role boundaries.

Run the automated checks with:

```powershell
npm test
npm run lint
npx tsc --noEmit
npx prisma validate
npx prisma generate
npm run build
```

## Troubleshooting and Rollback

- Authentication failures: verify HTTPS `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, and the deployment's cookie/proxy configuration.
- Database failures: verify the runtime connection URL, pool limits, SSL requirements, and that `npx prisma migrate deploy` completed.
- Avatar failures: verify all `STORAGE_*` variables, bucket permissions, public URL mapping, and object CORS/CDN rules.
- Migration failure: stop the release, preserve the error and migration state, and resolve it with a forward migration or provider-supported restore. Do not reset production or edit the migration table manually.
- Application rollback: deploy the previous application version only when its schema remains compatible; restore the database only through the provider's documented recovery process and a rehearsed runbook.

## Current Production Boundary

Configured in the repository: application security headers, HTTPS/auth configuration checks, server-side role/ownership checks, migration scripts, production-disabled demo seeding, S3-compatible avatar integration, and deployment documentation.

Required externally before production: managed PostgreSQL creation and verification, storage bucket and credentials, production secrets, provider backups/PITR and restore test, deployment URL/proxy configuration, and full authenticated smoke testing against that infrastructure.
