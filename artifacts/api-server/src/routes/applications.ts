import { Router } from "express";
import { db } from "@workspace/db";
import { applicationsTable, applicationRatingsTable, candidatesTable, jobsTable } from "@workspace/db/schema";
import { eq, and, count, avg, desc, asc, gte, lte, sql, ilike, or } from "drizzle-orm";
import { requireOrgMembership } from "../middlewares/requireAuth";

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

  const where = and(...conditions);

  const ratingSubquery = db
    .select({
      applicationId: applicationRatingsTable.applicationId,
      avgRating: avg(applicationRatingsTable.rating).as("avg_rating"),
      ratingCount: count(applicationRatingsTable.id).as("rating_count"),
    })
    .from(applicationRatingsTable)
    .groupBy(applicationRatingsTable.applicationId)
    .as("rating_agg");

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

  let baseQuery = db
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

  if (minRating) {
    const minRatingNum = parseFloat(minRating);
    if (!isNaN(minRatingNum)) {
      baseQuery = baseQuery.having(
        gte(sql`COALESCE(${ratingSubquery.avgRating}, 0)`, sql`${minRatingNum}`)
      ) as typeof baseQuery;
    }
  }

  let countQuery = db
    .select({ total: count() })
    .from(applicationsTable)
    .innerJoin(candidatesTable, eq(applicationsTable.candidateId, candidatesTable.id))
    .innerJoin(jobsTable, eq(applicationsTable.jobId, jobsTable.id))
    .leftJoin(ratingSubquery, eq(applicationsTable.id, ratingSubquery.applicationId))
    .where(where);

  if (minRating) {
    const minRatingNum = parseFloat(minRating);
    if (!isNaN(minRatingNum)) {
      countQuery = countQuery.having(
        gte(sql`COALESCE(${ratingSubquery.avgRating}, 0)`, sql`${minRatingNum}`)
      ) as typeof countQuery;
    }
  }

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
  const { organizationId } = req.auth_context!;
  const id = req.params.id as string;
  const { status } = req.body;

  const validStatuses = ["new", "reviewed", "shortlisted", "rejected", "hired"];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
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
    .set({ status })
    .where(eq(applicationsTable.id, id))
    .returning();

  res.json(updated);
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

export default router;
