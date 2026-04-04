import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import apiClient from "@/lib/api-config";

interface User {
  id: string;
  email: string;
  displayName: string;
}

interface OrgMembership {
  organizationId: string;
  role: string;
  orgName: string;
  orgSlug: string;
  orgLogoUrl: string | null;
}

interface AuthContextType {
  user: User | null;
  organizations: OrgMembership[];
  currentOrg: OrgMembership | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  personaLogin: (userId: string) => Promise<void>;
  selectOrg: (orgId: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [organizations, setOrganizations] = useState<OrgMembership[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const savedOrgId = localStorage.getItem("lastats_org_id");
  const currentOrg = organizations.find((o) => o.organizationId === savedOrgId) || organizations[0] || null;

  const selectOrg = useCallback((orgId: string) => {
    localStorage.setItem("lastats_org_id", orgId);
    window.location.reload();
  }, []);

  const fetchMe = useCallback(async () => {
    try {
      const { data } = await apiClient.get("/auth/me");
      setUser(data.user);
      setOrganizations(data.organizations);
      if (data.organizations.length > 0 && !localStorage.getItem("lastats_org_id")) {
        localStorage.setItem("lastats_org_id", data.organizations[0].organizationId);
      }
    } catch {
      setUser(null);
      setOrganizations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = useCallback(async (email: string, password: string) => {
    await apiClient.post("/auth/login", { email, password });
    await fetchMe();
  }, [fetchMe]);

  const register = useCallback(async (email: string, password: string, displayName: string) => {
    await apiClient.post("/auth/register", { email, password, displayName });
    await fetchMe();
  }, [fetchMe]);

  const logout = useCallback(async () => {
    await apiClient.post("/auth/logout");
    setUser(null);
    setOrganizations([]);
    localStorage.removeItem("lastats_org_id");
  }, []);

  const personaLogin = useCallback(async (userId: string) => {
    const { data } = await apiClient.post("/auth/persona-login", { userId });
    setUser(data.user);
    setOrganizations(data.organizations);
    if (data.organizations.length > 0) {
      localStorage.setItem("lastats_org_id", data.organizations[0].organizationId);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        organizations,
        currentOrg,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        personaLogin,
        selectOrg,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
