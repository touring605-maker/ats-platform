import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatSalary(min?: number | null, max?: number | null, currency?: string | null): string {
  const curr = currency || "USD";
  const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: curr, maximumFractionDigits: 0 });
  if (min && max) return `${fmt.format(min)} - ${fmt.format(max)}`;
  if (min) return `${fmt.format(min)}+`;
  if (max) return `Up to ${fmt.format(max)}`;
  return "";
}

export function formatEmploymentType(type: string): string {
  const map: Record<string, string> = {
    full_time: "Full-time",
    part_time: "Part-time",
    contract: "Contract",
    internship: "Internship",
    temporary: "Temporary",
  };
  return map[type] || type;
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    published: "bg-emerald-100 text-emerald-700",
    closed: "bg-amber-100 text-amber-700",
    archived: "bg-slate-100 text-slate-600",
    new: "bg-blue-100 text-blue-700",
    reviewed: "bg-violet-100 text-violet-700",
    shortlisted: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-700",
    hired: "bg-teal-100 text-teal-700",
  };
  return map[status] || "bg-gray-100 text-gray-700";
}
