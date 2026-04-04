import { useState } from "react";
import { useApplications, useJobs } from "@/hooks/use-api";
import { Link, useSearch } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Star, Search, ArrowUpDown, ArrowUp, ArrowDown, ExternalLink } from "lucide-react";
import { statusColor, formatDate } from "@/lib/utils";

function StarRating({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-xs text-gray-400">No rating</span>;
  const rounded = Math.round(rating * 10) / 10;
  return (
    <span className="flex items-center gap-1 text-sm">
      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
      <span className="font-medium text-gray-700">{rounded}</span>
    </span>
  );
}

interface ApplicationsPageProps {
  jobId?: string;
  jobTitle?: string;
}

export default function ApplicationsPage({ jobId, jobTitle }: ApplicationsPageProps) {
  const searchString = useSearch();
  const urlParams = new URLSearchParams(searchString);
  const urlJobId = urlParams.get("jobId") || undefined;
  const effectiveJobId = jobId || urlJobId;

  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("appliedAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedJobFilter, setSelectedJobFilter] = useState(effectiveJobId || "all");
  const [page, setPage] = useState(1);

  const { data: jobsData } = useJobs({ limit: 100 });
  const jobs = jobsData?.data || [];

  const activeJobId = effectiveJobId || (selectedJobFilter !== "all" ? selectedJobFilter : undefined);

  const { data, isLoading } = useApplications({
    jobId: activeJobId,
    status: status === "all" ? undefined : status,
    search: search || undefined,
    sortBy,
    sortOrder,
    page,
    limit: 20,
  });

  const applications = data?.data || [];
  const pagination = data?.pagination;

  function toggleSort(field: string) {
    if (sortBy === field) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  }

  function SortIcon({ field }: { field: string }) {
    if (sortBy !== field) return <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />;
    return sortOrder === "desc"
      ? <ArrowDown className="w-3.5 h-3.5 text-primary" />
      : <ArrowUp className="w-3.5 h-3.5 text-primary" />;
  }

  const pageTitle = jobTitle ? `Applications for ${jobTitle}` : "All Applications";
  const pageSubtitle = jobTitle
    ? "Review and manage applications for this position"
    : "Review and manage all applications across jobs";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
          <p className="text-sm text-gray-500 mt-1">{pageSubtitle}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        {!effectiveJobId && (
          <Select value={selectedJobFilter} onValueChange={(v) => { setSelectedJobFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Jobs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Jobs</SelectItem>
              {jobs.map((j: { id: string; title: string }) => (
                <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="shortlisted">Shortlisted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="hired">Hired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 text-xs">
        <button onClick={() => toggleSort("appliedAt")} className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100">
          Date <SortIcon field="appliedAt" />
        </button>
        <button onClick={() => toggleSort("candidateName")} className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100">
          Name <SortIcon field="candidateName" />
        </button>
        <button onClick={() => toggleSort("rating")} className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100">
          Rating <SortIcon field="rating" />
        </button>
        <button onClick={() => toggleSort("status")} className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100">
          Status <SortIcon field="status" />
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : applications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500">No applications found</p>
            <p className="text-sm text-gray-400 mt-1">Applications will appear here as candidates apply</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {applications.map((app: {
            id: string;
            candidateFirstName: string;
            candidateLastName: string;
            candidateEmail: string;
            candidateResumeUrl: string | null;
            status: string;
            appliedAt: string;
            jobTitle: string;
            jobDepartment: string | null;
            avgRating: string | null;
            ratingCount: number | null;
          }) => (
            <Link key={app.id} href={`/applications/${app.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                        <span className="text-sm font-medium text-indigo-700">
                          {app.candidateFirstName?.[0]}{app.candidateLastName?.[0]}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-gray-900">
                            {app.candidateFirstName} {app.candidateLastName}
                          </p>
                          <Badge variant="secondary" className={statusColor(app.status)}>{app.status}</Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {!effectiveJobId && <>{app.jobTitle} · </>}
                          {app.candidateEmail}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0 ml-4">
                      <StarRating rating={app.avgRating ? parseFloat(app.avgRating) : null} />
                      {app.ratingCount ? (
                        <span className="text-[10px] text-gray-400">{app.ratingCount} review{app.ratingCount !== 1 ? "s" : ""}</span>
                      ) : null}
                      <span className="text-xs text-gray-400">{formatDate(app.appliedAt)}</span>
                      {app.candidateResumeUrl && (
                        <span className="flex items-center gap-0.5 text-[10px] text-primary">
                          <FileText className="w-3 h-3" /> Resume
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
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
