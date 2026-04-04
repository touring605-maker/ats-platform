import { Router } from "express";
import { db } from "@workspace/db";
import { organizationsTable, organizationMembersTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireOrgMembership } from "../middlewares/requireAuth";

const router = Router();

router.get("/mine", requireAuth, async (req, res) => {
  const userId = (req as any).userId as string;

  const memberships = await db
    .select({
      organizationId: organizationMembersTable.organizationId,
      role: organizationMembersTable.role,
      orgName: organizationsTable.name,
      orgSlug: organizationsTable.slug,
      orgLogoUrl: organizationsTable.logoUrl,
    })
    .from(organizationMembersTable)
    .innerJoin(organizationsTable, eq(organizationMembersTable.organizationId, organizationsTable.id))
    .where(eq(organizationMembersTable.clerkUserId, userId));

  res.json(memberships);
});

router.get("/:id", requireOrgMembership(), async (req, res) => {
  const { organizationId } = req.auth_context!;
  const id = req.params.id as string;

  if (id !== organizationId) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  const [org] = await db
    .select()
    .from(organizationsTable)
    .where(eq(organizationsTable.id, id))
    .limit(1);

  if (!org) {
    res.status(404).json({ error: "Organization not found" });
    return;
  }

  res.json(org);
});

router.get("/:id/members", requireOrgMembership(), async (req, res) => {
  const { organizationId } = req.auth_context!;
  const id = req.params.id as string;

  if (id !== organizationId) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  const members = await db
    .select()
    .from(organizationMembersTable)
    .where(eq(organizationMembersTable.organizationId, id));

  res.json(members);
});

router.post("/:id/members", requireOrgMembership(["admin"]), async (req, res) => {
  const { organizationId } = req.auth_context!;
  const id = req.params.id as string;

  if (id !== organizationId) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  const { clerkUserId, role, displayName, email } = req.body;

  const [member] = await db
    .insert(organizationMembersTable)
    .values({
      organizationId: id,
      clerkUserId,
      role: role || "viewer",
      displayName,
      email,
    })
    .onConflictDoUpdate({
      target: [organizationMembersTable.organizationId, organizationMembersTable.clerkUserId],
      set: { role: role || "viewer", displayName, email },
    })
    .returning();

  res.status(201).json(member);
});

export default router;
