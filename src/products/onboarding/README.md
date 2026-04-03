## Module: Onboarding

**Owns:** New hire onboarding workflows, task assignment, document collection, and onboarding status tracking.
**Does not own:** Candidate profiles, offer data, payroll setup.
**Produces events:** Onboarding.Started, Onboarding.TaskCompleted, Onboarding.Completed
**Consumes events:** Offer.Accepted (from Offers)
**Internal API base:** /api/v1/onboarding
**Data store:** onboarding schema in primary DB
**Owner team:** HR Technology
