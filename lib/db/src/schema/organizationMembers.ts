import { pgTable, text, timestamp, uuid, pgEnum, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { organizationsTable } from "./organizations";

export const orgRoleEnum = pgEnum("org_role", ["admin", "hiring_manager", "viewer"]);

export const organizationMembersTable = pgTable("organization_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizationsTable.id, { onDelete: "cascade" }),
  clerkUserId: text("clerk_user_id").notNull(),
  role: orgRoleEnum("role").notNull().default("viewer"),
  displayName: text("display_name"),
  email: text("email"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  unique("uq_org_member").on(table.organizationId, table.clerkUserId),
]);

export const insertOrganizationMemberSchema = createInsertSchema(organizationMembersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOrganizationMember = z.infer<typeof insertOrganizationMemberSchema>;
export type OrganizationMember = typeof organizationMembersTable.$inferSelect;
