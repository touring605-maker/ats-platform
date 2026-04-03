# ATS Platform

Applicant Tracking System (ATS) SaaS platform built with a product-based architecture.

## Prerequisites

- Node.js 24+
- pnpm 9+
- PostgreSQL 16+

## Getting Started

1. **Clone the repository**

   ```bash
   git clone https://github.com/touring605-maker/ats-platform.git
   cd ats-platform
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and fill in your values. See `.env.example` for descriptions of each variable.

4. **Set up the database**

   ```bash
   pnpm --filter @workspace/db run push
   ```

5. **Start the development server**

   ```bash
   pnpm --filter @workspace/api-server run dev
   ```

## Project Structure

```
src/
├── products/          # Bounded contexts (requisitions, candidates, etc.)
├── shared/            # Cross-cutting concerns (auth, errors, middleware)
├── infrastructure/    # Cloud abstraction interfaces
├── config/            # App, database, and feature flag configuration
└── main.ts            # Application entry point

migrations/            # Per-product database migrations
tests/                 # e2e and load tests
docs/adr/              # Architecture Decision Records
.github/workflows/     # CI/CD pipelines
```

## Key Commands

| Command | Description |
|---------|-------------|
| `pnpm run typecheck` | Full typecheck across all packages |
| `pnpm run build` | Typecheck + build all packages |
| `pnpm --filter @workspace/api-spec run codegen` | Regenerate API hooks and Zod schemas |
| `pnpm --filter @workspace/db run push` | Push DB schema changes (dev only) |
| `pnpm --filter @workspace/api-server run dev` | Run API server locally |

## Architecture

This project follows the standards defined in `ARCHITECTURE_STANDARDS.md`. Key principles:

- **Product-based architecture** — code is organized by business domain, not technical layer
- **Interface-first design** — all services implement interfaces; dependencies are injected
- **Cloud agnostic** — cloud services are accessed through abstraction interfaces
- **Security by default** — JWT auth, rate limiting, security headers, input validation
- **Observable by default** — structured logging, request tracing, health checks

## Product Modules

| Module | Description |
|--------|-------------|
| Requisitions | Job requisition lifecycle |
| Candidates | Candidate profiles and applications |
| Screening | Phone screens and AI scoring |
| Interviews | Scheduling, panels, and feedback |
| Offers | Offer creation and approval |
| Onboarding | New hire task workflows |
| Marketplace | Job board integrations |
| Analytics | Reporting and hiring metrics |
| Notifications | Email and in-app notifications |

## License

MIT
