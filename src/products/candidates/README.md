## Module: Candidates

**Owns:** Candidate profile, application lifecycle, stage progression, and candidate-facing portal.
**Does not own:** Requisition data, offer terms, interview scheduling, screening results.
**Produces events:** Candidate.ApplicationSubmitted, Candidate.StageChanged, Candidate.Withdrawn, Candidate.Rejected
**Consumes events:** Requisition.Published (from Requisitions), Offer.Accepted (from Offers)
**Internal API base:** /api/v1/candidates
**Data store:** candidates schema in primary DB
**Owner team:** HR Technology
