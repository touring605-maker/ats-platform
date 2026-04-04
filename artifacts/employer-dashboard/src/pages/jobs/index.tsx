import { useState } from "react";
import { useJobs, useDeleteJob } from "@/hooks/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useLocation } from "wouter";
import { Plus, Search, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { statusColor, formatDate, formatSalary, formatEmploymentType } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function JobsPage() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const { toast } = useToast();
  const deleteJob = useDeleteJob();

  const { data, isLoading } = useJobs({
    search: search || undefined,
    status: status === "all" ? undefined : status,
    page,
    limit: 20,
  });

  const jobs = data?.data || [];
  const pagination = data?.pagination;

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await deleteJob.mutateAsync(id);
      toast({ title: "Job deleted", description: `"${title}" has been deleted.` });
    } catch {
      toast({ title: "Error", description: "Failed to delete job.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your job postings</p>
        </div>
        <Link href="/jobs/new">
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            New Job
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search jobs..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-gray-500 mb-4">No jobs found</p>
            <Link href="/jobs/new">
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Job
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {jobs.map((job: { id: string; title: string; department?: string; location?: string; employmentType: string; salaryMin?: number; salaryMax?: number; salaryCurrency?: string; status: string; createdAt: string; applicationCount: number }) => (
            <Card key={job.id} className="hover:shadow-sm transition-shadow cursor-pointer" onClick={() => navigate(`/jobs/${job.id}`)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-gray-900">{job.title}</h3>
                      <Badge variant="secondary" className={statusColor(job.status)}>{job.status}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {job.department && <span className="text-xs text-gray-500">{job.department}</span>}
                      {job.location && <span className="text-xs text-gray-500">{job.location}</span>}
                      <span className="text-xs text-gray-500">{formatEmploymentType(job.employmentType)}</span>
                      {(job.salaryMin || job.salaryMax) && (
                        <span className="text-xs text-gray-500">{formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-gray-400">Posted {formatDate(job.createdAt)}</span>
                      <span className="text-xs text-indigo-600 font-medium">{job.applicationCount} application{job.applicationCount !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/jobs/${job.id}/edit`); }}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600" onClick={(e) => { e.stopPropagation(); handleDelete(job.id, job.title); }}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-gray-500">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
