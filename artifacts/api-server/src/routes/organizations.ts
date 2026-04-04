import { Router } from "express";
import { db } from "@workspace/db";
import { organizationsTable, organizationMembersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, requireOrgMembership } from "../middlewares/requireAuth";

const router = Router();

router.get("/mine", requireAuth, async (req, res) => {
  const userId = req.userId!;

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

  const { clerkUserId, role, displayName, email } = req.body as {
    clerkUserId: string;
    role?: "admin" | "hiring_manager" | "viewer";
    displayName?: string;
    email?: string;
  };

  const memberRole = role || "viewer";

  const [member] = await db
    .insert(organizationMembersTable)
    .values({
      organizationId: id,
      clerkUserId,
      role: memberRole,
      displayName,
      email,
    })
    .onConflictDoUpdate({
      target: [organizationMembersTable.organizationId, organizationMembersTable.clerkUserId],
      set: { role: memberRole, displayName, email },
    })
    .returning();

  res.status(201).json(member);
});

export default router;
