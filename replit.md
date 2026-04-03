# ATS Platform Workspace

## Overview

ATS (Applicant Tracking System) SaaS platform using a product-based architecture. pnpm workspace monorepo with TypeScript. Each package manages its own dependencies.

## Architecture

The codebase follows the Architecture Standards document (`ARCHITECTURE_STANDARDS.md`). Key structure:

- **`src/products/`** — 9 bounded contexts: requisitions, candidates, screening, interviews, offers, onboarding, marketplace, analytics, notifications. Each product owns its API, services, repositories, events, models, validators, and tests.
- **`src/shared/`** — Cross-cutting concerns: error hierarchy (AppError + typed subclasses), JWT auth middleware, HTTP middleware (security headers, rate limiting, request ID), pagination models, common validators.
- **`src/infrastructure/`** — Cloud abstraction interfaces: IFileStorageService, IMessageBusService, ICacheService, IAIService, IEmailService, ICalendarService, IIdentityService, ISecretsService.
- **`src/config/`** — App config, database config, feature flags config.
- **`migrations/`** — Per-product migration subfolders.
- **`tests/`** — e2e and load test directories.
- **`docs/adr/`** — Architecture Decision Records.

## GitHub Repository

- **Repo:** https://github.com/touring605-maker/ats-platform
- **Note:** `.github/workflows/` files (PR pipeline + deploy pipeline) exist locally but could not be pushed to GitHub due to OAuth scope limitations (missing `workflow` scope). Push these manually with a token that has the `workflow` scope.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
