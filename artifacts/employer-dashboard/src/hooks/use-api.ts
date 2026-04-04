import { useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth, useOrganization } from "@clerk/clerk-react";
import apiClient from "@/lib/api-config";

function useOrgHeaders() {
  const { getToken } = useAuth();
  const { organization } = useOrganization();

  return async () => {
    const token = await getToken();
    return {
      Authorization: `Bearer ${token}`,
      "X-Organization-Id": organization?.id || "",
    };
  };
}

export function useDashboardSummary() {
  const getHeaders = useOrgHeaders();
  const { organization } = useOrganization();

  return useQuery({
    queryKey: ["dashboard-summary", organization?.id],
    queryFn: async () => {
      const headers = await getHeaders();
      const { data } = await apiClient.get("/dashboard/summary", { headers });
      return data;
    },
    enabled: !!organization?.id,
  });
}

export function useJobStats() {
  const getHeaders = useOrgHeaders();
  const { organization } = useOrganization();

  return useQuery({
    queryKey: ["job-stats", organization?.id],
    queryFn: async () => {
      const headers = await getHeaders();
      const { data } = await apiClient.get("/jobs/stats", { headers });
      return data;
    },
    enabled: !!organization?.id,
  });
}

export function useJobs(params?: { status?: string; search?: string; department?: string; location?: string; page?: number; limit?: number }) {
  const getHeaders = useOrgHeaders();
  const { organization } = useOrganization();

  return useQuery({
    queryKey: ["jobs", organization?.id, params],
    queryFn: async () => {
      const headers = await getHeaders();
      const { data } = await apiClient.get("/jobs", { headers, params });
      return data;
    },
    enabled: !!organization?.id,
  });
}

export function useJob(id: string | undefined) {
  const getHeaders = useOrgHeaders();
  const { organization } = useOrganization();

  return useQuery({
    queryKey: ["job", id, organization?.id],
    queryFn: async () => {
      const headers = await getHeaders();
      const { data } = await apiClient.get(`/jobs/${id}`, { headers });
      return data;
    },
    enabled: !!id && !!organization?.id,
  });
}

export function useCreateJob() {
  const getHeaders = useOrgHeaders();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const headers = await getHeaders();
      const { data } = await apiClient.post("/jobs", body, { headers });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["job-stats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
}

export function useUpdateJob() {
  const getHeaders = useOrgHeaders();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string; [key: string]: unknown }) => {
      const headers = await getHeaders();
      const { data } = await apiClient.patch(`/jobs/${id}`, body, { headers });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["job"] });
      queryClient.invalidateQueries({ queryKey: ["job-stats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
}

export function useDeleteJob() {
  const getHeaders = useOrgHeaders();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const headers = await getHeaders();
      await apiClient.delete(`/jobs/${id}`, { headers });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["job-stats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
}

export function useApplications(params?: {
  jobId?: string;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  minRating?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}) {
  const getHeaders = useOrgHeaders();
  const { organization } = useOrganization();

  return useQuery({
    queryKey: ["applications", organization?.id, params],
    queryFn: async () => {
      const headers = await getHeaders();
      const { data } = await apiClient.get("/applications", { headers, params });
      return data;
    },
    enabled: !!organization?.id,
  });
}

export function useApplication(id: string | undefined) {
  const getHeaders = useOrgHeaders();
  const { organization } = useOrganization();

  return useQuery({
    queryKey: ["application", id, organization?.id],
    queryFn: async () => {
      const headers = await getHeaders();
      const { data } = await apiClient.get(`/applications/${id}`, { headers });
      return data;
    },
    enabled: !!id && !!organization?.id,
  });
}

export function useUpdateApplicationStatus() {
  const getHeaders = useOrgHeaders();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const headers = await getHeaders();
      const { data } = await apiClient.patch(`/applications/${id}/status`, { status }, { headers });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["application"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
}

export function useBulkUpdateApplicationStatus() {
  const getHeaders = useOrgHeaders();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      const headers = await getHeaders();
      const results = await Promise.allSettled(
        ids.map((id) => apiClient.patch(`/applications/${id}/status`, { status }, { headers }))
      );
      const succeeded = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;
      return { succeeded, failed };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["application"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
}

export function useUpdateApplicationNotes() {
  const getHeaders = useOrgHeaders();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const headers = await getHeaders();
      const { data } = await apiClient.patch(`/applications/${id}/notes`, { notes }, { headers });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application"] });
    },
  });
}

export function useAddRating() {
  const getHeaders = useOrgHeaders();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, rating, comment }: { id: string; rating: number; comment?: string }) => {
      const headers = await getHeaders();
      const { data } = await apiClient.post(`/applications/${id}/ratings`, { rating, comment }, { headers });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application"] });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });
}

export function useResumeUrl(applicationId: string | undefined, resumeUrl: string | null | undefined) {
  const { getToken } = useAuth();
  const prevUrlRef = useRef<string | null>(null);

  const query = useQuery({
    queryKey: ["resume-blob", applicationId],
    queryFn: async () => {
      if (prevUrlRef.current) {
        URL.revokeObjectURL(prevUrlRef.current);
        prevUrlRef.current = null;
      }
      const token = await getToken();
      const response = await fetch(
        `${import.meta.env.BASE_URL}api/applications/${applicationId}/resume`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error("Failed to fetch resume");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      prevUrlRef.current = url;
      return url;
    },
    enabled: !!applicationId && !!resumeUrl,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    return () => {
      if (prevUrlRef.current) {
        URL.revokeObjectURL(prevUrlRef.current);
        prevUrlRef.current = null;
      }
    };
  }, []);

  return query;
}

export function useCandidates(params?: { search?: string; page?: number; limit?: number }) {
  const getHeaders = useOrgHeaders();
  const { organization } = useOrganization();

  return useQuery({
    queryKey: ["candidates", organization?.id, params],
    queryFn: async () => {
      const headers = await getHeaders();
      const { data } = await apiClient.get("/candidates", { headers, params });
      return data;
    },
    enabled: !!organization?.id,
  });
}
