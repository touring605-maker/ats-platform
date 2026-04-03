## Module: Notifications

**Owns:** Email notifications, in-app notifications, notification templates, delivery tracking, and user notification preferences.
**Does not own:** Business logic that triggers notifications — reacts to events from other modules.
**Produces events:** Notification.Sent, Notification.Failed, Notification.Read
**Consumes events:** Candidate.ApplicationSubmitted, Interview.Scheduled, Offer.Sent, Onboarding.Started (and other cross-module events)
**Internal API base:** /api/v1/notifications
**Data store:** notifications schema in primary DB
**Owner team:** HR Technology
