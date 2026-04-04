import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  usersTable,
  organizationsTable,
  organizationMembersTable,
  jobsTable,
  candidatesTable,
  applicationsTable,
  applicationRatingsTable,
} from "@workspace/db/schema";

async function seed() {
  console.log("Seeding LastATS demo data...");

  const passwordHash = await bcrypt.hash("password123", 10);

  const userDefs = [
    { email: "admin@acme-corp.example.com", displayName: "Alex Admin" },
    { email: "manager@acme-corp.example.com", displayName: "Morgan Manager" },
    { email: "viewer@acme-corp.example.com", displayName: "Val Viewer" },
  ];

  const users = [];
  for (const def of userDefs) {
    const [user] = await db
      .insert(usersTable)
      .values({ email: def.email, passwordHash, displayName: def.displayName })
      .onConflictDoNothing()
      .returning();
    if (user) {
      users.push(user);
    } else {
      const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, def.email)).limit(1);
      users.push(existing);
    }
  }

  const [adminUser, managerUser, viewerUser] = users;
  console.log("Ensured 3 users exist (password: password123)");

  let org: typeof organizationsTable.$inferSelect;
  const [insertedOrg] = await db
    .insert(organizationsTable)
    .values({
      name: "Acme Corporation",
      slug: "acme-corp",
      description: "A leading technology company building the future of work.",
      website: "https://acme-corp.example.com",
    })
    .onConflictDoNothing()
    .returning();

  if (insertedOrg) {
    org = insertedOrg;
    console.log(`Created organization: ${org.name} (${org.id})`);
  } else {
    const [existing] = await db.select().from(organizationsTable).where(eq(organizationsTable.slug, "acme-corp")).limit(1);
    org = existing;
    console.log(`Organization already exists: ${org.name} (${org.id})`);
  }

  const memberDefs = [
    { userId: adminUser.id, role: "admin" as const, displayName: "Alex Admin", email: "admin@acme-corp.example.com" },
    { userId: managerUser.id, role: "hiring_manager" as const, displayName: "Morgan Manager", email: "manager@acme-corp.example.com" },
    { userId: viewerUser.id, role: "viewer" as const, displayName: "Val Viewer", email: "viewer@acme-corp.example.com" },
  ];
  for (const m of memberDefs) {
    await db
      .insert(organizationMembersTable)
      .values({ organizationId: org.id, ...m })
      .onConflictDoNothing();
  }
  console.log("Ensured 3 organization members");

  const existingJobs = await db.select({ id: jobsTable.id }).from(jobsTable).where(eq(jobsTable.organizationId, org.id)).limit(1);
  if (existingJobs.length > 0) {
    console.log("Demo data already seeded (jobs exist), skipping remaining entities.");
    process.exit(0);
  }

  const jobs = await db
    .insert(jobsTable)
    .values([
      {
        organizationId: org.id,
        title: "Senior Full-Stack Engineer",
        department: "Engineering",
        location: "San Francisco, CA",
        employmentType: "full_time",
        salaryMin: 150000,
        salaryMax: 200000,
        salaryCurrency: "USD",
        description: "We're looking for an experienced full-stack engineer to join our platform team.",
        requirements: "5+ years experience with TypeScript, React, Node.js. Experience with PostgreSQL and cloud platforms.",
        status: "published",
        publishedAt: new Date(),
        isRemote: true,
        createdBy: adminUser.id,
        customFields: [
          { id: "yoe", label: "Years of Experience", type: "text", required: true, order: 0 },
          { id: "portfolio", label: "Portfolio URL", type: "text", required: false, order: 1 },
        ],
      },
      {
        organizationId: org.id,
        title: "Product Designer",
        department: "Design",
        location: "New York, NY",
        employmentType: "full_time",
        salaryMin: 120000,
        salaryMax: 160000,
        salaryCurrency: "USD",
        description: "Join our design team to craft beautiful, intuitive user experiences.",
        requirements: "3+ years product design experience. Proficiency in Figma. Strong portfolio.",
        status: "published",
        publishedAt: new Date(),
        isRemote: false,
        createdBy: adminUser.id,
      },
      {
        organizationId: org.id,
        title: "DevOps Engineer",
        department: "Engineering",
        location: "Remote",
        employmentType: "full_time",
        salaryMin: 140000,
        salaryMax: 180000,
        salaryCurrency: "USD",
        description: "Help us build and maintain scalable infrastructure.",
        requirements: "Experience with Kubernetes, Terraform, and CI/CD pipelines.",
        status: "draft",
        isRemote: true,
        createdBy: managerUser.id,
      },
      {
        organizationId: org.id,
        title: "Marketing Intern",
        department: "Marketing",
        location: "San Francisco, CA",
        employmentType: "internship",
        salaryMin: 25,
        salaryMax: 35,
        salaryCurrency: "USD",
        description: "Summer internship opportunity in our marketing department.",
        requirements: "Currently enrolled in a marketing or business degree program.",
        status: "closed",
        publishedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        closedAt: new Date(),
        isRemote: false,
        createdBy: adminUser.id,
      },
    ])
    .returning();

  console.log(`Created ${jobs.length} jobs`);

  const candidates = await db
    .insert(candidatesTable)
    .values([
      {
        organizationId: org.id,
        firstName: "Jane",
        lastName: "Doe",
        email: "jane.doe@example.com",
        phone: "+1-555-0101",
        source: "careers_page",
      },
      {
        organizationId: org.id,
        firstName: "John",
        lastName: "Smith",
        email: "john.smith@example.com",
        phone: "+1-555-0102",
        linkedinUrl: "https://linkedin.com/in/johnsmith",
        source: "linkedin",
      },
      {
        organizationId: org.id,
        firstName: "Alice",
        lastName: "Johnson",
        email: "alice.j@example.com",
        phone: "+1-555-0103",
        source: "referral",
      },
      {
        organizationId: org.id,
        firstName: "Bob",
        lastName: "Wilson",
        email: "bob.wilson@example.com",
        source: "indeed",
      },
      {
        organizationId: org.id,
        firstName: "Carol",
        lastName: "Davis",
        email: "carol.d@example.com",
        phone: "+1-555-0105",
        source: "careers_page",
      },
    ])
    .returning();

  console.log(`Created ${candidates.length} candidates`);

  const applications = await db
    .insert(applicationsTable)
    .values([
      {
        jobId: jobs[0].id,
        candidateId: candidates[0].id,
        status: "shortlisted",
        customFieldResponses: { yoe: "7", portfolio: "https://janedoe.dev" },
        coverLetter: "I'm passionate about building scalable platforms...",
      },
      {
        jobId: jobs[0].id,
        candidateId: candidates[1].id,
        status: "reviewed",
        customFieldResponses: { yoe: "5" },
      },
      {
        jobId: jobs[0].id,
        candidateId: candidates[2].id,
        status: "new",
        customFieldResponses: { yoe: "3", portfolio: "https://alicej.dev" },
      },
      {
        jobId: jobs[1].id,
        candidateId: candidates[3].id,
        status: "new",
        coverLetter: "I'm excited about the opportunity to join your design team...",
      },
      {
        jobId: jobs[1].id,
        candidateId: candidates[4].id,
        status: "reviewed",
      },
      {
        jobId: jobs[3].id,
        candidateId: candidates[2].id,
        status: "hired",
      },
    ])
    .returning();

  console.log(`Created ${applications.length} applications`);

  await db.insert(applicationRatingsTable).values([
    {
      applicationId: applications[0].id,
      ratedBy: adminUser.id,
      rating: 5,
      comment: "Excellent candidate. Strong technical background.",
    },
    {
      applicationId: applications[0].id,
      ratedBy: managerUser.id,
      rating: 4,
      comment: "Good fit for the team.",
    },
    {
      applicationId: applications[1].id,
      ratedBy: adminUser.id,
      rating: 3,
      comment: "Meets minimum requirements.",
    },
    {
      applicationId: applications[4].id,
      ratedBy: managerUser.id,
      rating: 4,
      comment: "Strong design portfolio.",
    },
  ]);

  console.log("Created application ratings");
  console.log("Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
