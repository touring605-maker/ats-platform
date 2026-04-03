# SaaS Solutions Architecture Standards
> Product-Based Architecture | Security | Scalability | Modularity  
> Version 1.0 — April 2026

---

## Table of Contents

1. [Purpose & Scope](#1-purpose--scope)
2. [Core Principles](#2-core-principles)
3. [Product-Based Architecture](#3-product-based-architecture)
4. [Project Structure](#4-project-structure)
5. [Module & Bounded Context Design](#5-module--bounded-context-design)
6. [API Design Standards](#6-api-design-standards)
7. [Data Architecture](#7-data-architecture)
8. [Authentication & Authorization](#8-authentication--authorization)
9. [Security Standards](#9-security-standards)
10. [Scalability Patterns](#10-scalability-patterns)
11. [Cloud Portability](#11-cloud-portability)
12. [Event-Driven Architecture](#12-event-driven-architecture)
13. [Error Handling & Resilience](#13-error-handling--resilience)
14. [Observability](#14-observability)
15. [CI/CD Standards](#15-cicd-standards)
16. [Testing Standards](#16-testing-standards)
17. [Dependency Management](#17-dependency-management)
18. [Documentation Standards](#18-documentation-standards)
19. [Replit-Specific Configuration](#19-replit-specific-configuration)
20. [Checklist: New Module Readiness](#20-checklist-new-module-readiness)

---

## 1. Purpose & Scope

This document defines the non-negotiable architecture standards for all SaaS product development hosted on Replit. Every engineer, contractor, and AI-assisted code generation workflow must conform to these standards before any module is merged to the main branch.

These standards govern:

- How the codebase is structured and decomposed into products and modules
- How services communicate, authenticate, and handle failures
- How data is stored, accessed, and migrated
- How the system is secured at every layer
- How the system scales horizontally without architectural rework
- How cloud infrastructure is abstracted for portability

These standards apply to all new work. Existing code that predates this document should be migrated to compliance on a module-by-module basis, tracked as technical debt items in the project backlog.

---

## 2. Core Principles

These principles take precedence over all implementation convenience. When a decision is unclear, return to these.

| # | Principle | What it means in practice |
|---|---|---|
| P1 | **Security by default** | Secure is the default state. Features are unlocked explicitly, not locked down after the fact. |
| P2 | **Explicit over implicit** | Behavior that is not visible in code should not exist. No magic, no hidden conventions. |
| P3 | **Fail loudly in dev, gracefully in prod** | Errors in development should be noisy and descriptive. In production, errors are handled and never expose internals. |
| P4 | **Boundaries are sacred** | A module does not reach into another module's data store, internals, or private methods. |
| P5 | **Cloud agnostic from day one** | No direct SDK calls to cloud provider services in business logic. All cloud calls go through abstraction interfaces. |
| P6 | **Observable by default** | Every service emits structured logs, metrics, and traces without requiring retrofitting. |
| P7 | **Scale out, not up** | Design for horizontal scaling. Do not assume a single instance will always serve traffic. |
| P8 | **Contracts before code** | API contracts, event schemas, and data models are defined and reviewed before implementation begins. |
| P9 | **Automate the boring** | If a task is performed more than twice manually, it must be automated. |
| P10 | **Test at the boundary** | Unit tests verify logic. Integration tests verify contracts. Do not test implementation details. |

---

## 3. Product-Based Architecture

### 3.1 What Product-Based Architecture Means

This system is organized around **products** (also called domains or bounded contexts), not around technical layers. A product encapsulates all of the code needed to deliver a specific business capability: its API, its data model, its business logic, its events, and its tests.

**Avoid this (layer-based):**
```
/src
  /controllers       ← all controllers for all features
  /services          ← all services for all features
  /repositories      ← all repos for all features
  /models            ← all models for all features
```

**Require this (product-based):**
```
/src
  /products
    /requisitions    ← everything for the requisitions domain
    /candidates      ← everything for the candidates domain
    /offers          ← everything for the offers domain
    /onboarding      ← everything for the onboarding domain
```

### 3.2 Product Boundaries

Each product owns:

- Its own API endpoints (controllers/route handlers)
- Its own business logic (services)
- Its own data access layer (repositories)
- Its own data schema/migrations
- Its own event producers and consumers
- Its own unit and integration tests
- Its own README

Each product does **not** own:

- Shared infrastructure (logging, auth middleware, storage abstractions) — these live in `/shared` or `/infrastructure`
- Another product's data store — cross-product data access is done via internal APIs or events only
- Global configuration — this lives in `/config`

### 3.3 Product Communication Rules

| Scenario | Allowed approach |
|---|---|
| Product A needs data from Product B | Call Product B's internal API endpoint |
| Product A needs to react to something that happened in Product B | Subscribe to Product B's published event |
| Product A needs a shared utility | Use a function from `/shared/utils` |
| Product A needs to directly query Product B's database | ❌ Never permitted |
| Product A imports Product B's internal service class | ❌ Never permitted |

---

## 4. Project Structure

```
/
├── src/
│   ├── products/                  # One folder per bounded context
│   │   ├── requisitions/
│   │   │   ├── api/               # Controllers / route handlers
│   │   │   ├── services/          # Business logic
│   │   │   ├── repositories/      # Data access (interfaces + implementations)
│   │   │   ├── events/            # Event producers and consumer handlers
│   │   │   ├── models/            # Domain models and DTOs
│   │   │   ├── validators/        # Input validation schemas
│   │   │   ├── tests/             # Unit and integration tests
│   │   │   └── README.md          # Module purpose, owners, contract summary
│   │   ├── candidates/
│   │   ├── screening/
│   │   ├── interviews/
│   │   ├── offers/
│   │   ├── onboarding/
│   │   ├── marketplace/
│   │   ├── analytics/
│   │   └── notifications/
│   │
│   ├── shared/                    # Cross-cutting concerns (no business logic)
│   │   ├── auth/                  # Auth middleware, token validation
│   │   ├── middleware/            # HTTP middleware (logging, rate limit, cors)
│   │   ├── utils/                 # Pure utility functions
│   │   ├── errors/                # Error classes and error handler
│   │   ├── pagination/            # Shared pagination models
│   │   └── validators/            # Common validation helpers
│   │
│   ├── infrastructure/            # Cloud abstraction layer
│   │   ├── storage/               # IFileStorageService + provider impls
│   │   ├── messaging/             # IMessageBusService + provider impls
│   │   ├── ai/                    # IAIService + provider impls
│   │   ├── email/                 # IEmailService + provider impls
│   │   ├── calendar/              # ICalendarService + provider impls
│   │   ├── identity/              # IIdentityService + provider impls
│   │   └── cache/                 # ICacheService + provider impls
│   │
│   ├── config/                    # Environment config, feature flags
│   │   ├── app.config.ts
│   │   ├── database.config.ts
│   │   └── features.config.ts
│   │
│   └── main.ts                    # Application entry point
│
├── migrations/                    # Database migrations (per product subfolder)
│   ├── requisitions/
│   ├── candidates/
│   └── ...
│
├── tests/
│   ├── e2e/                       # End-to-end tests
│   └── load/                      # Load and performance tests
│
├── infra/                         # Infrastructure as code (Bicep / Terraform)
│
├── .github/
│   └── workflows/                 # GitHub Actions CI/CD pipelines
│
├── docs/                          # Architecture decision records (ADRs)
│   └── adr/
│
├── .env.example                   # Template for environment variables (no secrets)
├── .replit                        # Replit configuration
├── replit.nix                     # Replit Nix environment
└── ARCHITECTURE_STANDARDS.md      # This file
```

### 4.1 Naming Conventions

| Artifact | Convention | Example |
|---|---|---|
| Folders | lowercase-kebab | `candidate-intake/` |
| Files | camelCase | `candidateService.ts` |
| Classes | PascalCase | `CandidateService` |
| Interfaces | I + PascalCase | `ICandidateRepository` |
| Constants | SCREAMING_SNAKE | `MAX_RETRY_COUNT` |
| Environment vars | SCREAMING_SNAKE | `DATABASE_URL` |
| Database tables | snake_case | `candidate_applications` |
| API routes | lowercase-kebab | `/api/v1/candidate-applications` |
| Event names | PascalCase dot-separated | `Candidate.ApplicationSubmitted` |

---

## 5. Module & Bounded Context Design

### 5.1 Defining a Bounded Context

Before writing any code for a new module, define its bounded context in the module's `README.md`:

```markdown
## Module: Requisitions

**Owns:** Requisition lifecycle from creation through approval and publishing.
**Does not own:** Candidate data, offer data, budget source-of-truth.
**Produces events:** Requisition.Created, Requisition.Approved, Requisition.Closed
**Consumes events:** Budget.Approved (from Finance)
**Internal API base:** /api/v1/requisitions
**Data store:** requisitions schema in primary DB
**Owner team:** HR Technology
```

### 5.2 Interface-First Design

Every service class must be defined by an interface before implementation. This enforces the dependency inversion principle and makes testing trivial.

```typescript
// ✅ Define the contract first
interface ICandidateService {
  getById(id: string): Promise<Candidate>;
  search(filters: CandidateSearchFilters): Promise<PaginatedResult<Candidate>>;
  updateStage(id: string, stage: CandidateStage, actorId: string): Promise<void>;
}

// ✅ Then implement it
class CandidateService implements ICandidateService {
  constructor(
    private readonly repo: ICandidateRepository,
    private readonly events: IMessageBusService,
    private readonly logger: ILogger
  ) {}
  // ...
}
```

### 5.3 Dependency Injection

All dependencies are injected; nothing is instantiated inside a class. Use a DI container (e.g., TSyringe, InversifyJS, or the built-in .NET DI container).

```typescript
// ❌ Never do this
class CandidateService {
  private repo = new CandidateRepository(); // hard-coded dependency
}

// ✅ Always inject
class CandidateService {
  constructor(private readonly repo: ICandidateRepository) {}
}
```

### 5.4 Module Exports

Each product module exposes only what other modules are allowed to consume. Create an `index.ts` that explicitly declares public exports.

```typescript
// products/candidates/index.ts — public surface of this module
export type { Candidate, CandidateStage } from './models/candidate.model';
export type { ICandidateService } from './services/candidate.service.interface';
// Internal implementations are NOT exported
```

---

## 6. API Design Standards

### 6.1 RESTful Conventions

- Use nouns for resources, never verbs: `/candidates` not `/getCandidates`
- Use plural resource names: `/candidates` not `/candidate`
- Nest related resources up to two levels: `/requisitions/:id/candidates`
- Do not nest beyond two levels; use query parameters instead
- HTTP methods map to CRUD: `GET` read, `POST` create, `PUT/PATCH` update, `DELETE` remove
- `PUT` replaces the full resource; `PATCH` applies partial updates

### 6.2 Versioning

All APIs are versioned from the first release. The version is in the URL path.

```
/api/v1/candidates
/api/v2/candidates      ← introduced when breaking changes are needed
```

- A version is never removed without a deprecation period of at least 90 days
- Deprecation is communicated via a `Deprecation` response header
- Both versions run in parallel during the deprecation window

### 6.3 Response Envelope

All API responses use a consistent envelope:

```json
// Success (single resource)
{
  "data": { "id": "abc123", "name": "Jane Smith" },
  "meta": { "requestId": "req-xyz" }
}

// Success (collection)
{
  "data": [ { "id": "abc123" } ],
  "meta": {
    "requestId": "req-xyz",
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "totalCount": 142,
      "totalPages": 6
    }
  }
}

// Error
{
  "error": {
    "code": "CANDIDATE_NOT_FOUND",
    "message": "No candidate found with the provided ID.",
    "requestId": "req-xyz"
  }
}
```

- Never expose stack traces, internal class names, or database error messages in API responses
- `message` in error responses is always safe for end-user consumption
- `code` is a machine-readable string from a defined error code enum

### 6.4 HTTP Status Codes

| Status | Use case |
|---|---|
| 200 | Successful read or update |
| 201 | Successful creation (include `Location` header) |
| 204 | Successful delete or action with no response body |
| 400 | Validation failure (include field-level errors) |
| 401 | Not authenticated |
| 403 | Authenticated but not authorized |
| 404 | Resource not found |
| 409 | Conflict (e.g., duplicate creation) |
| 422 | Business rule violation (different from validation) |
| 429 | Rate limit exceeded |
| 500 | Unexpected server error (never expose details) |

### 6.5 Input Validation

- Validate all input at the API boundary before it reaches business logic
- Use a schema validation library (e.g., Zod, Joi, FluentValidation)
- Return all validation errors in a single response, not one at a time

```json
// ✅ Return all validation errors at once
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "One or more fields failed validation.",
    "fields": [
      { "field": "email", "message": "Must be a valid email address." },
      { "field": "startDate", "message": "Start date cannot be in the past." }
    ]
  }
}
```

### 6.6 Rate Limiting

- All public and internal API routes must be rate limited
- Rate limits are enforced at the gateway/middleware layer, not inside product logic
- Rate limit headers must be returned on every response: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Authenticated users have higher limits than unauthenticated users
- Specific high-volume endpoints (e.g., search) have their own, more restrictive limits

---

## 7. Data Architecture

### 7.1 Schema Ownership

- Each product owns its own database schema (logical separation within a shared database, or a dedicated schema/database depending on scale)
- No product may issue queries against another product's schema directly
- Cross-product data needs are met via API calls or event-driven data replication

### 7.2 Migrations

- All schema changes are managed by a migration tool (e.g., Flyway, Liquibase, EF Core Migrations)
- Migrations are stored in `/migrations/<product-name>/` and versioned sequentially
- Migrations are always forward-only in production; rollback is a new forward migration
- Every migration is reviewed as part of the PR process
- Destructive migrations (column drops, table drops) require a two-step process:
  - Step 1: Deploy code that no longer uses the column/table
  - Step 2: Run the destructive migration in a subsequent release

### 7.3 Data Access Rules

```typescript
// ❌ Never: raw SQL strings in service layer
const result = await db.query(`SELECT * FROM candidates WHERE id = '${id}'`);

// ❌ Never: ORM queries in controllers
const candidates = await CandidateEntity.findAll({ where: { status: 'active' } });

// ✅ Always: repository pattern with parameterized queries
class CandidateRepository implements ICandidateRepository {
  async getById(id: string): Promise<Candidate | null> {
    return this.db.query(
      'SELECT * FROM candidates.candidates WHERE id = $1',
      [id] // parameterized — never interpolated
    );
  }
}
```

### 7.4 Multi-Tenancy

- Every database table that holds tenant-scoped data must include a `tenant_id` column
- All queries against tenant-scoped tables must include a `WHERE tenant_id = :tenantId` clause
- Tenant ID is injected from the authenticated request context, never from user-supplied input
- A global query interceptor/middleware must enforce tenant scoping and fail loudly if a tenant-scoped query is issued without a tenant ID

### 7.5 Sensitive Data

| Data type | Storage rule |
|---|---|
| Passwords | Never stored. Use OIDC / external identity only. |
| PII (name, email, phone) | Stored encrypted at rest; tagged in code and schema |
| EEOC demographic data | Separate schema partition; access-controlled |
| Audio recordings | Encrypted blob storage; retention policy enforced |
| Salary data | Encrypted at rest; access-controlled by role |
| Secrets / API keys | Never in code or database; use secrets manager only |

### 7.6 Soft Deletes

- Core business entities (candidates, requisitions, offers) use soft deletes
- Add `deleted_at TIMESTAMP NULL` and `deleted_by UUID NULL` to these tables
- All queries against soft-deletable entities must include `WHERE deleted_at IS NULL` by default
- Hard deletes are only used for GDPR/CCPA data subject deletion requests, which go through a controlled deletion workflow

---

## 8. Authentication & Authorization

### 8.1 Authentication

- The system does not manage passwords. All authentication is delegated to an external identity provider (Azure AD, Google Workspace, or OIDC-compliant provider).
- JWTs are used for stateless API authentication.
- JWT validation occurs in shared auth middleware before any route handler executes.
- Tokens are validated for: signature, expiry, issuer, audience, and required claims.
- Token refresh is handled client-side using refresh tokens issued by the identity provider.

```typescript
// shared/auth/jwtMiddleware.ts
export const jwtMiddleware = async (req, res, next) => {
  const token = extractBearerToken(req.headers.authorization);
  if (!token) return res.status(401).json(unauthorizedError());

  const payload = await verifyToken(token, {
    issuer: config.auth.issuer,
    audience: config.auth.audience,
  });

  req.user = payload; // attach verified claims to request context
  next();
};
```

### 8.2 Authorization

- Authorization is role-based (RBAC) with row-level enforcement for scoped resources.
- Role checks happen in the service layer, not the controller. Controllers route; services authorize.
- Never make authorization decisions based on data in the request body or URL that is also stored server-side — always fetch from the server-side record.

```typescript
// ✅ Authorization in service layer
class RequisitionService {
  async getById(id: string, actorId: string, actorRoles: Role[]): Promise<Requisition> {
    const req = await this.repo.getById(id);
    if (!req) throw new NotFoundError('Requisition', id);

    // Row-level check: hiring managers only see their own requisitions
    if (actorRoles.includes(Role.HiringManager) && req.ownerId !== actorId) {
      throw new ForbiddenError();
    }

    return req;
  }
}
```

### 8.3 Principle of Least Privilege

- Every role is granted the minimum permissions required for its function
- Permissions are additive: start from zero, grant what is needed
- Elevated permissions (e.g., Admin actions) require a separate confirmation step in the UI and a distinct claim in the token

---

## 9. Security Standards

### 9.1 Secrets Management

```
# ❌ Never — secrets in code
const apiKey = "sk-abc123...";

# ❌ Never — secrets in .env committed to git
DATABASE_URL=postgres://user:password@host/db

# ✅ Always — secrets from environment variables injected at runtime
const apiKey = process.env.AI_SERVICE_API_KEY;
// Validated at startup: if not present, fail fast with a clear error
```

- Use Replit Secrets for local/dev secrets in Replit environments
- Use the cloud platform's secrets manager (Azure Key Vault, AWS Secrets Manager, GCP Secret Manager) for staging and production
- All secrets are validated at application startup. Missing required secrets cause the application to fail with a descriptive error before serving any traffic.
- Rotate secrets on a schedule and on any suspected exposure. Rotation must not require a code change.

### 9.2 Dependency Security

- Run `npm audit` / `dotnet list package --vulnerable` on every PR
- No PR may be merged with known high or critical severity vulnerabilities in direct dependencies
- Dependencies are pinned to exact versions in package lock files
- Dependabot (or equivalent) is enabled for automated dependency update PRs

### 9.3 Input Security

- All user input is validated and sanitized before processing
- SQL injection is prevented by using parameterized queries exclusively (see Section 7.3)
- XSS is prevented by escaping all output in templates and using Content-Security-Policy headers
- File uploads are validated for: MIME type (server-side magic bytes check, not extension), file size limits, and scanned for malware before storage
- Redirects never use user-supplied URLs without validation against an allowlist

### 9.4 HTTP Security Headers

All HTTP responses must include the following headers, configured in middleware:

```
Content-Security-Policy: default-src 'self'; ...
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

### 9.5 CORS

- CORS is configured with an explicit allowlist of origins
- Wildcard origins (`*`) are never permitted in production
- Allowed origins are environment-variable-driven, not hardcoded

### 9.6 Audit Logging

- All state-changing operations are logged to the audit trail (see ATS Build Guidelines §11)
- Audit log entries are immutable: the audit log store rejects updates and deletes
- Audit logs are in a separate data store from application data

### 9.7 Encryption

- TLS 1.2 minimum for all data in transit (TLS 1.3 preferred)
- AES-256 for all data at rest
- Database encryption is enabled at the infrastructure level and also at the application level for PII fields
- Encryption keys are managed in the secrets manager, not in application code or configuration files

---

## 10. Scalability Patterns

### 10.1 Stateless Services

- Application instances hold no in-process state between requests
- Session state, if needed, is stored in a distributed cache (Redis or equivalent), never in memory
- This ensures any instance can handle any request, enabling horizontal scaling

### 10.2 Horizontal Scaling

- Services are designed to run as multiple instances behind a load balancer
- No operations assume single-instance execution
- Background jobs use distributed locking to prevent duplicate execution across instances

### 10.3 Caching Strategy

| Cache type | Use case | TTL guidance |
|---|---|---|
| Reference data | Role lists, tag taxonomies, config | Long (hours to days), invalidate on update |
| User session context | Auth claims, permissions | Short (minutes), aligned to token expiry |
| Search results | Candidate search, dashboard data | Medium (seconds to minutes), invalidate on write |
| External API responses | Calendar availability, AI results | Short, proportional to data volatility |

- Cache keys must include tenant ID to prevent cross-tenant data leakage
- Cache invalidation is event-driven where possible (invalidate on domain events, not on a timer only)

### 10.4 Asynchronous Processing

- Long-running operations (AI scoring, report generation, bulk imports) are executed asynchronously via a message queue
- The API returns a `202 Accepted` with a job ID when an async operation is triggered
- Clients poll a job status endpoint or receive a push notification on completion
- This prevents HTTP timeouts and allows the system to handle bursts by queuing work

```
POST /api/v1/phone-screens/:id/score
→ 202 Accepted
  { "jobId": "job-abc123", "statusUrl": "/api/v1/jobs/job-abc123" }

GET /api/v1/jobs/job-abc123
→ 200 OK
  { "status": "completed", "result": { ... } }
```

### 10.5 Database Scalability

- Read-heavy queries use a read replica where available
- Expensive queries (reports, analytics) run against the read replica, never the primary
- Database connection pooling is configured and enforced (PgBouncer or equivalent)
- Indexes are reviewed as part of every migration PR
- Avoid `SELECT *` — always specify required columns

### 10.6 Pagination

All collection endpoints are paginated. Unbounded queries are never permitted.

```typescript
// ✅ Cursor-based pagination for large/high-frequency datasets
GET /api/v1/candidates?cursor=eyJpZCI6MTAwfQ&pageSize=25

// ✅ Offset pagination for UI-driven lists with page numbers
GET /api/v1/candidates?page=2&pageSize=25

// ❌ Never return unbounded collections
GET /api/v1/candidates  // returns all 50,000 candidates — never allowed
```

---

## 11. Cloud Portability

### 11.1 Abstraction Layer Pattern

Every cloud service call is hidden behind an interface. The application code interacts only with the interface. Cloud-specific implementations are registered in the DI container based on configuration.

```typescript
// infrastructure/storage/IFileStorageService.ts
interface IFileStorageService {
  upload(key: string, data: Buffer, options: UploadOptions): Promise<string>;
  getSignedUrl(key: string, expiresInSeconds: number): Promise<string>;
  delete(key: string): Promise<void>;
}

// infrastructure/storage/AzureBlobStorageService.ts
class AzureBlobStorageService implements IFileStorageService { ... }

// infrastructure/storage/S3StorageService.ts
class S3StorageService implements IFileStorageService { ... }

// config/app.config.ts — wire up based on environment variable
const storageProvider = config.cloud.provider === 'aws'
  ? new S3StorageService(config.aws)
  : new AzureBlobStorageService(config.azure);
```

### 11.2 Required Abstraction Interfaces

| Interface | Covers |
|---|---|
| `IFileStorageService` | Blob/object storage |
| `IMessageBusService` | Queues, topics, pub/sub |
| `ICacheService` | Distributed cache |
| `IAIService` | AI inference / language model calls |
| `IEmailService` | Transactional email delivery |
| `ICalendarService` | Calendar read/write (M365 / Google) |
| `IIdentityService` | User provisioning, directory sync |
| `ISecretsService` | Runtime secret retrieval |

### 11.3 Configuration-Driven Provider Selection

```env
# .env (never committed — see .env.example)
CLOUD_PROVIDER=azure           # azure | aws | gcp
STORAGE_PROVIDER=azure-blob    # azure-blob | s3 | gcs
MESSAGING_PROVIDER=servicebus  # servicebus | sqs | pubsub
```

No provider switch should require code changes — only configuration changes.

---

## 12. Event-Driven Architecture

### 12.1 When to Use Events

Use events when:
- One product needs to react to something that happened in another product
- An action should trigger multiple downstream effects
- Decoupling is more important than immediate consistency

Use direct API calls when:
- The caller needs the result synchronously
- Strong consistency is required
- The operation is within a single product boundary

### 12.2 Event Schema Standard

All events use a consistent envelope:

```json
{
  "id": "evt-uuid-v4",
  "type": "Candidate.StageChanged",
  "version": "1.0",
  "tenantId": "tenant-abc",
  "occurredAt": "2026-04-03T14:22:00.000Z",
  "actorId": "user-xyz",
  "data": {
    "candidateId": "cand-123",
    "previousStage": "PhoneScreen",
    "newStage": "Interview"
  }
}
```

- `id`: UUID v4, unique per event
- `type`: `<Product>.<EventName>` in PascalCase
- `version`: semantic version of the event schema
- `tenantId`: always present for tenant-scoped events
- `occurredAt`: UTC ISO 8601 timestamp
- `actorId`: the user or system that triggered the event

### 12.3 Event Versioning

- Event schemas are versioned. Breaking changes require a new version (`"version": "2.0"`)
- Consumers must handle multiple versions during a migration window
- Old event versions are deprecated with the same 90-day notice as API versions

### 12.4 At-Least-Once Delivery

- Assume events may be delivered more than once. All event handlers must be idempotent.
- Use the event `id` as an idempotency key, storing processed event IDs in a deduplication table.

```typescript
async function handleCandidateStageChanged(event: DomainEvent) {
  if (await this.deduplication.hasProcessed(event.id)) return; // already handled
  await this.deduplication.markProcessed(event.id);
  // ... handle the event
}
```

---

## 13. Error Handling & Resilience

### 13.1 Error Hierarchy

Define a typed error hierarchy in `shared/errors/`:

```typescript
class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly httpStatus: number,
    public readonly isOperational: boolean = true
  ) { super(message); }
}

class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super('NOT_FOUND', `${resource} with id '${id}' was not found.`, 404);
  }
}

class ForbiddenError extends AppError {
  constructor() {
    super('FORBIDDEN', 'You do not have permission to perform this action.', 403);
  }
}

class ValidationError extends AppError { ... }
class ConflictError extends AppError { ... }
class BusinessRuleError extends AppError { ... }
```

- `isOperational: true` = expected error (input error, not found) — log at warn level
- `isOperational: false` = unexpected error (bug, infra failure) — log at error level, alert on-call

### 13.2 Global Error Handler

A single global error handler in middleware catches all unhandled errors and formats the response. Business logic never writes raw `res.status(500).send(...)` responses.

### 13.3 Retry & Circuit Breaker

For calls to external services (AI, calendar, e-signature):

- Implement retry with exponential backoff and jitter for transient failures
- Implement a circuit breaker to stop retrying when a service is consistently unavailable
- Circuit breaker states: Closed (normal), Open (failing fast), Half-Open (testing recovery)
- Log all circuit breaker state transitions

```typescript
// Retry configuration example
const retryPolicy = {
  maxAttempts: 3,
  initialDelayMs: 200,
  backoffMultiplier: 2,
  jitterMs: 100,
  retryableErrors: [408, 429, 502, 503, 504]
};
```

### 13.4 Graceful Degradation

- When a non-critical external service is unavailable (e.g., AI scoring), the application continues to function
- The feature that depends on the unavailable service is clearly marked as temporarily unavailable in the UI
- Critical paths (auth, data read/write) never depend on optional external services

---

## 14. Observability

### 14.1 Structured Logging

All logs are structured JSON. Never use unstructured string concatenation for log output.

```typescript
// ❌ Never
console.log(`Candidate ${candidateId} moved to stage ${stage}`);

// ✅ Always — structured, queryable
logger.info('candidate.stage_changed', {
  candidateId,
  previousStage,
  newStage,
  actorId,
  tenantId,
  durationMs: timer.elapsed(),
  requestId: req.context.requestId
});
```

### 14.2 Log Levels

| Level | When to use |
|---|---|
| `error` | Unexpected failures, bugs, infrastructure errors |
| `warn` | Operational errors (not found, validation fail, auth fail), degraded states |
| `info` | Key business events (stage changes, approvals, offers sent) |
| `debug` | Detailed flow information for debugging (suppressed in production) |

- `debug` logs are never written to production log streams
- `error` logs trigger an alert to the on-call channel
- Log output includes: timestamp, level, event name, tenantId, requestId, actorId, and event-specific fields

### 14.3 Distributed Tracing

- Every inbound request receives a unique `requestId` (generated if not provided in headers)
- `requestId` is propagated through all downstream calls (internal APIs, queue messages, events)
- `requestId` is included in all log entries and returned in all API responses as `meta.requestId`

### 14.4 Health Checks

Every service exposes health check endpoints:

```
GET /health/live    → 200 if the process is running
GET /health/ready   → 200 if the service can handle traffic (DB connected, dependencies reachable)
```

- Liveness and readiness are separate endpoints
- Health checks are used by the load balancer to route traffic away from unhealthy instances
- Health checks never expose internal details (connection strings, version info) in the response body

### 14.5 Metrics

Emit the following metrics at minimum:

- HTTP request count, latency (p50, p95, p99), and error rate per endpoint
- Queue depth and message processing latency
- Database query latency per query type
- Cache hit/miss rate
- External service call latency and error rate

---

## 15. CI/CD Standards

### 15.1 GitHub Actions — Standard Pipeline

**PR Pipeline (runs on every pull request):**

```yaml
jobs:
  build-and-test:
    steps:
      - Checkout
      - Install dependencies
      - Lint and code style
      - Build
      - Unit tests with coverage
      - Coverage gate (minimum 80%)
      - Integration tests
      - SAST scan (CodeQL)
      - Dependency vulnerability scan
      - Preview environment deploy
```

**Main Branch Pipeline (runs on merge to main):**

```yaml
jobs:
  deploy-staging:
    steps:
      - All PR checks
      - Build production image
      - Push to container registry (tagged with commit SHA)
      - Deploy to staging (blue/green)
      - Smoke tests
      - Manual approval gate

  deploy-production:
    needs: deploy-staging
    environment: production
    steps:
      - Deploy to production (blue/green)
      - Post-deploy smoke tests
      - Auto-rollback on failure
      - Deployment notification
```

### 15.2 Branch Strategy

```
main          ← production-ready code only; protected branch
└── staging   ← merged before production; maps to staging environment
    └── feature/<ticket-id>-short-description   ← feature branches
    └── fix/<ticket-id>-short-description       ← bug fix branches
    └── chore/<description>                     ← dependency updates, tooling
```

- Direct commits to `main` are never permitted
- All merges to `main` require at least one approved review
- Feature branches are short-lived (days, not weeks). Large features use feature flags.

### 15.3 Feature Flags

- New features are deployed behind feature flags
- Feature flags allow features to be enabled per tenant, per role, or globally
- Feature flags are managed in `/config/features.config.ts` and overridable via environment variables
- Flags are cleaned up (removed) within one sprint of a feature reaching full rollout

---

## 16. Testing Standards

### 16.1 Test Types and Responsibilities

| Type | What it tests | Where it lives | Required coverage |
|---|---|---|---|
| Unit | Single function/class in isolation | `products/<name>/tests/unit/` | 80% of business logic |
| Integration | A module's API + DB + events working together | `products/<name>/tests/integration/` | All API endpoints |
| E2E | Full user journeys through the running application | `tests/e2e/` | Critical user paths |
| Load | System behavior under expected and peak load | `tests/load/` | Before each major release |

### 16.2 Testing Rules

- Unit tests use mocks/stubs for all dependencies — no real databases, no real HTTP calls
- Integration tests use a real test database (seeded and torn down per test run)
- Tests never share state between test cases — each test is fully independent
- Test names describe the behavior being verified, not the implementation

```typescript
// ❌ Poor test name
it('should work correctly')

// ✅ Good test name
it('returns 403 when a hiring manager requests a requisition they do not own')
```

### 16.3 Test Data

- Test data is defined as typed factory functions, not raw object literals scattered in test files
- No test data is committed that contains real names, emails, or PII
- Randomized test data uses a seeded random function so tests are deterministic and reproducible

---

## 17. Dependency Management

### 17.1 Adding Dependencies

Before adding any new dependency, evaluate:

1. Is this functionality achievable with existing dependencies or a small amount of custom code?
2. Is the package actively maintained (recent commits, responsive maintainers)?
3. Does it have an acceptable license for commercial SaaS use (MIT, Apache 2.0, BSD)?
4. What is its download count and community adoption?
5. Does `npm audit` / `dotnet list --vulnerable` show any known vulnerabilities?

### 17.2 Dependency Rules

- Lock files (`package-lock.json`, `yarn.lock`) are always committed
- Dependencies are pinned to exact versions in production (`"express": "4.18.2"` not `"^4.18.2"`)
- Dev dependencies are clearly separated from production dependencies
- No dependency with a GPL or AGPL license may be used without explicit legal review

### 17.3 Banned Packages

Maintain a `banned-dependencies.md` in `/docs/` listing packages that must not be used and the reason. Examples:

- Packages with unresolved critical CVEs
- Packages with incompatible licenses
- Deprecated packages with available replacements

---

## 18. Documentation Standards

### 18.1 What Must Be Documented

| Artifact | Location | Required content |
|---|---|---|
| Module overview | `products/<name>/README.md` | Purpose, boundaries, events, API base, owner |
| API endpoints | OpenAPI / Swagger in `products/<name>/api/` | All endpoints, request/response schemas, error codes |
| Architecture decisions | `docs/adr/ADR-XXXX.md` | Context, decision, consequences, status |
| Environment setup | `README.md` (root) | How to run locally, required env vars, seed data |
| Runbook | `docs/runbooks/` | How to respond to common incidents and alerts |

### 18.2 Architecture Decision Records (ADRs)

Significant technical decisions must be documented as ADRs. An ADR is required when:

- Choosing a framework, library, or infrastructure component
- Changing a pattern that affects multiple modules
- Deferring a decision intentionally (record why and when it will be revisited)

```markdown
# ADR-0001: Use GitHub Actions as CI/CD Platform

**Status:** Accepted
**Date:** 2026-04-03
**Deciders:** Engineering Lead, DevOps Lead

## Context
We need a CI/CD platform that integrates natively with our GitHub repository...

## Decision
We will use GitHub Actions...

## Consequences
- Positive: Native GitHub integration, no additional tooling account
- Negative: GitHub-specific YAML syntax creates mild lock-in
- Mitigated by: Pipeline logic is simple enough to migrate in <1 day if needed
```

### 18.3 Code Comments

- Comments explain **why**, not **what**. The code explains what.
- Every public interface method has a JSDoc / XML doc comment
- TODOs include a ticket reference: `// TODO(ATS-423): Replace with async processing`
- Commented-out code is never committed to main

---

## 19. Replit-Specific Configuration

### 19.1 `.replit` Configuration

```toml
# .replit
run = "npm run dev"
entrypoint = "src/main.ts"

[nix]
channel = "stable-23_11"

[env]
NODE_ENV = "development"

[packager]
language = "nodejs"

  [packager.features]
  packageSearch = true
  guessImports = true

[languages]
  [languages.typescript]
  pattern = "**/*.{ts,tsx}"

  [languages.typescript.languageServer]
  start = "typescript-language-server --stdio"
```

### 19.2 Replit Secrets

- All environment variables are stored in Replit Secrets for development environments
- The `.env.example` file documents every required environment variable with a description and an example (non-sensitive) value
- `.env` files are in `.gitignore` and never committed

```bash
# .env.example — commit this
DATABASE_URL=postgres://user:password@localhost:5432/ats_dev   # PostgreSQL connection string
AI_SERVICE_API_KEY=your-api-key-here                           # AI provider API key
AZURE_AD_TENANT_ID=your-tenant-id                              # Azure AD tenant
JWT_SECRET=min-32-char-random-string                           # JWT signing secret
CLOUD_PROVIDER=azure                                           # azure | aws | gcp
```

### 19.3 Replit Environment Separation

| Replit environment | Maps to | Data |
|---|---|---|
| Dev Repl | Development | Local / synthetic |
| Staging Repl | Staging | Anonymized production |
| (Production is not hosted on Replit) | Production | Azure / AWS / GCP |

- Production deployments are never made directly from Replit
- Replit is used for development, prototyping, and PR preview environments only
- The CI/CD pipeline in GitHub Actions handles all staging and production deployments

### 19.4 Replit Resource Limits

- Be mindful of Replit's memory and CPU limits during development
- Heavy background jobs (AI processing, bulk imports) should be stubbed or mocked in the Replit dev environment
- Use lightweight in-memory SQLite or a seeded dev database rather than a full PostgreSQL instance in Replit where possible

---

## 20. Checklist: New Module Readiness

Before a new product module may be merged to main, it must satisfy every item on this checklist. This checklist lives in the PR template and is verified by the reviewer.

### Design
- [ ] Bounded context defined in `README.md` (owns, does not own, events produced/consumed)
- [ ] API contract defined in OpenAPI spec before implementation
- [ ] Data model and migration reviewed and approved
- [ ] ADR created for any significant technology or pattern decision

### Code Quality
- [ ] All service classes implement interfaces defined before implementation
- [ ] All dependencies are injected (no internal `new` instantiation of services)
- [ ] Module `index.ts` exports only the public surface
- [ ] No direct cross-module database queries
- [ ] No secrets, PII, or API keys in source code

### Security
- [ ] All input validated at the API boundary using a schema validator
- [ ] All repository queries use parameterized inputs
- [ ] Authorization enforced in service layer (role + row-level where applicable)
- [ ] Tenant ID scoping enforced on all tenant-scoped queries
- [ ] EEOC data access restricted to authorized roles
- [ ] `npm audit` / vulnerability scan passes with no high/critical findings

### Observability
- [ ] All state-changing operations emit structured log entries
- [ ] Key business events (stage changes, approvals) emit info-level log entries
- [ ] All audit-worthy events write to the audit trail
- [ ] Health check endpoints implemented

### Testing
- [ ] Unit tests cover all business logic paths (≥80% coverage)
- [ ] Integration tests cover all API endpoints (happy path + key error paths)
- [ ] No test uses real PII data
- [ ] All tests pass in CI

### Documentation
- [ ] `README.md` complete with purpose, boundaries, API base, and owner
- [ ] All public API methods have JSDoc comments
- [ ] Any TODO comments include a ticket reference
- [ ] No commented-out code

### Operations
- [ ] Feature is deployed behind a feature flag if rollout risk is non-trivial
- [ ] Migrations are backward-compatible with the previous release
- [ ] Runbook entry created for any new background job or critical path

---

*Maintained by: Engineering Leadership*  
*Review cycle: Quarterly or on major architectural change*  
*To propose a change to these standards, open a PR with an ADR in `docs/adr/` and tag Engineering Lead for review.*
