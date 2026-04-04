# LastATS Platform Workspace

## Overview

LastATS — Applicant Tracking System SaaS platform using a product-based architecture. pnpm workspace monorepo with TypeScript.

## Architecture

The codebase follows the Architecture Standards document (`ARCHITECTURE_STANDARDS.md`). Key structure:

- **`lib/db/src/schema/`** — Drizzle ORM schema: organizations, organizationMembers, jobs, candidates, applications, applicationRatings
- **`artifacts/api-server/`** — Express 5 API server with Clerk auth, tenant-isolated routes for jobs, candidates, applications, organizations
- **`lib/api-spec/`** — OpenAPI 3.1 spec with Orval codegen
- **`src/products/`** — 9 bounded contexts (scaffold): requisitions, candidates, screening, interviews, offers, onboarding, marketplace, analytics, notifications
- **`src/shared/`** — Cross-cutting concerns: error hierarchy, HTTP middleware (logging, CORS, security headers, rate limiting)
- **`src/infrastructure/`** — Cloud abstraction interfaces
- **`src/config/`** — App, database, and feature flags config

## Authentication

- **Provider**: Clerk (auto-provisioned)
- **Server middleware**: `@clerk/express` — `clerkMiddleware()` + custom `requireAuth` and `requireOrgMembership` middleware
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

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Auth**: Clerk
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/api-server run seed` — seed demo data (Acme Corporation org + sample jobs/candidates/applications)

## API Endpoints

- `GET /api/healthz` — health check (public)
- `GET /api/organizations/mine` — get current user's orgs (auth required)
- `GET/POST /api/jobs` — list/create jobs (org membership required)
- `GET/PATCH/DELETE /api/jobs/:id` — get/update/delete job
- `GET/POST /api/candidates` — list/create candidates
- `GET/PATCH/DELETE /api/candidates/:id` — get/update/delete candidate
- `GET /api/applications` — list applications (filterable by jobId, status)
- `GET /api/applications/:id` — get application detail with ratings
- `PATCH /api/applications/:id/status` — update application status
- `GET/POST /api/applications/:id/ratings` — get/add ratings
