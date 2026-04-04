import { useState } from "react";
import {
  useEmailTemplates,
  useSeedDefaultTemplates,
  useCreateEmailTemplate,
  useUpdateEmailTemplate,
  useDeleteEmailTemplate,
} from "@/hooks/use-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Mail, Plus, Pencil, Trash2, Download, Eye } from "lucide-react";

const AVAILABLE_MERGE_FIELDS = [
  "candidateName",
  "candidateEmail",
  "jobTitle",
  "companyName",
  "status",
];

interface TemplateForm {
  name: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  mergeFields: string[];
}

const emptyForm: TemplateForm = {
  name: "",
  subject: "",
  htmlBody: "",
  textBody: "",
  mergeFields: [],
};

export default function EmailTemplates() {
  const { data: templates, isLoading } = useEmailTemplates();
  const seedDefaults = useSeedDefaultTemplates();
  const createTemplate = useCreateEmailTemplate();
  const updateTemplate = useUpdateEmailTemplate();
  const deleteTemplate = useDeleteEmailTemplate();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TemplateForm>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<{ subject: string; htmlBody: string } | null>(null);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (template: NonNullable<typeof templates>[0]) => {
    setEditingId(template.id);
    setForm({
      name: template.name,
      subject: template.subject,
      htmlBody: template.htmlBody,
      textBody: template.textBody || "",
      mergeFields: template.mergeFields || [],
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.subject || !form.htmlBody) {
      toast({ title: "Error", description: "Name, subject, and body are required", variant: "destructive" });
      return;
    }

    try {
      if (editingId) {
        await updateTemplate.mutateAsync({
          id: editingId,
          name: form.name,
          subject: form.subject,
          htmlBody: form.htmlBody,
          textBody: form.textBody || undefined,
          mergeFields: form.mergeFields,
        });
        toast({ title: "Template updated" });
      } else {
        await createTemplate.mutateAsync({
          name: form.name,
          subject: form.subject,
          htmlBody: form.htmlBody,
          textBody: form.textBody || undefined,
          mergeFields: form.mergeFields,
        });
        toast({ title: "Template created" });
      }
      setDialogOpen(false);
    } catch {
      toast({ title: "Error", description: "Failed to save template", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteTemplate.mutateAsync(deleteId);
      toast({ title: "Template deleted" });
    } catch {
      toast({ title: "Error", description: "Failed to delete template", variant: "destructive" });
    }
    setDeleteId(null);
  };

  const handleSeedDefaults = async () => {
    try {
      const result = await seedDefaults.mutateAsync();
      toast({ title: "Default templates seeded", description: `${(result as { count: number }).count} templates added` });
    } catch {
      toast({ title: "Error", description: "Failed to seed templates", variant: "destructive" });
    }
  };

  const insertMergeField = (field: string) => {
    setForm(f => ({
      ...f,
      htmlBody: f.htmlBody + `{{${field}}}`,
      mergeFields: f.mergeFields.includes(field) ? f.mergeFields : [...f.mergeFields, field],
    }));
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Email Templates</h1>
          <p className="text-sm text-gray-500 mt-1">Manage reusable email templates for candidate communication</p>
        </div>
        <div className="flex gap-2">
          {(!templates || templates.length === 0) && (
            <Button variant="outline" onClick={handleSeedDefaults} disabled={seedDefaults.isPending}>
              <Download className="w-4 h-4 mr-2" />
              {seedDefaults.isPending ? "Seeding..." : "Load Default Templates"}
            </Button>
          )}
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" /> New Template
          </Button>
        </div>
      </div>

      {templates && templates.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No email templates yet</p>
            <p className="text-sm text-gray-400 mb-4">Load default templates to get started, or create your own.</p>
            <Button variant="outline" onClick={handleSeedDefaults} disabled={seedDefaults.isPending}>
              <Download className="w-4 h-4 mr-2" /> Load Default Templates
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {templates?.map((template) => (
          <Card key={template.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  {template.isDefault && <Badge variant="secondary">Default</Badge>}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewTemplate({ subject: template.subject, htmlBody: template.htmlBody })}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(template)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteId(template.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Subject:</span> {template.subject}
              </p>
              {template.mergeFields && template.mergeFields.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {template.mergeFields.map((field) => (
                    <Badge key={field} variant="outline" className="text-xs">
                      {`{{${field}}}`}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Template" : "Create Template"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Template Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g., Interview Invitation"
              />
            </div>
            <div>
              <Label>Subject Line</Label>
              <Input
                value={form.subject}
                onChange={(e) => setForm(f => ({ ...f, subject: e.target.value }))}
                placeholder="e.g., Interview for {{jobTitle}}"
              />
            </div>
            <div>
              <Label>HTML Body</Label>
              <div className="flex gap-1 mb-2 flex-wrap">
                <span className="text-xs text-gray-500 leading-6">Insert:</span>
                {AVAILABLE_MERGE_FIELDS.map((field) => (
                  <Button
                    key={field}
                    variant="outline"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => insertMergeField(field)}
                  >
                    {`{{${field}}}`}
                  </Button>
                ))}
              </div>
              <Textarea
                value={form.htmlBody}
                onChange={(e) => setForm(f => ({ ...f, htmlBody: e.target.value }))}
                placeholder="<p>Hi {{candidateName}},</p>"
                rows={10}
                className="font-mono text-sm"
              />
            </div>
            <div>
              <Label>Plain Text Body (optional)</Label>
              <Textarea
                value={form.textBody}
                onChange={(e) => setForm(f => ({ ...f, textBody: e.target.value }))}
                placeholder="Hi {{candidateName}},"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={createTemplate.isPending || updateTemplate.isPending}
            >
              {createTemplate.isPending || updateTemplate.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <div>
              <p className="text-sm font-medium mb-2">Subject: {previewTemplate.subject}</p>
              <div
                className="border rounded-lg p-4 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: previewTemplate.htmlBody }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this email template? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
