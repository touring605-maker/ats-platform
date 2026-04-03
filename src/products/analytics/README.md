## Module: Analytics

**Owns:** Reporting, dashboards, hiring metrics (time-to-fill, source effectiveness, pipeline velocity), and data aggregation.
**Does not own:** Source data from other modules — consumes events and API data for read-only aggregation.
**Produces events:** Analytics.ReportGenerated
**Consumes events:** Candidate.StageChanged, Requisition.Created, Requisition.Closed, Offer.Accepted, Screening.Completed, Interview.Completed
**Internal API base:** /api/v1/analytics
**Data store:** analytics schema in primary DB (read-optimized)
**Owner team:** HR Technology
