import { Router } from "express";
import { Readable } from "stream";
import { db } from "@workspace/db";
import { applicationsTable, applicationRatingsTable, candidatesTable, jobsTable, organizationMembersTable, organizationsTable, emailTemplatesTable, emailLogsTable } from "@workspace/db/schema";
import { eq, and, count, avg, desc, asc, gte, lte, sql, ilike, or, inArray } from "drizzle-orm";
import { requireAuth, requireOrgMembership } from "../middlewares/requireAuth";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage";
import { sendAndLogEmail, renderTemplate } from "../lib/emailService";

const router = Router();

router.get("/", requireOrgMembership(), async (req, res) => {
  const { organizationId } = req.auth_context!;
  const jobId = req.query.jobId as string | undefined;
  const status = req.query.status as string | undefined;
  const search = req.query.search as string | undefined;
  const minRating = req.query.minRating as string | undefined;
  const dateFrom = req.query.dateFrom as string | undefined;
  const dateTo = req.query.dateTo as string | undefined;
  const sortBy = (req.query.sortBy as string) || "appliedAt";
  const sortOrder = (req.query.sortOrder as string) || "desc";
  const page = (req.query.page as string | undefined) ?? "1";
  const limit = (req.query.limit as string | undefined) ?? "20";

  type AppStatus = "new" | "reviewed" | "shortlisted" | "rejected" | "hired";
  const validAppStatuses: AppStatus[] = ["new", "reviewed", "shortlisted", "rejected", "hired"];

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  const conditions = [eq(jobsTable.organizationId, organizationId)];

  if (jobId) {
    conditions.push(eq(applicationsTable.jobId, jobId));
  }
  if (status && validAppStatuses.includes(status as AppStatus)) {
    conditions.push(eq(applicationsTable.status, status as AppStatus));
  }
  if (search) {
    conditions.push(
      or(
        ilike(candidatesTable.firstName, `%${search}%`),
        ilike(candidatesTable.lastName, `%${search}%`),
        ilike(candidatesTable.email, `%${search}%`)
      )!
    );
  }
  if (dateFrom) {
    conditions.push(gte(applicationsTable.appliedAt, new Date(dateFrom)));
  }
  if (dateTo) {
    const endDate = new Date(dateTo);
    endDate.setHours(23, 59, 59, 999);
    conditions.push(lte(applicationsTable.appliedAt, endDate));
  }

  const ratingSubquery = db
    .select({
      applicationId: applicationRatingsTable.applicationId,
      avgRating: avg(applicationRatingsTable.rating).as("avg_rating"),
      ratingCount: count(applicationRatingsTable.id).as("rating_count"),
    })
    .from(applicationRatingsTable)
    .groupBy(applicationRatingsTable.applicationId)
    .as("rating_agg");

  if (minRating) {
    const minRatingNum = parseFloat(minRating);
    if (!isNaN(minRatingNum)) {
      conditions.push(
        gte(sql`COALESCE(${ratingSubquery.avgRating}, 0)`, sql`${minRatingNum}`)
      );
    }
  }

  const where = and(...conditions);

  let orderByClause;
  const dir = sortOrder === "asc" ? asc : desc;
  switch (sortBy) {
    case "candidateName":
      orderByClause = dir(candidatesTable.lastName);
      break;
    case "rating":
      orderByClause = dir(sql`COALESCE(${ratingSubquery.avgRating}, 0)`);
      break;
    case "status":
      orderByClause = dir(applicationsTable.status);
      break;
    default:
      orderByClause = dir(applicationsTable.appliedAt);
  }

  const baseQuery = db
    .select({
      id: applicationsTable.id,
      jobId: applicationsTable.jobId,
      candidateId: applicationsTable.candidateId,
      status: applicationsTable.status,
      coverLetter: applicationsTable.coverLetter,
      customFieldResponses: applicationsTable.customFieldResponses,
      notes: applicationsTable.notes,
      appliedAt: applicationsTable.appliedAt,
      updatedAt: applicationsTable.updatedAt,
      candidateFirstName: candidatesTable.firstName,
      candidateLastName: candidatesTable.lastName,
      candidateEmail: candidatesTable.email,
      candidatePhone: candidatesTable.phone,
      candidateResumeUrl: candidatesTable.resumeUrl,
      jobTitle: jobsTable.title,
      jobDepartment: jobsTable.department,
      avgRating: ratingSubquery.avgRating,
      ratingCount: ratingSubquery.ratingCount,
    })
    .from(applicationsTable)
    .innerJoin(candidatesTable, eq(applicationsTable.candidateId, candidatesTable.id))
    .innerJoin(jobsTable, eq(applicationsTable.jobId, jobsTable.id))
    .leftJoin(ratingSubquery, eq(applicationsTable.id, ratingSubquery.applicationId))
    .where(where)
    .orderBy(orderByClause)
    .limit(limitNum)
    .offset(offset);

  const countQuery = db
    .select({ total: count() })
    .from(applicationsTable)
    .innerJoin(candidatesTable, eq(applicationsTable.candidateId, candidatesTable.id))
    .innerJoin(jobsTable, eq(applicationsTable.jobId, jobsTable.id))
    .leftJoin(ratingSubquery, eq(applicationsTable.id, ratingSubquery.applicationId))
    .where(where);

  const [applications, [{ total }]] = await Promise.all([
    baseQuery,
    countQuery,
  ]);

  res.json({
    data: applications,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: Number(total),
      totalPages: Math.ceil(Number(total) / limitNum),
    },
  });
});

