import { Router } from "express";
import { db } from "@workspace/db";
import { jobsTable, candidatesTable, applicationsTable } from "@workspace/db/schema";
import { eq, and, count, sql, desc } from "drizzle-orm";
import { requireOrgMembership } from "../middlewares/requireAuth";

const router = Router();

router.get("/summary", requireOrgMembership(), async (req, res) => {
  const { organizationId } = req.auth_context!;

  const [jobCounts] = await db
    .select({ total: count() })
    .from(jobsTable)
    .where(eq(jobsTable.organizationId, organizationId));

  const [activeJobCounts] = await db
    .select({ total: count() })
    .from(jobsTable)
    .where(and(eq(jobsTable.organizationId, organizationId), eq(jobsTable.status, "published")));

  const [candidateCounts] = await db
    .select({ total: count() })
    .from(candidatesTable)
    .where(eq(candidatesTable.organizationId, organizationId));

  const [applicationCounts] = await db
    .select({ total: count() })
    .from(applicationsTable)
    .innerJoin(jobsTable, eq(applicationsTable.jobId, jobsTable.id))
    .where(eq(jobsTable.organizationId, organizationId));

  const appStatusRows = await db
    .select({
      status: applicationsTable.status,
      cnt: count(),
    })
    .from(applicationsTable)
    .innerJoin(jobsTable, eq(applicationsTable.jobId, jobsTable.id))
    .where(eq(jobsTable.organizationId, organizationId))
    .groupBy(applicationsTable.status);

  const applicationsByStatus: Record<string, number> = {
    new: 0,
    reviewed: 0,
    shortlisted: 0,
    rejected: 0,
    hired: 0,
  };
  for (const row of appStatusRows) {
    applicationsByStatus[row.status] = Number(row.cnt);
  }

  const recentJobs = await db
    .select({
      id: jobsTable.id,
      organizationId: jobsTable.organizationId,
      title: jobsTable.title,
      department: jobsTable.department,
      location: jobsTable.location,
      employmentType: jobsTable.employmentType,
      salaryMin: jobsTable.salaryMin,
      salaryMax: jobsTable.salaryMax,
      salaryCurrency: jobsTable.salaryCurrency,
      description: jobsTable.description,
      requirements: jobsTable.requirements,
      status: jobsTable.status,
      customFields: jobsTable.customFields,
      isRemote: jobsTable.isRemote,
      publishedAt: jobsTable.publishedAt,
      closedAt: jobsTable.closedAt,
      createdBy: jobsTable.createdBy,
      createdAt: jobsTable.createdAt,
      updatedAt: jobsTable.updatedAt,
      applicationCount: sql<number>`(SELECT COUNT(*) FROM applications WHERE applications.job_id = ${jobsTable.id})`.as("applicationCount"),
    })
    .from(jobsTable)
    .where(eq(jobsTable.organizationId, organizationId))
    .orderBy(desc(jobsTable.createdAt))
    .limit(5);

  res.json({
    totalJobs: Number(jobCounts.total),
    activeJobs: Number(activeJobCounts.total),
    totalCandidates: Number(candidateCounts.total),
    totalApplications: Number(applicationCounts.total),
    applicationsByStatus,
    recentJobs: recentJobs.map((j) => ({
      ...j,
      applicationCount: Number(j.applicationCount),
    })),
  });
});

export default router;
