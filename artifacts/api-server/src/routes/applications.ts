import { Router } from "express";
import { db } from "@workspace/db";
import { applicationsTable, applicationRatingsTable, candidatesTable, jobsTable } from "@workspace/db/schema";
import { eq, and, count, avg, desc } from "drizzle-orm";
import { requireOrgMembership } from "../middlewares/requireAuth";

const router = Router();

router.get("/", requireOrgMembership(), async (req, res) => {
  const { organizationId } = req.auth_context!;
  const { jobId, status, page = "1", limit = "20" } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  const conditions = [eq(jobsTable.organizationId, organizationId)];

  if (jobId) {
    conditions.push(eq(applicationsTable.jobId, jobId));
  }
  if (status) {
    conditions.push(eq(applicationsTable.status, status as any));
  }

  const where = and(...conditions);

  const [applications, [{ total }]] = await Promise.all([
    db
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
        jobTitle: jobsTable.title,
      })
      .from(applicationsTable)
      .innerJoin(candidatesTable, eq(applicationsTable.candidateId, candidatesTable.id))
      .innerJoin(jobsTable, eq(applicationsTable.jobId, jobsTable.id))
      .where(where)
      .limit(limitNum)
      .offset(offset)
      .orderBy(desc(applicationsTable.appliedAt)),
    db
      .select({ total: count() })
      .from(applicationsTable)
      .innerJoin(jobsTable, eq(applicationsTable.jobId, jobsTable.id))
      .where(where),
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
      jobTitle: jobsTable.title,
      jobDepartment: jobsTable.department,
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
    .where(eq(applicationRatingsTable.applicationId, id));

  res.json({ ...application, ratings });
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
    .where(eq(applicationRatingsTable.applicationId, id));

  res.json(ratings);
});

export default router;