router.get("/:id", requireOrgMembership(), async (req, res) => {
  const { organizationId } = req.auth_context!;
  const id = req.params.id as string;

  const [application] = await db
    .select({
      id: applicationsTable.id,
      jobId: applicationsTable.jobId,
      candidateId: applicationsTable.candidateId,
      status: applicationsTable.status,
      coverLetter: applicationsTable.coverLetter,
      customFieldResponses: applicationsTable.customFieldResponses,
      notes: applicationsTable.notes,
      appliedAt: applicationsTable.appliedAt,
      updatedAt: applicationsTable.updatedAt,
      candidateFirstName: candidatesTable.firstName,
      candidateLastName: candidatesTable.lastName,
      candidateEmail: candidatesTable.email,
      candidatePhone: candidatesTable.phone,
      candidateResumeUrl: candidatesTable.resumeUrl,
      candidateLinkedinUrl: candidatesTable.linkedinUrl,
      candidateSource: candidatesTable.source,
      jobTitle: jobsTable.title,
      jobDepartment: jobsTable.department,
      jobCustomFields: jobsTable.customFields,
    })
    .from(applicationsTable)
    .innerJoin(candidatesTable, eq(applicationsTable.candidateId, candidatesTable.id))
    .innerJoin(jobsTable, eq(applicationsTable.jobId, jobsTable.id))
    .where(and(eq(applicationsTable.id, id), eq(jobsTable.organizationId, organizationId)))
    .limit(1);

  if (!application) {
    res.status(404).json({ error: "Application not found" });
    return;
  }

  const ratings = await db
    .select()
    .from(applicationRatingsTable)
    .where(eq(applicationRatingsTable.applicationId, id))
    .orderBy(desc(applicationRatingsTable.createdAt));

  res.json({ ...application, ratings });
});

router.post("/", requireOrgMembership(["admin", "hiring_manager"]), async (req, res) => {
  const { organizationId } = req.auth_context!;
  const { jobId, candidateId, coverLetter, customFieldResponses } = req.body;

  if (!jobId || !candidateId) {
    res.status(400).json({ error: "jobId and candidateId are required" });
    return;
  }

  const [job] = await db
    .select({ id: jobsTable.id })
    .from(jobsTable)
    .where(and(eq(jobsTable.id, jobId), eq(jobsTable.organizationId, organizationId)))
    .limit(1);

  if (!job) {
    res.status(404).json({ error: "Job not found in this organization" });
    return;
  }

  const [candidate] = await db
    .select({ id: candidatesTable.id })
    .from(candidatesTable)
    .where(and(eq(candidatesTable.id, candidateId), eq(candidatesTable.organizationId, organizationId)))
    .limit(1);

  if (!candidate) {
    res.status(404).json({ error: "Candidate not found in this organization" });
    return;
  }

  const [application] = await db
    .insert(applicationsTable)
    .values({
      jobId,
      candidateId,
      coverLetter,
      customFieldResponses: customFieldResponses || {},
    })
    .returning();

  res.status(201).json(application);
});

