export interface IdentityUser {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
  tenantId: string;
  isActive: boolean;
}

export interface IIdentityService {
  getUserById(userId: string): Promise<IdentityUser | null>;
  getUsersByTenant(tenantId: string): Promise<IdentityUser[]>;
  syncDirectoryUsers(tenantId: string): Promise<{ created: number; updated: number; deactivated: number }>;
}
