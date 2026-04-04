import { useJob, useUpdateJob, useDeleteJob, useApplications } from "@/hooks/use-api";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Pencil, Trash2, Globe, Archive, Loader2 } from "lucide-react";
import { statusColor, formatDate, formatSalary, formatEmploymentType } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface JobDetailProps {
  jobId: string;
}

export default function JobDetail({ jobId }: JobDetailProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { data: job, isLoading } = useJob(jobId);
  const updateJob = useUpdateJob();
  const deleteJob = useDeleteJob();
  const { data: appsData } = useApplications({ jobId });

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateJob.mutateAsync({ id: jobId, status: newStatus });
      toast({ title: `Job ${newStatus}` });
    } catch {
      toast({ title: "Error", description: "Failed to update status.", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${job?.title}"? This cannot be undone.`)) return;
    try {
      await deleteJob.mutateAsync(jobId);
      toast({ title: "Job deleted" });
      navigate("/jobs");
    } catch {
      toast({ title: "Error", description: "Failed to delete job.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Job not found</p>
        <Link href="/jobs">
          <Button variant="outline" className="mt-4">Back to Jobs</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/jobs")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
              <Badge variant="secondary" className={statusColor(job.status)}>{job.status}</Badge>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {[job.department, job.location, formatEmploymentType(job.employmentType)].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {job.status === "draft" && (
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleStatusChange("published")} disabled={updateJob.isPending}>
              {updateJob.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4 mr-1" />}
              Publish
            </Button>
          )}
          {job.status === "published" && (
            <Button size="sm" variant="outline" onClick={() => handleStatusChange("closed")} disabled={updateJob.isPending}>
              Close
            </Button>
          )}
          {job.status === "closed" && (
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleStatusChange("published")} disabled={updateJob.isPending}>
              {updateJob.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4 mr-1" />}
              Reopen
            </Button>
          )}
          {(job.status === "closed" || job.status === "draft") && (
            <Button size="sm" variant="outline" onClick={() => handleStatusChange("archived")} disabled={updateJob.isPending}>
              <Archive className="w-4 h-4 mr-1" />
              Archive
            </Button>
          )}
          <Link href={`/jobs/${jobId}/edit`}>
            <Button size="sm" variant="outline">
              <Pencil className="w-4 h-4 mr-1" />
              Edit
            </Button>
          </Link>
          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={handleDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {job.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: job.description }} />
              </CardContent>
            </Card>
          )}
          {job.requirements && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: job.requirements }} />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {job.customFields && Array.isArray(job.customFields) && job.customFields.length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Application Form Fields</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(job.customFields as Array<{ id: string; label: string; type: string; required: boolean; options?: string[] }>).map((field: { id: string; label: string; type: string; required: boolean; options?: string[] }) => (
                    <div key={field.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div>
                        <span className="text-sm font-medium text-gray-900">{field.label}</span>
                        <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{field.type}</span>
                        {field.required && <span className="ml-1 text-xs px-1.5 py-0.5 rounded bg-red-50 text-red-600">Required</span>}
                      </div>
                      {field.options && field.options.length > 0 && (
                        <span className="text-xs text-gray-400">{field.options.length} options</span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DetailRow label="Type" value={formatEmploymentType(job.employmentType)} />
              <DetailRow label="Remote" value={job.isRemote ? "Yes" : "No"} />
              {(job.salaryMin || job.salaryMax) && (
                <DetailRow label="Salary" value={formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)} />
              )}
              <DetailRow label="Created" value={formatDate(job.createdAt)} />
              {job.publishedAt && <DetailRow label="Published" value={formatDate(job.publishedAt)} />}
              {job.closedAt && <DetailRow label="Closed" value={formatDate(job.closedAt)} />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">{appsData?.pagination?.total ?? 0}</p>
              <p className="text-xs text-gray-500">total applications</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 font-medium">{value}</span>
    </div>
  );
}