router.delete("/:id", requireOrgMembership(["admin"]), async (req, res) => {
  const { organizationId } = req.auth_context!;
  const id = req.params.id as string;

  const [existing] = await db
    .select({ appId: applicationsTable.id })
    .from(applicationsTable)
    .innerJoin(jobsTable, eq(applicationsTable.jobId, jobsTable.id))
    .where(and(eq(applicationsTable.id, id), eq(jobsTable.organizationId, organizationId)))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Application not found" });
    return;
  }

  await db.delete(applicationsTable).where(eq(applicationsTable.id, id));
  res.status(204).send();
});

router.patch("/:id/status", requireOrgMembership(["admin", "hiring_manager"]), async (req, res) => {
  const { organizationId, userId } = req.auth_context!;
  const id = req.params.id as string;
  const { status, notifyCandidate } = req.body;

  const validStatuses = ["new", "reviewed", "shortlisted", "rejected", "hired"];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
    return;
  }

  const [existing] = await db
    .select({
      id: applicationsTable.id,
      candidateId: applicationsTable.candidateId,
      jobId: applicationsTable.jobId,
    })
    .from(applicationsTable)
    .innerJoin(jobsTable, eq(applicationsTable.jobId, jobsTable.id))
    .where(and(eq(applicationsTable.id, id), eq(jobsTable.organizationId, organizationId)))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Application not found" });
    return;
  }

  const [updated] = await db
    .update(applicationsTable)
    .set({ status })
    .where(eq(applicationsTable.id, id))
    .returning();

  res.json(updated);

  if (notifyCandidate) {
    (async () => {
      try {
        const [candidate] = await db
          .select()
          .from(candidatesTable)
          .where(eq(candidatesTable.id, existing.candidateId))
          .limit(1);

        const [job] = await db
          .select({ title: jobsTable.title, organizationId: jobsTable.organizationId })
          .from(jobsTable)
          .where(eq(jobsTable.id, existing.jobId))
          .limit(1);

        const [org] = await db
          .select({ name: organizationsTable.name })
          .from(organizationsTable)
          .where(eq(organizationsTable.id, organizationId))
          .limit(1);

        if (!candidate || !job || !org) return;

        const templateSlug = status === "rejected" ? "rejection" : status === "hired" ? "offer" : "status_update";

        const [template] = await db
          .select()
          .from(emailTemplatesTable)
          .where(and(
            eq(emailTemplatesTable.organizationId, organizationId),
            eq(emailTemplatesTable.slug, templateSlug),
            eq(emailTemplatesTable.isDefault, true)
          ))
          .limit(1);

        if (!template) return;

        const mergeData: Record<string, string> = {
          candidateName: `${candidate.firstName} ${candidate.lastName}`,
          candidateEmail: candidate.email,
          jobTitle: job.title,
          companyName: org.name,
          status: status.charAt(0).toUpperCase() + status.slice(1),
        };

        await sendAndLogEmail({
          organizationId,
          applicationId: id,
          candidateId: candidate.id,
          templateId: template.id,
          toEmail: candidate.email,
          subject: renderTemplate(template.subject, mergeData),
          htmlBody: renderTemplate(template.htmlBody, mergeData),
          textBody: template.textBody ? renderTemplate(template.textBody, mergeData) : undefined,
          sentBy: userId,
        });
      } catch (err) {
        req.log?.error({ err }, "Error sending status change notification");
      }
    })();
  }
});

router.patch("/:id/notes", requireOrgMembership(["admin", "hiring_manager"]), async (req, res) => {
  const { organizationId } = req.auth_context!;
  const id = req.params.id as string;
  const { notes } = req.body;

  if (typeof notes !== "string") {
    res.status(400).json({ error: "notes must be a string" });
    return;
  }

  const [existing] = await db
    .select({ id: applicationsTable.id })
    .from(applicationsTable)
    .innerJoin(jobsTable, eq(applicationsTable.jobId, jobsTable.id))
    .where(and(eq(applicationsTable.id, id), eq(jobsTable.organizationId, organizationId)))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Application not found" });
    return;
  }

  const [updated] = await db
    .update(applicationsTable)
    .set({ notes })
    .where(eq(applicationsTable.id, id))
    .returning();

  res.json(updated);
});

