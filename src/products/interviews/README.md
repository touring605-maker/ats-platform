## Module: Interviews

**Owns:** Interview scheduling, panel management, feedback collection, calendar integration, and interview outcomes.
**Does not own:** Candidate profiles, screening results, offer terms.
**Produces events:** Interview.Scheduled, Interview.Completed, Interview.FeedbackSubmitted
**Consumes events:** Screening.Completed (from Screening), Candidate.StageChanged (from Candidates)
**Internal API base:** /api/v1/interviews
**Data store:** interviews schema in primary DB
**Owner team:** HR Technology
