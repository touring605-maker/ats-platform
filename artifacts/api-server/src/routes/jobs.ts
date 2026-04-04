import { Router } from "express";
import { db } from "@workspace/db";
import { jobsTable, type InsertJob } from "@workspace/db/schema";
import { eq, and, ilike, count } from "drizzle-orm";
import { requireOrgMembership } from "../middlewares/requireAuth";

type JobStatus = "draft" | "published" | "closed" | "archived";
const validJobStatuses: JobStatus[] = ["draft", "published", "closed", "archived"];

const router = Router();

router.get("/", requireOrgMembership(), async (req, res) => {
  const { organizationId } = req.auth_context!;
  const status = req.query.status as string | undefined;
  const search = req.query.search as string | undefined;
  const department = req.query.department as string | undefined;
  const page = req.query.page as string | undefined ?? "1";
  const limit = req.query.limit as string | undefined ?? "20";

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  const conditions = [eq(jobsTable.organizationId, organizationId)];

  if (status && validJobStatuses.includes(status as JobStatus)) {
    conditions.push(eq(jobsTable.status, status as JobStatus));
  }
  if (search) {
    conditions.push(ilike(jobsTable.title, `%${search}%`));
  }
  if (department) {
    conditions.push(eq(jobsTable.department, department));
  }

  const where = and(...conditions);

  const [jobs, [{ total }]] = await Promise.all([
    db.select().from(jobsTable).where(where).limit(limitNum).offset(offset).orderBy(jobsTable.createdAt),
    db.select({ total: count() }).from(jobsTable).where(where),
  ]);

  res.json({
    data: jobs,
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

  const [job] = await db
    .select()
    .from(jobsTable)
    .where(and(eq(jobsTable.id, id), eq(jobsTable.organizationId, organizationId)))
    .limit(1);

  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  res.json(job);
});

router.post("/", requireOrgMembership(["admin", "hiring_manager"]), async (req, res) => {
  const { organizationId, userId } = req.auth_context!;
  const { title, department, location, employmentType, salaryMin, salaryMax, salaryCurrency, description, requirements, customFields, isRemote } = req.body;

  const [job] = await db
    .insert(jobsTable)
    .values({
      title,
      department,
      location,
      employmentType,
      salaryMin,
      salaryMax,
      salaryCurrency,
      description,
      requirements,
      customFields,
      isRemote,
      organizationId,
      createdBy: userId,
    })
    .returning();

  res.status(201).json(job);
});

router.patch("/:id", requireOrgMembership(["admin", "hiring_manager"]), async (req, res) => {
  const { organizationId } = req.auth_context!;
  const id = req.params.id as string;

  const [existing] = await db
    .select()
    .from(jobsTable)
    .where(and(eq(jobsTable.id, id), eq(jobsTable.organizationId, organizationId)))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  const { title, department, location, employmentType, salaryMin, salaryMax, salaryCurrency, description, requirements, status, customFields, isRemote } = req.body;

  const updateData: Partial<InsertJob> & { publishedAt?: Date; closedAt?: Date } = {};
  if (title !== undefined) updateData.title = title;
  if (department !== undefined) updateData.department = department;
  if (location !== undefined) updateData.location = location;
  if (employmentType !== undefined) updateData.employmentType = employmentType;
  if (salaryMin !== undefined) updateData.salaryMin = salaryMin;
  if (salaryMax !== undefined) updateData.salaryMax = salaryMax;
  if (salaryCurrency !== undefined) updateData.salaryCurrency = salaryCurrency;
  if (description !== undefined) updateData.description = description;
  if (requirements !== undefined) updateData.requirements = requirements;
  if (customFields !== undefined) updateData.customFields = customFields;
  if (isRemote !== undefined) updateData.isRemote = isRemote;

  if (status !== undefined && validJobStatuses.includes(status)) {
    updateData.status = status;
    if (status === "published" && existing.status === "draft") {
      updateData.publishedAt = new Date();
    }
    if (status === "closed" && existing.status === "published") {
      updateData.closedAt = new Date();
    }
  }

  const [job] = await db
    .update(jobsTable)
    .set(updateData)
    .where(and(eq(jobsTable.id, id), eq(jobsTable.organizationId, organizationId)))
    .returning();

  res.json(job);
});

router.delete("/:id", requireOrgMembership(["admin"]), async (req, res) => {
  const { organizationId } = req.auth_context!;
  const id = req.params.id as string;

  const [deleted] = await db
    .delete(jobsTable)
    .where(and(eq(jobsTable.id, id), eq(jobsTable.organizationId, organizationId)))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  res.status(204).send();
});

export default router;
