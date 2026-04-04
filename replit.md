# LastATS Platform Workspace

## Overview

LastATS — Applicant Tracking System SaaS platform using a product-based architecture. pnpm workspace monorepo with TypeScript.

## Architecture

The codebase follows the Architecture Standards document (`ARCHITECTURE_STANDARDS.md`). Key structure:

- **`lib/db/src/schema/`** — Drizzle ORM schema: users, organizations, organizationMembers, jobs, candidates, applications, applicationRatings
- **`artifacts/api-server/`** — Express 5 API server with built-in email/password auth (bcryptjs + express-session), tenant-isolated routes for jobs, candidates, applications, organizations, dashboard
- **`artifacts/employer-dashboard/`** — React + Vite employer dashboard with built-in auth, Shadcn UI, TanStack Query
- **`artifacts/careers-page/`** — React + Vite public careers page (no auth), job listings, application form with resume upload
- **`lib/api-spec/`** — OpenAPI 3.1 spec with Orval codegen
- **`lib/api-zod/`** — Generated Zod schemas from OpenAPI spec (used for server-side validation)

## Authentication

- **Provider**: Built-in email/password auth (bcryptjs for hashing, express-session + connect-pg-simple for sessions)
- **Server middleware**: Session-based `requireAuth` and `requireOrgMembership` middleware (no external auth provider)
- **Frontend**: Custom AuthProvider context (`src/hooks/use-auth.tsx`) — manages login, register, logout, persona login, org selection
- **Dev bypass**: Quick Access panel on login page shows seeded personas (only in NODE_ENV=development, via GET /api/auth/personas)
- **Tenant isolation**: `X-Organization-Id` header on all org-scoped requests, membership verified against `organization_members` table
- **Roles**: admin, hiring_manager, viewer
- **Session store**: PostgreSQL `session` table (auto-created by `ensureSessionTable()` in app.ts before server listens)
- **Demo credentials**: admin@acme-corp.example.com / password123, manager@acme-corp.example.com / password123, viewer@acme-corp.example.com / password123

## Database Tables

- `organizations` — tenant/company records with slug, branding
- `users` — user accounts with email, passwordHash, displayName
- `organization_members` — maps users to orgs with roles (userId references users.id)
- `jobs` — job postings with status lifecycle (draft→published→closed→archived), custom application form fields, `createdBy` uuid FK → users
- `candidates` — candidate profiles scoped to organization
- `applications` — links candidates to jobs with status pipeline (new→reviewed→shortlisted→rejected/hired)
- `application_ratings` — 1-5 star ratings per application per reviewer, `ratedBy` uuid FK → users
- `email_templates` — org-scoped email templates with merge field support (name, subject, htmlBody, textBody, mergeFields, isDefault)
- `email_logs` — email send history linked to applications/candidates (toEmail, subject, htmlBody, status, `sentBy` uuid FK → users, sentAt)

## GitHub Repository

