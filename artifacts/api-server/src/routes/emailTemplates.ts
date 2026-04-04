import { Router } from "express";
import { db } from "@workspace/db";
import { emailTemplatesTable } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireOrgMembership } from "../middlewares/requireAuth";

const router = Router();

const DEFAULT_TEMPLATES = [
  {
    name: "Application Received",
    slug: "application_received",
    subject: "New application for {{jobTitle}}",
    htmlBody: `<h2>New Application Received</h2>
<p>A new application has been submitted for <strong>{{jobTitle}}</strong>.</p>
<p><strong>Candidate:</strong> {{candidateName}}<br/>
<strong>Email:</strong> {{candidateEmail}}</p>
<p>Log in to your dashboard to review this application.</p>`,
    mergeFields: ["jobTitle", "candidateName", "candidateEmail", "companyName"],
    isDefault: true,
  },
  {
    name: "Application Confirmation",
    slug: "application_confirmation",
    subject: "Your application for {{jobTitle}} at {{companyName}}",
    htmlBody: `<h2>Application Received</h2>
<p>Hi {{candidateName}},</p>
<p>Thank you for applying for the <strong>{{jobTitle}}</strong> position at <strong>{{companyName}}</strong>.</p>
<p>We have received your application and our team will review it shortly. We'll be in touch if your profile matches our requirements.</p>
<p>Best regards,<br/>{{companyName}} Hiring Team</p>`,
    mergeFields: ["jobTitle", "candidateName", "candidateEmail", "companyName"],
    isDefault: true,
  },
  {
    name: "Status Update",
    slug: "status_update",
    subject: "Update on your application for {{jobTitle}}",
    htmlBody: `<h2>Application Update</h2>
<p>Hi {{candidateName}},</p>
<p>We wanted to let you know that the status of your application for <strong>{{jobTitle}}</strong> at <strong>{{companyName}}</strong> has been updated to: <strong>{{status}}</strong>.</p>
<p>If you have any questions, please don't hesitate to reach out.</p>
<p>Best regards,<br/>{{companyName}} Hiring Team</p>`,
    mergeFields: ["jobTitle", "candidateName", "candidateEmail", "companyName", "status"],
    isDefault: true,
  },
  {
    name: "Rejection",
    slug: "rejection",
    subject: "Regarding your application for {{jobTitle}}",
    htmlBody: `<h2>Application Update</h2>
<p>Hi {{candidateName}},</p>
<p>Thank you for your interest in the <strong>{{jobTitle}}</strong> position at <strong>{{companyName}}</strong>.</p>
<p>After careful consideration, we have decided to move forward with other candidates whose experience more closely matches our needs at this time.</p>
<p>We appreciate the time you invested in your application and encourage you to apply for future opportunities with us.</p>
<p>Best wishes,<br/>{{companyName}} Hiring Team</p>`,
    mergeFields: ["jobTitle", "candidateName", "candidateEmail", "companyName"],
    isDefault: true,
  },
  {
    name: "Offer",
    slug: "offer",
    subject: "Congratulations! Offer for {{jobTitle}} at {{companyName}}",
    htmlBody: `<h2>Job Offer</h2>
<p>Hi {{candidateName}},</p>
<p>We are pleased to inform you that after careful evaluation, we would like to offer you the <strong>{{jobTitle}}</strong> position at <strong>{{companyName}}</strong>!</p>
<p>We were impressed with your qualifications and believe you will be a great addition to our team. We will be in touch shortly with the details of the offer.</p>
<p>Congratulations!<br/>{{companyName}} Hiring Team</p>`,
    mergeFields: ["jobTitle", "candidateName", "candidateEmail", "companyName"],
    isDefault: true,
  },
];

router.get("/", requireOrgMembership(), async (req, res) => {
  const { organizationId } = req.auth_context!;

  const templates = await db
    .select()
    .from(emailTemplatesTable)
    .where(eq(emailTemplatesTable.organizationId, organizationId))
    .orderBy(desc(emailTemplatesTable.createdAt));

  res.json(templates);
});

router.get("/seed-defaults", requireOrgMembership(["admin"]), async (req, res) => {
  const { organizationId } = req.auth_context!;

  const existing = await db
    .select({ slug: emailTemplatesTable.slug })
    .from(emailTemplatesTable)
    .where(and(eq(emailTemplatesTable.organizationId, organizationId), eq(emailTemplatesTable.isDefault, true)));

  const existingSlugs = new Set(existing.map(e => e.slug));
  const toInsert = DEFAULT_TEMPLATES.filter(t => !existingSlugs.has(t.slug));

  if (toInsert.length === 0) {
    res.json({ message: "Default templates already exist", count: 0 });
    return;
  }

  await db.insert(emailTemplatesTable).values(
    toInsert.map(t => ({ ...t, organizationId }))
  );

  res.json({ message: "Default templates seeded", count: toInsert.length });
});

router.get("/:id", requireOrgMembership(), async (req, res) => {
  const { organizationId } = req.auth_context!;
  const id = req.params.id as string;

  const [template] = await db
    .select()
    .from(emailTemplatesTable)
    .where(and(eq(emailTemplatesTable.id, id), eq(emailTemplatesTable.organizationId, organizationId)))
    .limit(1);

  if (!template) {
    res.status(404).json({ error: "Template not found" });
    return;
  }

  res.json(template);
});

router.post("/", requireOrgMembership(["admin", "hiring_manager"]), async (req, res) => {
  const { organizationId } = req.auth_context!;
  const { name, slug, subject, htmlBody, textBody, mergeFields } = req.body;

  if (!name || !subject || !htmlBody) {
    res.status(400).json({ error: "name, subject, and htmlBody are required" });
    return;
  }

  const templateSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "_");

  const [template] = await db
    .insert(emailTemplatesTable)
    .values({
      organizationId,
      name,
      slug: templateSlug,
      subject,
      htmlBody,
      textBody: textBody || null,
      mergeFields: mergeFields || [],
      isDefault: false,
    })
    .returning();

  res.status(201).json(template);
});

router.put("/:id", requireOrgMembership(["admin", "hiring_manager"]), async (req, res) => {
  const { organizationId } = req.auth_context!;
  const id = req.params.id as string;
  const { name, subject, htmlBody, textBody, mergeFields } = req.body;

  const [existing] = await db
    .select()
    .from(emailTemplatesTable)
    .where(and(eq(emailTemplatesTable.id, id), eq(emailTemplatesTable.organizationId, organizationId)))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Template not found" });
    return;
  }

  const [updated] = await db
    .update(emailTemplatesTable)
    .set({
      ...(name !== undefined && { name }),
      ...(subject !== undefined && { subject }),
      ...(htmlBody !== undefined && { htmlBody }),
      ...(textBody !== undefined && { textBody }),
      ...(mergeFields !== undefined && { mergeFields }),
    })
    .where(eq(emailTemplatesTable.id, id))
    .returning();

  res.json(updated);
});

router.delete("/:id", requireOrgMembership(["admin"]), async (req, res) => {
  const { organizationId } = req.auth_context!;
  const id = req.params.id as string;

  const [existing] = await db
    .select()
    .from(emailTemplatesTable)
    .where(and(eq(emailTemplatesTable.id, id), eq(emailTemplatesTable.organizationId, organizationId)))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Template not found" });
    return;
  }

  await db.delete(emailTemplatesTable).where(eq(emailTemplatesTable.id, id));
  res.json({ message: "Template deleted" });
});

export default router;
