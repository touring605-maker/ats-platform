import { Router } from "express";
import { db } from "@workspace/db";
import { candidatesTable, type InsertCandidate } from "@workspace/db/schema";
import { eq, and, ilike, or, count } from "drizzle-orm";
import { requireOrgMembership } from "../middlewares/requireAuth";

const router = Router();

router.get("/", requireOrgMembership(), async (req, res) => {
  const { organizationId } = req.auth_context!;
  const search = req.query.search as string | undefined;
  const page = (req.query.page as string | undefined) ?? "1";
  const limit = (req.query.limit as string | undefined) ?? "20";

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  const conditions = [eq(candidatesTable.organizationId, organizationId)];

  if (search) {
    conditions.push(
      or(
        ilike(candidatesTable.firstName, `%${search}%`),
        ilike(candidatesTable.lastName, `%${search}%`),
        ilike(candidatesTable.email, `%${search}%`)
      )!
    );
  }

  const where = and(...conditions);

  const [candidates, [{ total }]] = await Promise.all([
    db.select().from(candidatesTable).where(where).limit(limitNum).offset(offset).orderBy(candidatesTable.createdAt),
    db.select({ total: count() }).from(candidatesTable).where(where),
  ]);

  res.json({
    data: candidates,
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

  const [candidate] = await db
    .select()
    .from(candidatesTable)
    .where(and(eq(candidatesTable.id, id), eq(candidatesTable.organizationId, organizationId)))
    .limit(1);

  if (!candidate) {
    res.status(404).json({ error: "Candidate not found" });
    return;
  }

  res.json(candidate);
});

router.post("/", requireOrgMembership(["admin", "hiring_manager"]), async (req, res) => {
  const { organizationId } = req.auth_context!;
  const { firstName, lastName, email, phone, resumeUrl, linkedinUrl, source } = req.body;

  const [candidate] = await db
    .insert(candidatesTable)
    .values({
      firstName,
      lastName,
      email,
      phone,
      resumeUrl,
      linkedinUrl,
      source,
      organizationId,
    })
    .returning();

  res.status(201).json(candidate);
});

router.patch("/:id", requireOrgMembership(["admin", "hiring_manager"]), async (req, res) => {
  const { organizationId } = req.auth_context!;
  const id = req.params.id as string;
  const { firstName, lastName, email, phone, resumeUrl, linkedinUrl, source } = req.body;

  const updateData: Partial<InsertCandidate> = {};
  if (firstName !== undefined) updateData.firstName = firstName;
  if (lastName !== undefined) updateData.lastName = lastName;
  if (email !== undefined) updateData.email = email;
  if (phone !== undefined) updateData.phone = phone;
  if (resumeUrl !== undefined) updateData.resumeUrl = resumeUrl;
  if (linkedinUrl !== undefined) updateData.linkedinUrl = linkedinUrl;
  if (source !== undefined) updateData.source = source;

  const [candidate] = await db
    .update(candidatesTable)
    .set(updateData)
    .where(and(eq(candidatesTable.id, id), eq(candidatesTable.organizationId, organizationId)))
    .returning();

  if (!candidate) {
    res.status(404).json({ error: "Candidate not found" });
    return;
  }

  res.json(candidate);
});

router.delete("/:id", requireOrgMembership(["admin"]), async (req, res) => {
  const { organizationId } = req.auth_context!;
  const id = req.params.id as string;

  const [deleted] = await db
    .delete(candidatesTable)
    .where(and(eq(candidatesTable.id, id), eq(candidatesTable.organizationId, organizationId)))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Candidate not found" });
    return;
  }

  res.status(204).send();
});

export default router;
