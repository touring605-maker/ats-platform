## Module: Requisitions

**Owns:** Requisition lifecycle from creation through approval and publishing.
**Does not own:** Candidate data, offer data, budget source-of-truth.
**Produces events:** Requisition.Created, Requisition.Approved, Requisition.Published, Requisition.Closed
**Consumes events:** Budget.Approved (from Finance)
**Internal API base:** /api/v1/requisitions
**Data store:** requisitions schema in primary DB
**Owner team:** HR Technology
