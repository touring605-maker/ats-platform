import { useState } from "react";
import { Link } from "wouter";
import { useApplication, useUpdateApplicationStatus, useAddRating, useUpdateApplicationNotes, useResumeUrl, useEmailHistory, useEmailTemplates, useSendEmail } from "@/hooks/use-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Star,
  Mail,
  Phone,
  Linkedin,
  FileText,
  Calendar,
  Briefcase,
  Building2,
  Download,
  ExternalLink,
  User,
  MessageSquare,
  Send,
  Clock,
} from "lucide-react";
import { statusColor, formatDate } from "@/lib/utils";

interface ApplicationDetailProps {
  applicationId: string;
}

function StarRatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
          className="focus:outline-none"
        >
          <Star
            className={`w-6 h-6 transition-colors ${
              star <= (hover || value)
                ? "fill-amber-400 text-amber-400"
                : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function ApplicationDetail({ applicationId }: ApplicationDetailProps) {
  const { data: app, isLoading } = useApplication(applicationId);
  const { data: resumeBlobUrl } = useResumeUrl(applicationId, app?.candidateResumeUrl);
  const { data: emailHistory } = useEmailHistory(applicationId);
  const { data: emailTemplates } = useEmailTemplates();
  const updateStatus = useUpdateApplicationStatus();
  const addRating = useAddRating();
  const updateNotes = useUpdateApplicationNotes();
  const sendEmail = useSendEmail();
  const { toast } = useToast();

  const [ratingValue, setRatingValue] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [notes, setNotes] = useState<string | null>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | "">("");
  const [notifyOnStatusChange, setNotifyOnStatusChange] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Application not found</p>
        <Link href="/applications">
          <Button variant="link" className="mt-2">Back to applications</Button>
        </Link>
      </div>
    );
  }

  const currentNotes = notes !== null ? notes : (app.notes || "");
  const customFields = app.jobCustomFields as Array<{ id: string; label: string; type: string }> | null;
  const customResponses = (app.customFieldResponses || {}) as Record<string, string>;

  function handleStatusChange(newStatus: string) {
    updateStatus.mutate(
      { id: applicationId, status: newStatus, notifyCandidate: notifyOnStatusChange },
      {
        onSuccess: () => {
          toast({ title: "Status updated", description: `Application status changed to ${newStatus}${notifyOnStatusChange ? " — candidate notified" : ""}` });
        },
        onError: () => toast({ title: "Error", description: "Failed to update status", variant: "destructive" }),
      }
    );
  }

  function handleSelectTemplate(templateId: string) {
    setSelectedTemplateId(templateId);
    const template = emailTemplates?.find(t => t.id === templateId);
    if (template) {
      setEmailSubject(template.subject);
      setEmailBody(template.htmlBody);
    }
  }

  async function handleSendEmail() {
    if (!emailSubject || !emailBody) {
      toast({ title: "Error", description: "Subject and body are required", variant: "destructive" });
      return;
    }
    try {
      await sendEmail.mutateAsync({
        applicationId,
        templateId: selectedTemplateId || undefined,
        subject: emailSubject,
        htmlBody: emailBody,
      });
      toast({ title: "Email sent" });
      setEmailDialogOpen(false);
      setEmailSubject("");
      setEmailBody("");
      setSelectedTemplateId("");
    } catch {
      toast({ title: "Error", description: "Failed to send email", variant: "destructive" });
    }
  }

  function handleSubmitRating() {
    if (ratingValue === 0) return;
    addRating.mutate(
      { id: applicationId, rating: ratingValue, comment: ratingComment || undefined },
      {
        onSuccess: () => {
          toast({ title: "Rating submitted" });
          setRatingValue(0);
          setRatingComment("");
        },
        onError: () => toast({ title: "Error", description: "Failed to submit rating", variant: "destructive" }),
      }
    );
  }

  function handleSaveNotes() {
    updateNotes.mutate(
      { id: applicationId, notes: currentNotes },
      {
        onSuccess: () => {
          toast({ title: "Notes saved" });
          setIsEditingNotes(false);
        },
        onError: () => toast({ title: "Error", description: "Failed to save notes", variant: "destructive" }),
      }
    );
  }

  const avgRating = app.ratings && app.ratings.length > 0
    ? (app.ratings.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / app.ratings.length)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={app.jobId ? `/applications?jobId=${app.jobId}` : "/applications"}>
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-lg font-medium text-indigo-700">
                      {app.candidateFirstName?.[0]}{app.candidateLastName?.[0]}
                    </span>
                  </div>
                  <div>
                    <CardTitle className="text-xl">
                      {app.candidateFirstName} {app.candidateLastName}
                    </CardTitle>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{app.candidateEmail}</span>
                      {app.candidatePhone && (
                        <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{app.candidatePhone}</span>
                      )}
                    </div>
                  </div>
                </div>
                <Badge variant="secondary" className={`${statusColor(app.status)} text-sm`}>{app.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 border-t pt-3">
                <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" />{app.jobTitle}</span>
                {app.jobDepartment && <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{app.jobDepartment}</span>}
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Applied {formatDate(app.appliedAt)}</span>
                {app.candidateSource && <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />Source: {app.candidateSource}</span>}
                {app.candidateLinkedinUrl && /^https?:\/\//i.test(app.candidateLinkedinUrl) && (
                  <a href={app.candidateLinkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                    <Linkedin className="w-3.5 h-3.5" /> LinkedIn
                  </a>
                )}
              </div>
            </CardContent>
          </Card>

          {app.candidateResumeUrl && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Resume
                  </CardTitle>
                  {resumeBlobUrl && (
                    <div className="flex gap-2">
                      <a href={resumeBlobUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="gap-1">
                          <ExternalLink className="w-3.5 h-3.5" /> Open
                        </Button>
                      </a>
                      <a href={resumeBlobUrl} download={app.candidateResumeUrl.split("/").pop() || "resume"}>
                        <Button variant="outline" size="sm" className="gap-1">
                          <Download className="w-3.5 h-3.5" /> Download
                        </Button>
                      </a>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {!resumeBlobUrl ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                    <span className="ml-2 text-sm text-gray-500">Loading resume...</span>
                  </div>
                ) : app.candidateResumeUrl.toLowerCase().endsWith(".pdf") ? (
                  <iframe
                    src={resumeBlobUrl}
                    className="w-full h-[500px] rounded-lg border"
                    title="Resume Preview"
                  />
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <FileText className="w-8 h-8 text-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700">Uploaded Resume</p>
                      <p className="text-xs text-gray-500 truncate">{app.candidateResumeUrl.split("/").pop()}</p>
                      <p className="text-xs text-gray-400 mt-1">Use Open or Download above to view this file.</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {app.coverLetter && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Cover Letter</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{app.coverLetter}</p>
              </CardContent>
            </Card>
          )}

          {customFields && customFields.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Application Responses</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {customFields.map((field) => (
                    <div key={field.id} className="flex flex-col">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{field.label}</span>
                      <span className="text-sm text-gray-900 mt-0.5">
                        {customResponses[field.id] || <span className="text-gray-400 italic">Not provided</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Internal Notes
                </CardTitle>
                {!isEditingNotes && (
                  <Button variant="ghost" size="sm" onClick={() => setIsEditingNotes(true)}>
                    {currentNotes ? "Edit" : "Add notes"}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {isEditingNotes ? (
                <div className="space-y-2">
                  <Textarea
                    value={currentNotes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add internal notes about this candidate..."
                    rows={4}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveNotes} disabled={updateNotes.isPending}>
                      {updateNotes.isPending ? "Saving..." : "Save"}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { setIsEditingNotes(false); setNotes(null); }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : currentNotes ? (
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{currentNotes}</p>
              ) : (
                <p className="text-sm text-gray-400 italic">No notes yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="w-full lg:w-80 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Update Status</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Select value={app.status} onValueChange={handleStatusChange} disabled={updateStatus.isPending}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="shortlisted">Shortlisted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="hired">Hired</SelectItem>
                </SelectContent>
              </Select>
              <label className="flex items-center gap-2 mt-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyOnStatusChange}
                  onChange={(e) => setNotifyOnStatusChange(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-xs text-gray-600">Notify candidate of status change</span>
              </label>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {["reviewed", "shortlisted", "hired", "rejected"].filter(s => s !== app.status).map((s) => (
                  <Button
                    key={s}
                    variant="outline"
                    size="sm"
                    className="text-xs capitalize"
                    onClick={() => handleStatusChange(s)}
                    disabled={updateStatus.isPending}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Send className="w-4 h-4" /> Send Email
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Button
                className="w-full"
                variant="outline"
                onClick={() => setEmailDialogOpen(true)}
              >
                <Mail className="w-4 h-4 mr-2" /> Compose Email
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="w-4 h-4" /> Rate Candidate
              </CardTitle>
              {avgRating !== null && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-medium">{(Math.round(avgRating * 10) / 10).toFixed(1)}</span>
                  </div>
                  <span className="text-xs text-gray-500">({app.ratings.length} review{app.ratings.length !== 1 ? "s" : ""})</span>
                </div>
              )}
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <StarRatingInput value={ratingValue} onChange={setRatingValue} />
              <Textarea
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="Add a comment (optional)"
                rows={2}
                className="text-sm"
              />
              <Button
                size="sm"
                onClick={handleSubmitRating}
                disabled={ratingValue === 0 || addRating.isPending}
                className="w-full"
              >
                {addRating.isPending ? "Submitting..." : "Submit Rating"}
              </Button>
            </CardContent>
          </Card>

          {app.ratings && app.ratings.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Rating History</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {app.ratings.map((r: { id: string; ratedBy: string; rating: number; comment: string | null; createdAt: string }) => (
                    <div key={r.id} className="border-b last:border-0 pb-2 last:pb-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3 h-3 ${star <= r.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-gray-400">{formatDate(r.createdAt)}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">By: {r.ratedBy}</p>
                      {r.comment && <p className="text-xs text-gray-600 mt-1">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {emailHistory && emailHistory.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Email History
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {emailHistory.map((email) => (
                    <div key={email.id} className="border-b last:border-0 pb-2 last:pb-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-gray-700 truncate flex-1">{email.subject}</p>
                        <Badge variant={email.status === "sent" ? "default" : "destructive"} className="text-[10px] ml-2">
                          {email.status}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        To: {email.toEmail} · {formatDate(email.sentAt)}
                        {email.sentBy === "system" && " · Auto"}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Send Email to {app.candidateFirstName} {app.candidateLastName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Template (optional)</Label>
              <Select value={selectedTemplateId} onValueChange={handleSelectTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template..." />
                </SelectTrigger>
                <SelectContent>
                  {emailTemplates?.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Subject</Label>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Email subject..."
              />
            </div>
            <div>
              <Label>Body (HTML)</Label>
              <Textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="Email body..."
                rows={8}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSendEmail} disabled={sendEmail.isPending}>
              {sendEmail.isPending ? "Sending..." : "Send Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
