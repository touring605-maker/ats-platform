import { pgTable, text, timestamp, uuid, pgEnum, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { organizationsTable } from "./organizations";

export const jobStatusEnum = pgEnum("job_status", ["draft", "published", "closed", "archived"]);
export const employmentTypeEnum = pgEnum("employment_type", ["full_time", "part_time", "contract", "internship", "temporary"]);

export const jobsTable = pgTable("jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizationsTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  department: text("department"),
  location: text("location"),
  employmentType: employmentTypeEnum("employment_type").notNull().default("full_time"),
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  salaryCurrency: text("salary_currency").default("USD"),
  description: text("description"),
  requirements: text("requirements"),
  status: jobStatusEnum("status").notNull().default("draft"),
  customFields: jsonb("custom_fields").$type<CustomField[]>().default([]),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  closedAt: timestamp("closed_at", { withTimezone: true }),
  createdBy: text("created_by").notNull(),
  isRemote: boolean("is_remote").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export interface CustomField {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "file" | "boolean";
  required: boolean;
  options?: string[];
  order: number;
}

export const insertJobSchema = createInsertSchema(jobsTable).omit({ id: true, createdAt: true, updatedAt: true, publishedAt: true, closedAt: true });
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobsTable.$inferSelect;
