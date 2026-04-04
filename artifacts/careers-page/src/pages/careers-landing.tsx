import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { fetchCareersPage, type PublicJob } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Building2, Clock, Briefcase, Globe } from "lucide-react";

interface CareersLandingProps {
  orgSlug: string;
}

function formatEmploymentType(type: string | null): string {
  if (!type) return "";
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatSalary(min: number | null, max: number | null, currency: string | null): string {
  if (!min && !max) return "";
  const cur = currency || "USD";
  const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(n);
  if (min && max) return `${fmt(min)} - ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return `Up to ${fmt(max!)}`;
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

export default function CareersLanding({ orgSlug }: CareersLandingProps) {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [location, setLocation] = useState("");
  const [employmentType, setEmploymentType] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["careers", orgSlug, search, department, location, employmentType],
    queryFn: () => fetchCareersPage(orgSlug, {
      search: search || undefined,
      department: department || undefined,
      location: location || undefined,
      employmentType: employmentType || undefined,
    }),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading careers page...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Page Not Found</h1>
          <p className="mt-2 text-gray-600">This careers page doesn't exist or is no longer active.</p>
        </div>
      </div>
    );
  }

  const org = data!.organization;
  const jobs = data!.jobs;
  const filters = data!.filters;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
          <div className="flex items-center gap-4 mb-4">
            {org.logoUrl && (
              <img src={org.logoUrl} alt={org.name} className="w-14 h-14 rounded-lg object-cover" />
            )}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{org.name}</h1>
              {org.website && (
                <a href={org.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" />
                  {org.website.replace(/^https?:\/\//, "")}
                </a>
              )}
            </div>
          </div>
          {org.description && (
            <p className="text-gray-600 max-w-2xl">{org.description}</p>
          )}
          <p className="mt-4 text-lg font-medium text-gray-800">
            {jobs.length} open position{jobs.length !== 1 ? "s" : ""}
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search positions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          {filters.departments.length > 0 && (
            <Select value={department} onValueChange={(v) => setDepartment(v === "all" ? "" : v)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {filters.departments.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {filters.locations.length > 0 && (
            <Select value={location} onValueChange={(v) => setLocation(v === "all" ? "" : v)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {filters.locations.map((l) => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={employmentType} onValueChange={(v) => setEmploymentType(v === "all" ? "" : v)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Job Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="full_time">Full Time</SelectItem>
              <SelectItem value="part_time">Part Time</SelectItem>
              <SelectItem value="contract">Contract</SelectItem>
              <SelectItem value="internship">Internship</SelectItem>
              <SelectItem value="temporary">Temporary</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {jobs.length === 0 ? (
          <div className="text-center py-16">
            <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No open positions</h3>
            <p className="text-gray-500 mt-1">Check back later for new opportunities.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} orgSlug={orgSlug} />
            ))}
          </div>
        )}
      </main>

      <footer className="border-t bg-white mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
          Powered by LastATS
        </div>
      </footer>
    </div>
  );
}

function JobCard({ job, orgSlug }: { job: PublicJob; orgSlug: string }) {
  const salary = formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency);

  return (
    <Link href={`/${orgSlug}/jobs/${job.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 hover:text-primary transition-colors">
                {job.title}
              </h3>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
                {job.department && (
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" />
                    {job.department}
                  </span>
                )}
                {job.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {job.location}
                  </span>
                )}
                {job.employmentType && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formatEmploymentType(job.employmentType)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
              {job.isRemote && <Badge variant="secondary">Remote</Badge>}
              {salary && (
                <span className="text-sm font-medium text-gray-700">{salary}</span>
              )}
              {job.publishedAt && (
                <span className="text-xs text-gray-400">{timeAgo(job.publishedAt)}</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
