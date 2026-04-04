import { useState } from "react";
import { useApplications } from "@/hooks/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText } from "lucide-react";
import { statusColor, formatDate } from "@/lib/utils";

export default function ApplicationsPage() {
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useApplications({
    status: status === "all" ? undefined : status,
    page,
    limit: 20,
  });

  const applications = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
          <p className="text-sm text-gray-500 mt-1">Review and manage all applications</p>
        </div>
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
          {applications.map((app: { id: string; candidateId: string; jobId: string; status: string; createdAt: string; candidate?: { firstName: string; lastName: string; email: string }; job?: { title: string } }) => (
            <Card key={app.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">
                        {app.candidate ? `${app.candidate.firstName} ${app.candidate.lastName}` : "Unknown Candidate"}
                      </p>
                      <Badge variant="secondary" className={statusColor(app.status)}>{app.status}</Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Applied for: {app.job?.title || "Unknown Job"}
                    </p>
                    {app.candidate?.email && (
                      <p className="text-xs text-gray-400 mt-0.5">{app.candidate.email}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">{formatDate(app.createdAt)}</span>
                </div>
              </CardContent>
            </Card>
          ))}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-gray-500">Page {pagination.page} of {pagination.totalPages}</p>
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
