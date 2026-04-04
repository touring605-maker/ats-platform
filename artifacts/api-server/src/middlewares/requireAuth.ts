import type { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { organizationMembersTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

export interface AuthContext {
  userId: string;
  orgMemberId: string;
  organizationId: string;
  role: "admin" | "hiring_manager" | "viewer";
}

declare global {
  namespace Express {
    interface Request {
      auth_context?: AuthContext;
      userId?: string;
    }
  }
}

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.userId = userId;
  next();
}

export function requireOrgMembership(allowedRoles?: Array<"admin" | "hiring_manager" | "viewer">) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.session?.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const orgId = req.headers["x-organization-id"] as string;
    if (!orgId) {
      res.status(400).json({ error: "Missing X-Organization-Id header" });
      return;
    }

    const [member] = await db
      .select()
      .from(organizationMembersTable)
      .where(
        and(
          eq(organizationMembersTable.organizationId, orgId),
          eq(organizationMembersTable.userId, userId)
        )
      )
      .limit(1);

    if (!member) {
      res.status(403).json({ error: "Not a member of this organization" });
      return;
    }

    if (allowedRoles && !allowedRoles.includes(member.role)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    req.auth_context = {
      userId,
      orgMemberId: member.id,
      organizationId: member.organizationId,
      role: member.role,
    };

    next();
  };
}
