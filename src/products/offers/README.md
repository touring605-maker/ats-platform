## Module: Offers

**Owns:** Offer creation, approval workflows, compensation packages, e-signature integration, and offer acceptance tracking.
**Does not own:** Candidate profiles, requisition data, onboarding workflows.
**Produces events:** Offer.Created, Offer.Approved, Offer.Sent, Offer.Accepted, Offer.Declined
**Consumes events:** Interview.Completed (from Interviews), Candidate.StageChanged (from Candidates)
**Internal API base:** /api/v1/offers
**Data store:** offers schema in primary DB
**Owner team:** HR Technology
