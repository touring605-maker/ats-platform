import { Router } from "express";
import { db } from "@workspace/db";
import { organizationsTable, jobsTable, candidatesTable, applicationsTable } from "@workspace/db/schema";
import { eq, and, ilike, or, sql, desc } from "drizzle-orm";
import multer from "multer";
import { ObjectStorageService } from "../lib/objectStorage";

const router = Router();

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, DOC, and DOCX files are allowed"));
    }
  },
});

router.get("/:orgSlug", async (req, res) => {
  try {
    const slug = req.params.orgSlug as string;
    const [org] = await db
      .select()
      .from(organizationsTable)
      .where(and(eq(organizationsTable.slug, slug), eq(organizationsTable.isActive, true)));

    if (!org) {
      res.status(404).json({ error: "Organization not found" });
      return;
    }

    const search = (req.query.search as string) || "";
    const department = (req.query.department as string) || "";
    const location = (req.query.location as string) || "";
    const employmentType = (req.query.employmentType as string) || "";

    const conditions = [
      eq(jobsTable.organizationId, org.id),
      eq(jobsTable.status, "published"),
    ];

    if (search) {
      conditions.push(
        or(
          ilike(jobsTable.title, `%${search}%`),
          ilike(jobsTable.department, `%${search}%`),
          ilike(jobsTable.location, `%${search}%`)
        )!
      );
    }
    if (department) conditions.push(ilike(jobsTable.department, `%${department}%`));
    if (location) conditions.push(ilike(jobsTable.location, `%${location}%`));
    if (employmentType) conditions.push(eq(jobsTable.employmentType, employmentType as "full_time" | "part_time" | "contract" | "internship" | "temporary"));

    const jobs = await db
      .select({
        id: jobsTable.id,
        title: jobsTable.title,
        department: jobsTable.department,
        location: jobsTable.location,
        employmentType: jobsTable.employmentType,
        isRemote: jobsTable.isRemote,
        salaryMin: jobsTable.salaryMin,
        salaryMax: jobsTable.salaryMax,
        salaryCurrency: jobsTable.salaryCurrency,
        publishedAt: jobsTable.publishedAt,
      })
      .from(jobsTable)
      .where(and(...conditions))
      .orderBy(desc(jobsTable.publishedAt));

    const departments = await db
      .selectDistinct({ department: jobsTable.department })
      .from(jobsTable)
      .where(and(eq(jobsTable.organizationId, org.id), eq(jobsTable.status, "published")));

    const locations = await db
      .selectDistinct({ location: jobsTable.location })
      .from(jobsTable)
      .where(and(eq(jobsTable.organizationId, org.id), eq(jobsTable.status, "published")));

    res.json({
      organization: {
        name: org.name,
        slug: org.slug,
        logoUrl: org.logoUrl,
        description: org.description,
        website: org.website,
      },
      jobs,
      filters: {
        departments: departments.map(d => d.department).filter(Boolean),
        locations: locations.map(l => l.location).filter(Boolean),
      },
    });
  } catch (err) {
    req.log?.error(err, "Error fetching careers page");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:orgSlug/jobs/:jobId", async (req, res) => {
  try {
    const slug = req.params.orgSlug as string;
    const jobId = req.params.jobId as string;

    const [org] = await db
      .select()
      .from(organizationsTable)
      .where(and(eq(organizationsTable.slug, slug), eq(organizationsTable.isActive, true)));

    if (!org) {
      res.status(404).json({ error: "Organization not found" });
      return;
    }

    const [job] = await db
      .select()
      .from(jobsTable)
      .where(
        and(
          eq(jobsTable.id, jobId),
          eq(jobsTable.organizationId, org.id),
          eq(jobsTable.status, "published")
        )
      );

    if (!job) {
      res.status(404).json({ error: "Job not found" });
      return;
    }

    res.json({
      organization: {
        name: org.name,
        slug: org.slug,
        logoUrl: org.logoUrl,
        description: org.description,
        website: org.website,
      },
      job: {
        id: job.id,
        title: job.title,
        department: job.department,
        location: job.location,
        employmentType: job.employmentType,
        isRemote: job.isRemote,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        salaryCurrency: job.salaryCurrency,
        description: job.description,
        requirements: job.requirements,
        customFields: job.customFields,
        publishedAt: job.publishedAt,
      },
    });
  } catch (err) {
    req.log?.error(err, "Error fetching job detail");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:orgSlug/jobs/:jobId/apply", upload.single("resume"), async (req, res) => {
  try {
    const slug = req.params.orgSlug as string;
    const jobId = req.params.jobId as string;

    const [org] = await db
      .select()
      .from(organizationsTable)
      .where(and(eq(organizationsTable.slug, slug), eq(organizationsTable.isActive, true)));

    if (!org) {
      res.status(404).json({ error: "Organization not found" });
      return;
    }

    const [job] = await db
      .select()
      .from(jobsTable)
      .where(
        and(
          eq(jobsTable.id, jobId),
          eq(jobsTable.organizationId, org.id),
          eq(jobsTable.status, "published")
        )
      );

    if (!job) {
      res.status(404).json({ error: "Job not found or no longer accepting applications" });
      return;
    }

    const { firstName, lastName, email, phone, linkedinUrl, coverLetter, customFieldResponses } = req.body;

    if (!firstName || !lastName || !email) {
      res.status(400).json({ error: "First name, last name, and email are required" });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: "Invalid email address" });
      return;
    }

    if (job.customFields && Array.isArray(job.customFields)) {
      const responses = customFieldResponses ? JSON.parse(typeof customFieldResponses === "string" ? customFieldResponses : JSON.stringify(customFieldResponses)) : {};
      for (const field of job.customFields as Array<{ id: string; label: string; required?: boolean }>) {
        if (field.required && (!responses[field.id] || String(responses[field.id]).trim() === "")) {
          res.status(400).json({ error: `${field.label} is required` });
          return;
        }
      }
    }

    let resumeUrl: string | undefined;
    if (req.file) {
      try {
        const storageService = new ObjectStorageService();
        const ext = req.file.originalname.split(".").pop() || "pdf";
        const key = `resumes/${org.id}/${jobId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const privateDir = storageService.getPrivateObjectDir();
        const fullKey = `${privateDir}/${key}`;

        const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID!;
        const { Storage } = await import("@google-cloud/storage");
        const storage = new Storage();
        const bucket = storage.bucket(bucketId);
        const file = bucket.file(fullKey);
        await file.save(req.file.buffer, {
          contentType: req.file.mimetype,
          metadata: {
            originalName: req.file.originalname,
          },
        });
        resumeUrl = `/objects/${key}`;
      } catch (uploadErr) {
        req.log?.error(uploadErr, "Error uploading resume");
        res.status(500).json({ error: "Failed to upload resume" });
        return;
      }
    }

    let parsedResponses: Record<string, string> = {};
    if (customFieldResponses) {
      parsedResponses = typeof customFieldResponses === "string"
        ? JSON.parse(customFieldResponses)
        : customFieldResponses;
    }

    const existingCandidate = await db
      .select()
      .from(candidatesTable)
      .where(
        and(
          eq(candidatesTable.email, email),
          eq(candidatesTable.organizationId, org.id)
        )
      );

    let candidateId: string;

    if (existingCandidate.length > 0) {
      candidateId = existingCandidate[0].id;
      await db
        .update(candidatesTable)
        .set({
          firstName,
          lastName,
          phone: phone || existingCandidate[0].phone,
          linkedinUrl: linkedinUrl || existingCandidate[0].linkedinUrl,
          resumeUrl: resumeUrl || existingCandidate[0].resumeUrl,
        })
        .where(eq(candidatesTable.id, candidateId));
    } else {
      const [newCandidate] = await db
        .insert(candidatesTable)
        .values({
          organizationId: org.id,
          firstName,
          lastName,
          email,
          phone: phone || null,
          linkedinUrl: linkedinUrl || null,
          resumeUrl: resumeUrl || null,
          source: "careers_page",
        })
        .returning();
      candidateId = newCandidate.id;
    }

    const existingApplication = await db
      .select()
      .from(applicationsTable)
      .where(
        and(
          eq(applicationsTable.jobId, jobId),
          eq(applicationsTable.candidateId, candidateId)
        )
      );

    if (existingApplication.length > 0) {
      res.status(409).json({ error: "You have already applied to this position" });
      return;
    }

    const [application] = await db
      .insert(applicationsTable)
      .values({
        jobId,
        candidateId,
        coverLetter: coverLetter || null,
        customFieldResponses: parsedResponses,
        status: "new",
      })
      .returning();

    res.status(201).json({
      message: "Application submitted successfully",
      applicationId: application.id,
    });
  } catch (err: any) {
    if (err.message?.includes("Only PDF, DOC, and DOCX")) {
      res.status(400).json({ error: err.message });
      return;
    }
    req.log?.error(err, "Error submitting application");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
