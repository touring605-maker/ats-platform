import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useJob, useCreateJob, useUpdateJob } from "@/hooks/use-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2 } from "lucide-react";

interface JobFormProps {
  jobId?: string;
}

export default function JobForm({ jobId }: JobFormProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const isEditing = !!jobId;
  const { data: existingJob, isLoading: jobLoading } = useJob(jobId);
  const createJob = useCreateJob();
  const updateJob = useUpdateJob();

  const [form, setForm] = useState({
    title: "",
    department: "",
    location: "",
    employmentType: "full_time",
    salaryMin: "",
    salaryMax: "",
    salaryCurrency: "USD",
    description: "",
    requirements: "",
    isRemote: false,
  });

  useEffect(() => {
    if (existingJob) {
      setForm({
        title: existingJob.title || "",
        department: existingJob.department || "",
        location: existingJob.location || "",
        employmentType: existingJob.employmentType || "full_time",
        salaryMin: existingJob.salaryMin?.toString() || "",
        salaryMax: existingJob.salaryMax?.toString() || "",
        salaryCurrency: existingJob.salaryCurrency || "USD",
        description: existingJob.description || "",
        requirements: existingJob.requirements || "",
        isRemote: existingJob.isRemote || false,
      });
    }
  }, [existingJob]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const body = {
      title: form.title,
      department: form.department || undefined,
      location: form.location || undefined,
      employmentType: form.employmentType,
      salaryMin: form.salaryMin ? Number(form.salaryMin) : undefined,
      salaryMax: form.salaryMax ? Number(form.salaryMax) : undefined,
      salaryCurrency: form.salaryCurrency || undefined,
      description: form.description || undefined,
      requirements: form.requirements || undefined,
      isRemote: form.isRemote,
    };

    try {
      if (isEditing) {
        await updateJob.mutateAsync({ id: jobId!, ...body });
        toast({ title: "Job updated" });
      } else {
        await createJob.mutateAsync(body);
        toast({ title: "Job created" });
      }
      navigate("/jobs");
    } catch {
      toast({ title: "Error", description: `Failed to ${isEditing ? "update" : "create"} job.`, variant: "destructive" });
    }
  };

  const isSaving = createJob.isPending || updateJob.isPending;

  if (isEditing && jobLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/jobs")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isEditing ? "Edit Job" : "Create Job"}</h1>
          <p className="text-sm text-gray-500 mt-1">{isEditing ? "Update job posting details" : "Create a new job posting"}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Senior Software Engineer"
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  placeholder="e.g. Engineering"
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g. San Francisco, CA"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Employment Type</Label>
                <Select value={form.employmentType} onValueChange={(v) => setForm({ ...form, employmentType: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full-time</SelectItem>
                    <SelectItem value="part_time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                    <SelectItem value="temporary">Temporary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch
                  checked={form.isRemote}
                  onCheckedChange={(v) => setForm({ ...form, isRemote: v })}
                />
                <Label>Remote Position</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Compensation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="salaryMin">Min Salary</Label>
                <Input
                  id="salaryMin"
                  type="number"
                  value={form.salaryMin}
                  onChange={(e) => setForm({ ...form, salaryMin: e.target.value })}
                  placeholder="50000"
                />
              </div>
              <div>
                <Label htmlFor="salaryMax">Max Salary</Label>
                <Input
                  id="salaryMax"
                  type="number"
                  value={form.salaryMax}
                  onChange={(e) => setForm({ ...form, salaryMax: e.target.value })}
                  placeholder="80000"
                />
              </div>
              <div>
                <Label>Currency</Label>
                <Select value={form.salaryCurrency} onValueChange={(v) => setForm({ ...form, salaryCurrency: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="CAD">CAD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Description</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="description">Job Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe the role, responsibilities, and what a typical day looks like..."
                rows={6}
              />
            </div>
            <div>
              <Label htmlFor="requirements">Requirements</Label>
              <Textarea
                id="requirements"
                value={form.requirements}
                onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                placeholder="List the required skills, experience, and qualifications..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate("/jobs")}>Cancel</Button>
          <Button type="submit" disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700">
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEditing ? "Save Changes" : "Create Job"}
          </Button>
        </div>
      </form>
    </div>
  );
}
