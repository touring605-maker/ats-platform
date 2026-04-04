import { pgTable, text, timestamp, uuid, integer, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { applicationsTable } from "./applications";

export const applicationRatingsTable = pgTable("application_ratings", {
  id: uuid("id").defaultRandom().primaryKey(),
  applicationId: uuid("application_id").notNull().references(() => applicationsTable.id, { onDelete: "cascade" }),
  ratedBy: text("rated_by").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  unique("uq_rating_per_user").on(table.applicationId, table.ratedBy),
]);

export const insertApplicationRatingSchema = createInsertSchema(applicationRatingsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertApplicationRating = z.infer<typeof insertApplicationRatingSchema>;
export type ApplicationRating = typeof applicationRatingsTable.$inferSelect;
