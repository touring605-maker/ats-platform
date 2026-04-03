## Module: Marketplace

**Owns:** Job board integrations, posting distribution, third-party marketplace management, and syndication tracking.
**Does not own:** Requisition data, candidate profiles, application intake.
**Produces events:** Marketplace.JobPosted, Marketplace.PostingExpired, Marketplace.ApplicationReceived
**Consumes events:** Requisition.Published (from Requisitions), Requisition.Closed (from Requisitions)
**Internal API base:** /api/v1/marketplace
**Data store:** marketplace schema in primary DB
**Owner team:** HR Technology
