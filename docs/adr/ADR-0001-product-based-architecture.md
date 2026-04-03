# ADR-0001: Adopt Product-Based Architecture

**Status:** Accepted
**Date:** 2026-04-03
**Deciders:** Engineering Leadership

## Context
The ATS platform needs to support multiple business domains (requisitions, candidates, screening, interviews, offers, onboarding, marketplace, analytics, notifications) that evolve at different rates and are maintained by different teams.

A traditional layer-based architecture (controllers / services / repositories as top-level folders) would result in tightly coupled modules that are difficult to modify independently.

## Decision
We will organize the codebase around **products** (bounded contexts), where each product folder contains its own API layer, business logic, data access, events, models, validators, and tests.

Cross-cutting concerns (auth, middleware, error handling, pagination) live in `/shared`. Cloud abstraction interfaces live in `/infrastructure`. Configuration lives in `/config`.

## Consequences
- **Positive:** Teams can work on different products independently with minimal merge conflicts.
- **Positive:** Each product has clear boundaries and explicit inter-product communication rules.
- **Positive:** New products can be added without restructuring existing code.
- **Negative:** Some code duplication across products is expected and acceptable.
- **Mitigated by:** Shared utilities in `/shared` for truly cross-cutting concerns.