- **Repo:** https://github.com/touring605-maker/ats-platform
- **Remote name:** `github` (not `origin`)

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Auth**: Built-in (bcryptjs + express-session + connect-pg-simple)
- **Database**: PostgreSQL + Drizzle ORM
- **Frontend**: React 19 + Vite + wouter (routing) + TanStack Query + Shadcn UI + Tailwind CSS
- **Validation**: Zod (`zod/v4`), `drizzle-zod`, generated Zod schemas from OpenAPI spec
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/api-server run seed` — seed demo data (Acme Corporation org + sample jobs/candidates/applications)
- `cd lib/db && npx tsc -p tsconfig.json` — build DB types (required before typechecking dependents)
- `cd lib/api-zod && npx tsc -p tsconfig.json` — build api-zod types

## API Endpoints

- `GET /api/healthz` — health check (public)
- `POST /api/auth/register` — register new user (email, password, displayName)
- `POST /api/auth/login` — login with email/password
- `POST /api/auth/logout` — logout (destroy session)
- `GET /api/auth/me` — get current user + organizations (session required)
- `GET /api/auth/personas` — list dev personas (dev only)
- `POST /api/auth/persona-login` — login as persona (dev only)
- `GET /api/organizations/mine` — get current user's orgs (auth required)
- `GET /api/dashboard/summary` — dashboard overview with stats, pipeline, recent jobs (org membership required)
- `GET /api/jobs/stats` — job counts by status (org membership required)
- `GET/POST /api/jobs` — list/create jobs (org membership required); list includes applicationCount per job
- `GET/PATCH/DELETE /api/jobs/:id` — get/update/delete job
- `GET/POST /api/candidates` — list/create candidates
- `GET/PATCH/DELETE /api/candidates/:id` — get/update/delete candidate
- `GET /api/applications` — list applications (filterable by jobId, status, search, minRating, dateFrom, dateTo; sortable by appliedAt, candidateName, rating, status; includes avgRating/ratingCount)
- `GET /api/applications/:id` — get application detail with ratings, candidate LinkedIn/source, job custom fields
- `PATCH /api/applications/:id/status` — update application status
- `PATCH /api/applications/:id/notes` — update internal notes
- `GET/POST /api/applications/:id/ratings` — get/add ratings (upsert per user)
- `GET /api/careers/:orgSlug` — public careers page: org info + published jobs (no auth)
- `GET /api/careers/:orgSlug/jobs/:jobId` — public job detail (no auth)
- `POST /api/careers/:orgSlug/jobs/:jobId/apply` — submit application with resume upload (no auth, multipart/form-data)
- `GET/POST /api/email-templates` — list/create email templates (org membership required)
- `GET /api/email-templates/seed-defaults` — seed default email templates (org membership required)
- `GET/PUT/DELETE /api/email-templates/:id` — get/update/delete email template
- `POST /api/applications/:id/email` — send individual email to candidate (org membership required)
- `GET /api/applications/:id/emails` — get email history for application
- `POST /api/applications/bulk-email` — send bulk email to selected candidates
- `GET /api/storage/objects/*` — serve private objects (auth required)
- `GET /api/storage/public-objects/*` — serve public objects (no auth)

## Frontend Pages (employer-dashboard)

- `/` — Dashboard with stats cards, application pipeline, recent jobs
- `/jobs` — Jobs list with search, status filter, pagination, CRUD
- `/jobs/new` — Create job form
- `/jobs/:id` — Job detail with status management (publish/close/archive)
- `/jobs/:id/edit` — Edit job form
- `/candidates` — Candidates list with search
- `/applications` — Applications list with search, job filter, status filter, sortable columns (date/name/rating/status), rating display, pagination
- `/applications/:id` — Application detail: candidate info, cover letter, custom field responses, resume download, internal notes, status updates, star rating with history, email send dialog, email history timeline
- `/email-templates` — Email templates management: list, create, edit, delete, preview, seed defaults, merge field insertion
- `/settings` — Account and organization settings

## Frontend Pages (careers-page)

- `/:orgSlug` — Organization careers landing: branding, job list with search/department/location filters
- `/:orgSlug/jobs/:jobId` — Job detail with rich text description/requirements, Apply Now button, inline application form with dynamic custom fields + resume upload

## Object Storage

- **Bucket ID**: stored in `DEFAULT_OBJECT_STORAGE_BUCKET_ID` env var
- **Private directory**: `PRIVATE_OBJECT_DIR` env var — for resumes and private uploads
- **Public paths**: `PUBLIC_OBJECT_SEARCH_PATHS` env var — comma-separated public asset directories
- **Resume uploads**: multer (memory storage, 10MB limit, PDF/DOC/DOCX only) → GCS via `objectStorageClient`
- **Resume path format**: `/objects/resumes/{orgId}/{jobId}/{timestamp}-{random}.{ext}`

## Important Notes

- Express 5: `req.params.id` must be cast as `string` 
- CORS: configured via `ALLOWED_ORIGINS` env var (comma-separated), defaults to `https://${REPLIT_DEV_DOMAIN}`
- API Zod index.ts only re-exports from `./generated/api` (not types, to avoid name conflicts)
- `.github/workflows/` files cannot be pushed via OAuth — gitignored; push manually with PAT with workflow scope
- Careers page requires no auth — public endpoints use `:orgSlug` path param for tenant scoping
- DOMPurify used on both employer dashboard and careers page for safe HTML rendering of job descriptions
- Email service: ConsoleEmailService (dev mode, logs to console); automated notifications on application submit + status change
- Email merge fields: `{{candidateName}}`, `{{candidateEmail}}`, `{{jobTitle}}`, `{{companyName}}`, `{{status}}`
- Notifications fire async after response to avoid blocking API responses
