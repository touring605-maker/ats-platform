import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, GripVertical, ChevronUp, ChevronDown } from "lucide-react";

export interface CustomField {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "checkbox" | "number" | "date" | "file";
  required: boolean;
  options?: string[];
}

interface CustomFieldsBuilderProps {
  fields: CustomField[];
  onChange: (fields: CustomField[]) => void;
}

function generateId(): string {
  return `field_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}

export default function CustomFieldsBuilder({ fields, onChange }: CustomFieldsBuilderProps) {
  const [expandedField, setExpandedField] = useState<string | null>(null);

  const addField = () => {
    const newField: CustomField = {
      id: generateId(),
      label: "",
      type: "text",
      required: false,
    };
    onChange([...fields, newField]);
    setExpandedField(newField.id);
  };

  const removeField = (id: string) => {
    onChange(fields.filter((f) => f.id !== id));
    if (expandedField === id) setExpandedField(null);
  };

  const updateField = (id: string, updates: Partial<CustomField>) => {
    onChange(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const moveField = (index: number, direction: "up" | "down") => {
    const newFields = [...fields];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newFields.length) return;
    [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
    onChange(newFields);
  };

  const addOption = (fieldId: string) => {
    const field = fields.find((f) => f.id === fieldId);
    if (!field) return;
    updateField(fieldId, { options: [...(field.options || []), ""] });
  };

  const updateOption = (fieldId: string, optionIndex: number, value: string) => {
    const field = fields.find((f) => f.id === fieldId);
    if (!field) return;
    const newOptions = [...(field.options || [])];
    newOptions[optionIndex] = value;
    updateField(fieldId, { options: newOptions });
  };

  const removeOption = (fieldId: string, optionIndex: number) => {
    const field = fields.find((f) => f.id === fieldId);
    if (!field) return;
    const newOptions = (field.options || []).filter((_, i) => i !== optionIndex);
    updateField(fieldId, { options: newOptions });
  };

  return (
    <div className="space-y-3">
      {fields.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">
          No custom fields. Add fields that candidates will fill out when applying.
        </p>
      )}

      {fields.map((field, index) => (
        <Card key={field.id} className="border border-gray-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => moveField(index, "up")}
                  disabled={index === 0}
                  className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <GripVertical className="w-3.5 h-3.5 text-gray-300" />
                <button
                  type="button"
                  onClick={() => moveField(index, "down")}
                  disabled={index === fields.length - 1}
                  className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              <div
                className="flex-1 cursor-pointer"
                onClick={() => setExpandedField(expandedField === field.id ? null : field.id)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {field.label || "(Unnamed field)"}
                  </span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                    {field.type}
                  </span>
                  {field.required && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-red-50 text-red-600">
                      Required
                    </span>
                  )}
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-red-500 hover:text-red-700"
                onClick={() => removeField(field.id)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>

            {expandedField === field.id && (
              <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
                <div>
                  <Label className="text-xs">Field Label</Label>
                  <Input
                    value={field.label}
                    onChange={(e) => updateField(field.id, { label: e.target.value })}
                    placeholder="e.g. Years of Experience"
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Field Type</Label>
                    <Select
                      value={field.type}
                      onValueChange={(v) => updateField(field.id, { type: v as CustomField["type"], options: v === "select" ? field.options || [""] : undefined })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Short Text</SelectItem>
                        <SelectItem value="textarea">Long Text</SelectItem>
                        <SelectItem value="select">Dropdown</SelectItem>
                        <SelectItem value="checkbox">Checkbox</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="file">File Upload</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2 pt-5">
                    <Switch
                      checked={field.required}
                      onCheckedChange={(v) => updateField(field.id, { required: v })}
                    />
                    <Label className="text-xs">Required</Label>
                  </div>
                </div>

                {field.type === "select" && (
                  <div>
                    <Label className="text-xs">Options</Label>
                    <div className="space-y-2 mt-1">
                      {(field.options || []).map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-2">
                          <Input
                            value={opt}
                            onChange={(e) => updateOption(field.id, optIdx, e.target.value)}
                            placeholder={`Option ${optIdx + 1}`}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => removeOption(field.id, optIdx)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addOption(field.id)}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Option
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      <Button
        type="button"
        variant="outline"
        className="w-full border-dashed"
        onClick={addField}
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Custom Field
      </Button>
    </div>
  );
}