router.post("/:id/ratings", requireOrgMembership(["admin", "hiring_manager"]), async (req, res) => {
  const { organizationId, userId } = req.auth_context!;
  const id = req.params.id as string;
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    res.status(400).json({ error: "Rating must be between 1 and 5" });
    return;
  }

  const [existing] = await db
    .select({ id: applicationsTable.id })
    .from(applicationsTable)
    .innerJoin(jobsTable, eq(applicationsTable.jobId, jobsTable.id))
    .where(and(eq(applicationsTable.id, id), eq(jobsTable.organizationId, organizationId)))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Application not found" });
    return;
  }

  const [ratingRecord] = await db
    .insert(applicationRatingsTable)
    .values({
      applicationId: id,
      ratedBy: userId,
      rating,
      comment,
    })
    .onConflictDoUpdate({
      target: [applicationRatingsTable.applicationId, applicationRatingsTable.ratedBy],
      set: { rating, comment },
    })
    .returning();

  res.status(201).json(ratingRecord);
});

router.get("/:id/ratings", requireOrgMembership(), async (req, res) => {
  const { organizationId } = req.auth_context!;
  const id = req.params.id as string;

  const [existing] = await db
    .select({ id: applicationsTable.id })
    .from(applicationsTable)
    .innerJoin(jobsTable, eq(applicationsTable.jobId, jobsTable.id))
    .where(and(eq(applicationsTable.id, id), eq(jobsTable.organizationId, organizationId)))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Application not found" });
    return;
  }

  const ratings = await db
    .select()
    .from(applicationRatingsTable)
    .where(eq(applicationRatingsTable.applicationId, id))
    .orderBy(desc(applicationRatingsTable.createdAt));

  res.json(ratings);
});

router.get("/:id/resume", requireAuth, async (req, res) => {
  const userId = req.userId!;
  const id = req.params.id as string;

  const [application] = await db
    .select({
      resumeUrl: candidatesTable.resumeUrl,
      orgId: jobsTable.organizationId,
    })
    .from(applicationsTable)
    .innerJoin(candidatesTable, eq(applicationsTable.candidateId, candidatesTable.id))
    .innerJoin(jobsTable, eq(applicationsTable.jobId, jobsTable.id))
    .where(eq(applicationsTable.id, id))
    .limit(1);

  if (!application || !application.resumeUrl) {
    res.status(404).json({ error: "Resume not found" });
    return;
  }

  const [member] = await db
    .select({ id: organizationMembersTable.id })
    .from(organizationMembersTable)
    .where(
      and(
        eq(organizationMembersTable.organizationId, application.orgId),
        eq(organizationMembersTable.userId, userId)
      )
    )
    .limit(1);

  if (!member) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  try {
    const objectStorageService = new ObjectStorageService();
    const objectFile = await objectStorageService.getObjectEntityFile(application.resumeUrl);
    const response = await objectStorageService.downloadObject(objectFile);

    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));

    if (response.body) {
      const nodeStream = Readable.fromWeb(response.body as ReadableStream<Uint8Array>);
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      res.status(404).json({ error: "Resume file not found" });
      return;
    }
    req.log.error({ err: error }, "Error serving resume");
    res.status(500).json({ error: "Failed to serve resume" });
  }
});

router.post("/:id/email", requireOrgMembership(["admin", "hiring_manager"]), async (req, res) => {
  const { organizationId, userId } = req.auth_context!;
  const id = req.params.id as string;
  const { templateId, subject, htmlBody, textBody } = req.body;

  if (!subject || !htmlBody) {
    res.status(400).json({ error: "subject and htmlBody are required" });
    return;
  }

  if (templateId) {
    const [tmpl] = await db.select({ id: emailTemplatesTable.id }).from(emailTemplatesTable)
      .where(and(eq(emailTemplatesTable.id, templateId), eq(emailTemplatesTable.organizationId, organizationId))).limit(1);
    if (!tmpl) {
      res.status(400).json({ error: "Template not found or does not belong to this organization" });
      return;
    }
  }

  const [application] = await db
    .select({
      id: applicationsTable.id,
      candidateId: applicationsTable.candidateId,
      candidateEmail: candidatesTable.email,
      candidateFirstName: candidatesTable.firstName,
      candidateLastName: candidatesTable.lastName,
    })
    .from(applicationsTable)
    .innerJoin(candidatesTable, eq(applicationsTable.candidateId, candidatesTable.id))
    .innerJoin(jobsTable, eq(applicationsTable.jobId, jobsTable.id))
    .where(and(eq(applicationsTable.id, id), eq(jobsTable.organizationId, organizationId)))
    .limit(1);

  if (!application) {
    res.status(404).json({ error: "Application not found" });
    return;
  }

  const result = await sendAndLogEmail({
    organizationId,
    applicationId: id,
    candidateId: application.candidateId,
    templateId: templateId || undefined,
    toEmail: application.candidateEmail,
    subject,
    htmlBody,
    textBody,
    sentBy: userId,
  });

  if (result.status === "failed") {
    res.status(500).json({ error: "Failed to send email", emailLogId: result.emailLogId, errorMessage: result.errorMessage });
    return;
  }

  res.json({ message: "Email sent", emailLogId: result.emailLogId });
});

