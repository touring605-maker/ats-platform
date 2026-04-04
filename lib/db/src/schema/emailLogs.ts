import { pgTable, text, timestamp, uuid, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { organizationsTable } from "./organizations";
import { applicationsTable } from "./applications";
import { candidatesTable } from "./candidates";
import { emailTemplatesTable } from "./emailTemplates";
import { usersTable } from "./users";

export const emailStatusEnum = pgEnum("email_status", ["pending", "sent", "failed"]);

export const emailLogsTable = pgTable("email_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizationsTable.id, { onDelete: "cascade" }),
  applicationId: uuid("application_id").references(() => applicationsTable.id, { onDelete: "set null" }),
  candidateId: uuid("candidate_id").references(() => candidatesTable.id, { onDelete: "set null" }),
  templateId: uuid("template_id").references(() => emailTemplatesTable.id, { onDelete: "set null" }),
  toEmail: text("to_email").notNull(),
  subject: text("subject").notNull(),
  htmlBody: text("html_body").notNull(),
  textBody: text("text_body"),
  status: emailStatusEnum("status").notNull().default("pending"),
  sentBy: uuid("sent_by").references(() => usersTable.id),
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertEmailLogSchema = createInsertSchema(emailLogsTable).omit({ id: true, sentAt: true });
export type InsertEmailLog = z.infer<typeof insertEmailLogSchema>;
export type EmailLog = typeof emailLogsTable.$inferSelect;
