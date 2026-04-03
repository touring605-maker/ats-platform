## Module: Screening

**Owns:** Phone screen scheduling, AI-assisted scoring, screening rubrics, and screening outcomes.
**Does not own:** Candidate profiles, interview scheduling, offer generation.
**Produces events:** Screening.Scheduled, Screening.Completed, Screening.Scored
**Consumes events:** Candidate.StageChanged (from Candidates)
**Internal API base:** /api/v1/screenings
**Data store:** screening schema in primary DB
**Owner team:** HR Technology