router.post("/bulk-email", requireOrgMembership(["admin", "hiring_manager"]), async (req, res) => {
  const { organizationId, userId } = req.auth_context!;
  const { applicationIds, templateId, subject, htmlBody, textBody } = req.body;

  if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
    res.status(400).json({ error: "applicationIds array is required" });
    return;
  }

  if (!subject || !htmlBody) {
    res.status(400).json({ error: "subject and htmlBody are required" });
    return;
  }

  if (templateId) {
    const [tmpl] = await db.select({ id: emailTemplatesTable.id }).from(emailTemplatesTable)
      .where(and(eq(emailTemplatesTable.id, templateId), eq(emailTemplatesTable.organizationId, organizationId))).limit(1);
    if (!tmpl) {
      res.status(400).json({ error: "Template not found or does not belong to this organization" });
      return;
    }
  }

  const applications = await db
    .select({
      id: applicationsTable.id,
      candidateId: applicationsTable.candidateId,
      candidateEmail: candidatesTable.email,
      candidateFirstName: candidatesTable.firstName,
      candidateLastName: candidatesTable.lastName,
      jobTitle: jobsTable.title,
    })
    .from(applicationsTable)
    .innerJoin(candidatesTable, eq(applicationsTable.candidateId, candidatesTable.id))
    .innerJoin(jobsTable, eq(applicationsTable.jobId, jobsTable.id))
    .where(and(
      inArray(applicationsTable.id, applicationIds),
      eq(jobsTable.organizationId, organizationId)
    ));

  if (applications.length === 0) {
    res.status(404).json({ error: "No matching applications found" });
    return;
  }

  const [org] = await db
    .select({ name: organizationsTable.name })
    .from(organizationsTable)
    .where(eq(organizationsTable.id, organizationId))
    .limit(1);

  const results: Array<{ applicationId: string; emailLogId: string; status: string }> = [];

  for (const app of applications) {
    const mergeData: Record<string, string> = {
      candidateName: `${app.candidateFirstName} ${app.candidateLastName}`,
      candidateEmail: app.candidateEmail,
      jobTitle: app.jobTitle,
      companyName: org?.name || "",
    };

    const renderedSubject = renderTemplate(subject, mergeData);
    const renderedHtml = renderTemplate(htmlBody, mergeData);
    const renderedText = textBody ? renderTemplate(textBody, mergeData) : undefined;

    try {
      const emailResult = await sendAndLogEmail({
        organizationId,
        applicationId: app.id,
        candidateId: app.candidateId,
        templateId: templateId || undefined,
        toEmail: app.candidateEmail,
        subject: renderedSubject,
        htmlBody: renderedHtml,
        textBody: renderedText,
        sentBy: userId,
      });
      results.push({ applicationId: app.id, emailLogId: emailResult.emailLogId, status: emailResult.status });
    } catch {
      results.push({ applicationId: app.id, emailLogId: "", status: "failed" });
    }
  }

  res.json({ message: "Bulk email completed", results, total: results.length, sent: results.filter(r => r.status === "sent").length });
});

router.get("/:id/emails", requireOrgMembership(), async (req, res) => {
  const { organizationId } = req.auth_context!;
  const id = req.params.id as string;

  const [application] = await db
    .select({ id: applicationsTable.id })
    .from(applicationsTable)
    .innerJoin(jobsTable, eq(applicationsTable.jobId, jobsTable.id))
    .where(and(eq(applicationsTable.id, id), eq(jobsTable.organizationId, organizationId)))
    .limit(1);

  if (!application) {
    res.status(404).json({ error: "Application not found" });
    return;
  }

  const emails = await db
    .select()
    .from(emailLogsTable)
    .where(eq(emailLogsTable.applicationId, id))
    .orderBy(desc(emailLogsTable.sentAt));

  res.json(emails);
});

export default router;

