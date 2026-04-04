import { Router } from "express";
import { db } from "@workspace/db";
import { jobsTable } from "@workspace/db/schema";
import { eq, and, ilike, sql, count } from "drizzle-orm";
import { requireOrgMembership } from "../middlewares/requireAuth";

const router = Router();

router.get("/", requireOrgMembership(), async (req, res) => {
  const { organizationId } = req.auth_context!;
  const { status, search, department, page = "1", limit = "20" } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  const conditions = [eq(jobsTable.organizationId, organizationId)];

  if (status) {
    conditions.push(eq(jobsTable.status, status as any));
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

  const [job] = await db
    .insert(jobsTable)
    .values({
      ...req.body,
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

  const updateData: Record<string, any> = { ...req.body };
  delete updateData.id;
  delete updateData.organizationId;
  delete updateData.createdBy;

  if (updateData.status === "published" && existing.status === "draft") {
    updateData.publishedAt = new Date();
  }
  if (updateData.status === "closed" && existing.status === "published") {
    updateData.closedAt = new Date();
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
