# LastATS Platform Workspace

## Overview

LastATS — Applicant Tracking System SaaS platform using a product-based architecture. pnpm workspace monorepo with TypeScript.

## Architecture

The codebase follows the Architecture Standards document (`ARCHITECTURE_STANDARDS.md`). Key structure:

- **`lib/db/src/schema/`** — Drizzle ORM schema: organizations, organizationMembers, jobs, candidates, applications, applicationRatings
- **`artifacts/api-server/`** — Express 5 API server with Clerk auth, tenant-isolated routes for jobs, candidates, applications, organizations, dashboard
- **`artifacts/employer-dashboard/`** — React + Vite employer dashboard with Clerk auth, Shadcn UI, TanStack Query
- **`lib/api-spec/`** — OpenAPI 3.1 spec with Orval codegen
- **`lib/api-zod/`** — Generated Zod schemas from OpenAPI spec (used for server-side validation)

## Authentication

- **Provider**: Clerk (auto-provisioned)
- **Server middleware**: `@clerk/express` — `clerkMiddleware()` + custom `requireAuth` and `requireOrgMembership` middleware
- **Frontend**: `@clerk/clerk-react` — ClerkProvider, SignIn, OrganizationSwitcher, useAuth/useOrganization hooks
- **Tenant isolation**: `X-Organization-Id` header on all org-scoped requests, membership verified against `organization_members` table
- **Roles**: admin, hiring_manager, viewer

## Database Tables

- `organizations` — tenant/company records with slug, branding
- `organization_members` — maps Clerk users to orgs with roles
- `jobs` — job postings with status lifecycle (draft→published→closed→archived), custom application form fields
- `candidates` — candidate profiles scoped to organization
- `applications` — links candidates to jobs with status pipeline (new→reviewed→shortlisted→rejected/hired)
- `application_ratings` — 1-5 star ratings per application per reviewer

## GitHub Repository

- **Repo:** https://github.com/touring605-maker/ats-platform
- **Remote name:** `github` (not `origin`)

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Auth**: Clerk
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
- `GET /api/organizations/mine` — get current user's orgs (auth required)
- `GET /api/dashboard/summary` — dashboard overview with stats, pipeline, recent jobs (org membership required)
- `GET /api/jobs/stats` — job counts by status (org membership required)
- `GET/POST /api/jobs` — list/create jobs (org membership required); list includes applicationCount per job
- `GET/PATCH/DELETE /api/jobs/:id` — get/update/delete job
- `GET/POST /api/candidates` — list/create candidates
- `GET/PATCH/DELETE /api/candidates/:id` — get/update/delete candidate
- `GET /api/applications` — list applications (filterable by jobId, status)
- `GET /api/applications/:id` — get application detail with ratings
- `PATCH /api/applications/:id/status` — update application status
- `GET/POST /api/applications/:id/ratings` — get/add ratings

## Frontend Pages (employer-dashboard)

- `/` — Dashboard with stats cards, application pipeline, recent jobs
- `/jobs` — Jobs list with search, status filter, pagination, CRUD
- `/jobs/new` — Create job form
- `/jobs/:id` — Job detail with status management (publish/close/archive)
- `/jobs/:id/edit` — Edit job form
- `/candidates` — Candidates list with search
- `/applications` — Applications list with status filter
- `/settings` — Organization settings (Clerk OrganizationProfile)

## Important Notes

- Express 5: `req.params.id` must be cast as `string` 
- CORS: configured via `ALLOWED_ORIGINS` env var (comma-separated), defaults to `https://${REPLIT_DEV_DOMAIN}`
- API Zod index.ts only re-exports from `./generated/api` (not types, to avoid name conflicts)
- `.github/workflows/` files cannot be pushed via OAuth — gitignored; push manually with PAT with workflow scope
