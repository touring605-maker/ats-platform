import { useDashboardSummary, useJobStats } from "@/hooks/use-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, FileText, Users, TrendingUp } from "lucide-react";
import { statusColor, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

export default function DashboardPage() {
  const { data: summary, isLoading: summaryLoading, isError: summaryError } = useDashboardSummary();
  const { data: stats, isLoading: statsLoading, isError: statsError } = useJobStats();

  const isLoading = summaryLoading || statsLoading;
  const isError = summaryError || statsError;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of your hiring activity</p>
      </div>

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">Failed to load dashboard data. Please check your connection and try again.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Jobs"
          value={stats?.published}
          icon={<Briefcase className="w-5 h-5 text-indigo-600" />}
          loading={isLoading}
        />
        <StatCard
          label="Total Applications"
          value={summary?.totalApplications}
          icon={<FileText className="w-5 h-5 text-emerald-600" />}
          loading={isLoading}
        />
        <StatCard
          label="New Applications"
          value={summary?.applicationsByStatus?.new}
          icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
          loading={isLoading}
        />
        <StatCard
          label="Total Jobs"
          value={stats?.total}
          icon={<Users className="w-5 h-5 text-amber-600" />}
          loading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Application Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-8" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(summary?.applicationsByStatus || {}).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={statusColor(status)}>
                        {status}
                      </Badge>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{count as number}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Jobs</CardTitle>
            <Link href="/jobs">
              <span className="text-sm text-indigo-600 hover:text-indigo-700 cursor-pointer">View all</span>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : summary?.recentJobs?.length ? (
              <div className="space-y-3">
                {summary.recentJobs.map((job: { id: string; title: string; status: string; createdAt: string; applicationCount: number }) => (
                  <Link key={job.id} href={`/jobs/${job.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{job.title}</p>
                        <p className="text-xs text-gray-500">{formatDate(job.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{job.applicationCount} apps</span>
                        <Badge variant="secondary" className={statusColor(job.status)}>
                          {job.status}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">No jobs yet. Create your first job posting!</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, loading }: { label: string; value?: number; icon: React.ReactNode; loading: boolean }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{label}</p>
            {loading ? (
              <Skeleton className="h-8 w-16 mt-1" />
            ) : (
              <p className="text-2xl font-bold text-gray-900 mt-1">{value ?? 0}</p>
            )}
          </div>
          <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
