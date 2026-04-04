import { pgTable, text, timestamp, uuid, pgEnum, jsonb, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { jobsTable } from "./jobs";
import { candidatesTable } from "./candidates";

export const applicationStatusEnum = pgEnum("application_status", ["new", "reviewed", "shortlisted", "rejected", "hired"]);

export const applicationsTable = pgTable("applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  jobId: uuid("job_id").notNull().references(() => jobsTable.id, { onDelete: "cascade" }),
  candidateId: uuid("candidate_id").notNull().references(() => candidatesTable.id, { onDelete: "cascade" }),
  status: applicationStatusEnum("status").notNull().default("new"),
  customFieldResponses: jsonb("custom_field_responses").$type<Record<string, string>>().default({}),
  coverLetter: text("cover_letter"),
  notes: text("notes"),
  appliedAt: timestamp("applied_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  unique("uq_application").on(table.jobId, table.candidateId),
]);

export const insertApplicationSchema = createInsertSchema(applicationsTable).omit({ id: true, appliedAt: true, updatedAt: true });
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applicationsTable.$inferSelect;
