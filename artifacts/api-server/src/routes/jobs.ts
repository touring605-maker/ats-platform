import { Router } from "express";
import { db } from "@workspace/db";
import { jobsTable, type InsertJob, type CustomField } from "@workspace/db/schema";
import { eq, and, ilike, count, sql, desc } from "drizzle-orm";
import { requireOrgMembership } from "../middlewares/requireAuth";
import { CreateJobBody, UpdateJobBody } from "@workspace/api-zod";
import sanitizeHtml from "sanitize-html";

const sanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: ["b", "i", "em", "strong", "p", "br", "ul", "ol", "li", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "code", "pre"],
  allowedAttributes: {},
  disallowedTagsMode: "discard",
};

function sanitizeRichText(html: string | undefined | null): string {
  if (!html) return "";
  return sanitizeHtml(html, sanitizeOptions);
}

type JobStatus = "draft" | "published" | "closed" | "archived";
const validJobStatuses: JobStatus[] = ["draft", "published", "closed", "archived"];

const router = Router();

router.get("/stats", requireOrgMembership(), async (req, res) => {
  const { organizationId } = req.auth_context!;

  const rows = await db
    .select({
      status: jobsTable.status,
      cnt: count(),
    })
    .from(jobsTable)
    .where(eq(jobsTable.organizationId, organizationId))
    .groupBy(jobsTable.status);

  const stats: Record<string, number> = { draft: 0, published: 0, closed: 0, archived: 0, total: 0 };
  for (const row of rows) {
    stats[row.status] = Number(row.cnt);
    stats.total += Number(row.cnt);
  }

  res.json(stats);
});

router.get("/", requireOrgMembership(), async (req, res) => {
  const { organizationId } = req.auth_context!;
  const status = req.query.status as string | undefined;
  const search = req.query.search as string | undefined;
  const department = req.query.department as string | undefined;
  const location = req.query.location as string | undefined;
  const rawPage = parseInt((req.query.page as string) || "1", 10);
  const rawLimit = parseInt((req.query.limit as string) || "20", 10);

  const pageNum = Number.isNaN(rawPage) ? 1 : Math.max(1, rawPage);
  const limitNum = Number.isNaN(rawLimit) ? 20 : Math.min(100, Math.max(1, rawLimit));
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
  if (location) {
    conditions.push(ilike(jobsTable.location, `%${location}%`));
  }

  const where = and(...conditions);

  const [jobs, [{ total }]] = await Promise.all([
    db
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
      .where(where)
      .limit(limitNum)
      .offset(offset)
      .orderBy(desc(jobsTable.createdAt)),
    db.select({ total: count() }).from(jobsTable).where(where),
  ]);

  res.json({
    data: jobs.map((j) => ({ ...j, applicationCount: Number(j.applicationCount) })),
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

  const parsed = CreateJobBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors });
    return;
  }

  const { title, department, location, employmentType, salaryMin, salaryMax, salaryCurrency, description, requirements, customFields, isRemote } = parsed.data;

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
      description: sanitizeRichText(description),
      requirements: sanitizeRichText(requirements),
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

  const parsed = UpdateJobBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors });
    return;
  }

  const [existing] = await db
    .select()
    .from(jobsTable)
    .where(and(eq(jobsTable.id, id), eq(jobsTable.organizationId, organizationId)))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  const { title, department, location, employmentType, salaryMin, salaryMax, salaryCurrency, description, requirements, status, customFields, isRemote } = parsed.data;

  const updateData: Partial<InsertJob> & { publishedAt?: Date | null; closedAt?: Date | null } = {};
  if (title !== undefined) updateData.title = title;
  if (department !== undefined) updateData.department = department;
  if (location !== undefined) updateData.location = location;
  if (employmentType !== undefined) updateData.employmentType = employmentType;
  if (salaryMin !== undefined) updateData.salaryMin = salaryMin;
  if (salaryMax !== undefined) updateData.salaryMax = salaryMax;
  if (salaryCurrency !== undefined) updateData.salaryCurrency = salaryCurrency;
  if (description !== undefined) updateData.description = sanitizeRichText(description);
  if (requirements !== undefined) updateData.requirements = sanitizeRichText(requirements);
  if (customFields !== undefined) updateData.customFields = customFields;
  if (isRemote !== undefined) updateData.isRemote = isRemote;

  if (status !== undefined && validJobStatuses.includes(status)) {
    updateData.status = status;
    if (status === "published" && (existing.status === "draft" || existing.status === "closed")) {
      updateData.publishedAt = new Date();
      if (existing.status === "closed") {
        updateData.closedAt = null;
      }
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

router.get("/:id/form-fields", requireOrgMembership(), async (req, res) => {
  const { organizationId } = req.auth_context!;
  const id = req.params.id as string;

  const [job] = await db
    .select({ customFields: jobsTable.customFields })
    .from(jobsTable)
    .where(and(eq(jobsTable.id, id), eq(jobsTable.organizationId, organizationId)))
    .limit(1);

  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  res.json(job.customFields || []);
});

router.put("/:id/form-fields", requireOrgMembership(["admin", "hiring_manager"]), async (req, res) => {
  const { organizationId } = req.auth_context!;
  const id = req.params.id as string;

  const fields = req.body;
  if (!Array.isArray(fields)) {
    res.status(400).json({ error: "Body must be an array of form fields" });
    return;
  }

  const fieldsWithOrder: CustomField[] = fields.map((f: CustomField, i: number) => ({ ...f, order: i }));

  const [job] = await db
    .update(jobsTable)
    .set({ customFields: fieldsWithOrder })
    .where(and(eq(jobsTable.id, id), eq(jobsTable.organizationId, organizationId)))
    .returning();

  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  res.json(job.customFields || []);
});

router.post("/:id/form-fields", requireOrgMembership(["admin", "hiring_manager"]), async (req, res) => {
  const { organizationId } = req.auth_context!;
  const id = req.params.id as string;

  const [existing] = await db
    .select({ customFields: jobsTable.customFields })
    .from(jobsTable)
    .where(and(eq(jobsTable.id, id), eq(jobsTable.organizationId, organizationId)))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  const currentFields: CustomField[] = existing.customFields || [];
  const newField: CustomField = { ...req.body, order: currentFields.length };
  const updatedFields: CustomField[] = [...currentFields, newField];

  const [job] = await db
    .update(jobsTable)
    .set({ customFields: updatedFields })
    .where(and(eq(jobsTable.id, id), eq(jobsTable.organizationId, organizationId)))
    .returning();

  res.status(201).json(job!.customFields || []);
});

router.delete("/:id/form-fields/:fieldId", requireOrgMembership(["admin", "hiring_manager"]), async (req, res) => {
  const { organizationId } = req.auth_context!;
  const id = req.params.id as string;
  const fieldId = req.params.fieldId as string;

  const [existing] = await db
    .select({ customFields: jobsTable.customFields })
    .from(jobsTable)
    .where(and(eq(jobsTable.id, id), eq(jobsTable.organizationId, organizationId)))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  const currentFields: CustomField[] = existing.customFields || [];
  const updatedFields: CustomField[] = currentFields
    .filter((f) => f.id !== fieldId)
    .map((f, i) => ({ ...f, order: i }));

  const [job] = await db
    .update(jobsTable)
    .set({ customFields: updatedFields })
    .where(and(eq(jobsTable.id, id), eq(jobsTable.organizationId, organizationId)))
    .returning();

  res.json(job!.customFields || []);
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
