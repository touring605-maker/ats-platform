import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { fetchJobDetail, submitApplication, type CustomField } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import DOMPurify from "dompurify";
import {
  ArrowLeft, MapPin, Building2, Clock, Briefcase,
  Globe, Upload, CheckCircle, Loader2, AlertCircle,
} from "lucide-react";

interface JobDetailProps {
  orgSlug: string;
  jobId: string;
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

function SafeHtml({ html, className }: { html: string; className?: string }) {
  return <div className={className} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />;
}

export default function JobDetail({ orgSlug, jobId }: JobDetailProps) {
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const [customResponses, setCustomResponses] = useState<Record<string, string>>({});

  const { data, isLoading, error } = useQuery({
    queryKey: ["job", orgSlug, jobId],
    queryFn: () => fetchJobDetail(orgSlug, jobId),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading job details...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Job Not Found</h1>
          <p className="mt-2 text-gray-600">This position may no longer be available.</p>
          <Link href={`/${orgSlug}`}>
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to all positions
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { organization: org, job } = data;
  const salary = formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency);
  const customFields = (job.customFields || []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("firstName", firstName);
      formData.append("lastName", lastName);
      formData.append("email", email);
      if (phone) formData.append("phone", phone);
      if (linkedinUrl) formData.append("linkedinUrl", linkedinUrl);
      if (coverLetter) formData.append("coverLetter", coverLetter);
      if (resume) formData.append("resume", resume);
      if (Object.keys(customResponses).length > 0) {
        formData.append("customFieldResponses", JSON.stringify(customResponses));
      }

      await submitApplication(orgSlug, jobId, formData);
      setSubmitted(true);
    } catch (err: any) {
      setSubmitError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
            <p className="text-gray-600 mb-6">
              Thank you for applying to <strong>{job.title}</strong> at {org.name}.
              We'll review your application and get back to you.
            </p>
            <Link href={`/${orgSlug}`}>
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to all positions
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href={`/${orgSlug}`} className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to {org.name} careers
          </Link>
          <div className="flex items-center gap-3 mb-2">
            {org.logoUrl && (
              <img src={org.logoUrl} alt={org.name} className="w-10 h-10 rounded-lg object-cover" />
            )}
            <span className="text-sm text-gray-500">{org.name}</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">{job.title}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
                {job.department && (
                  <span className="flex items-center gap-1">
                    <Building2 className="w-4 h-4" /> {job.department}
                  </span>
                )}
                {job.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" /> {job.location}
                  </span>
                )}
                {job.employmentType && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" /> {formatEmploymentType(job.employmentType)}
                  </span>
                )}
                {job.isRemote && <Badge variant="secondary">Remote</Badge>}
              </div>
              {salary && (
                <p className="mt-2 text-base font-medium text-gray-700">{salary}</p>
              )}
            </div>

            {job.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">About this role</CardTitle>
                </CardHeader>
                <CardContent>
                  <SafeHtml html={job.description} className="prose prose-sm max-w-none text-gray-700" />
                </CardContent>
              </Card>
            )}

            {job.requirements && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <SafeHtml html={job.requirements} className="prose prose-sm max-w-none text-gray-700" />
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent className="p-5">
                {!showForm ? (
                  <Button onClick={() => setShowForm(true)} className="w-full" size="lg">
                    Apply Now
                  </Button>
                ) : (
                  <p className="text-sm text-gray-500 text-center">
                    Fill out the form below to apply.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {showForm && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Apply for {job.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="linkedin">LinkedIn URL</Label>
                    <Input id="linkedin" type="url" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/..." />
                  </div>
                </div>

                <div>
                  <Label htmlFor="resume">Resume (PDF, DOC, DOCX)</Label>
                  <div className="mt-1">
                    <label className="flex items-center justify-center gap-2 px-4 py-8 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                      <Upload className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {resume ? resume.name : "Click to upload your resume"}
                      </span>
                      <input
                        id="resume"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        onChange={(e) => setResume(e.target.files?.[0] || null)}
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="coverLetter">Cover Letter</Label>
                  <Textarea
                    id="coverLetter"
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    rows={4}
                    placeholder="Tell us why you're interested in this role..."
                  />
                </div>

                {customFields.length > 0 && (
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="text-sm font-medium text-gray-700">Additional Information</h3>
                    {customFields.map((field) => (
                      <CustomFieldInput
                        key={field.id}
                        field={field}
                        value={customResponses[field.id] || ""}
                        onChange={(val) => setCustomResponses((prev) => ({ ...prev, [field.id]: val }))}
                      />
                    ))}
                  </div>
                )}

                {submitError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {submitError}
                  </div>
                )}

                <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...
                    </>
                  ) : (
                    "Submit Application"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
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

function CustomFieldInput({
  field,
  value,
  onChange,
}: {
  field: CustomField;
  value: string;
  onChange: (val: string) => void;
}) {
  const label = `${field.label}${field.required ? " *" : ""}`;

  switch (field.type) {
    case "textarea":
      return (
        <div>
          <Label>{label}</Label>
          <Textarea value={value} onChange={(e) => onChange(e.target.value)} required={field.required} />
        </div>
      );
    case "select":
      return (
        <div>
          <Label>{label}</Label>
          <Select value={value} onValueChange={onChange} required={field.required}>
            <SelectTrigger>
              <SelectValue placeholder={`Select ${field.label}`} />
            </SelectTrigger>
            <SelectContent>
              {(field.options || []).map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    case "checkbox":
      return (
        <div className="flex items-center gap-2">
          <Checkbox
            id={field.id}
            checked={value === "true"}
            onCheckedChange={(checked) => onChange(String(checked))}
          />
          <Label htmlFor={field.id}>{label}</Label>
        </div>
      );
    case "number":
      return (
        <div>
          <Label>{label}</Label>
          <Input type="number" value={value} onChange={(e) => onChange(e.target.value)} required={field.required} />
        </div>
      );
    case "date":
      return (
        <div>
          <Label>{label}</Label>
          <Input type="date" value={value} onChange={(e) => onChange(e.target.value)} required={field.required} />
        </div>
      );
    default:
      return (
        <div>
          <Label>{label}</Label>
          <Input type="text" value={value} onChange={(e) => onChange(e.target.value)} required={field.required} />
        </div>
      );
  }
}
