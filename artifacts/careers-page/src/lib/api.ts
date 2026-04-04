const API_BASE = "/api/careers";

export interface Organization {
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string | null;
  website: string | null;
}

export interface PublicJob {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
  employmentType: string | null;
  isRemote: boolean | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  publishedAt: string | null;
}

export interface PublicJobDetail extends PublicJob {
  description: string | null;
  requirements: string | null;
  customFields: CustomField[] | null;
}

export interface CustomField {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "checkbox" | "number" | "date" | "file";
  required?: boolean;
  options?: string[];
  order?: number;
}

export interface CareersPageResponse {
  organization: Organization;
  jobs: PublicJob[];
  filters: {
    departments: string[];
    locations: string[];
  };
}

export interface JobDetailResponse {
  organization: Organization;
  job: PublicJobDetail;
}

export async function fetchCareersPage(
  orgSlug: string,
  params?: { search?: string; department?: string; location?: string; employmentType?: string }
): Promise<CareersPageResponse> {
  const url = new URL(`${API_BASE}/${orgSlug}`, window.location.origin);
  if (params?.search) url.searchParams.set("search", params.search);
  if (params?.department) url.searchParams.set("department", params.department);
  if (params?.location) url.searchParams.set("location", params.location);
  if (params?.employmentType) url.searchParams.set("employmentType", params.employmentType);

  const res = await fetch(url.toString());
  if (!res.ok) {
    if (res.status === 404) throw new Error("Organization not found");
    throw new Error("Failed to load careers page");
  }
  return res.json();
}

export async function fetchJobDetail(orgSlug: string, jobId: string): Promise<JobDetailResponse> {
  const res = await fetch(`${API_BASE}/${orgSlug}/jobs/${jobId}`);
  if (!res.ok) {
    if (res.status === 404) throw new Error("Job not found");
    throw new Error("Failed to load job details");
  }
  return res.json();
}

export async function submitApplication(
  orgSlug: string,
  jobId: string,
  formData: FormData
): Promise<{ message: string; applicationId: string }> {
  const res = await fetch(`${API_BASE}/${orgSlug}/jobs/${jobId}/apply`, {
    method: "POST",
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to submit application");
  }
  return data;
}
