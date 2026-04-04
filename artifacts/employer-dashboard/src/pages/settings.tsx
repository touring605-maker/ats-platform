import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const { user, currentOrg, organizations } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account and organization</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-gray-500">Name</p>
            <p className="text-sm font-medium text-gray-900">{user?.displayName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="text-sm font-medium text-gray-900">{user?.email}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Organization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentOrg && (
            <>
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="text-sm font-medium text-gray-900">{currentOrg.orgName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Your Role</p>
                <Badge variant="secondary" className="capitalize">
                  {currentOrg.role.replace("_", " ")}
                </Badge>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {organizations.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">All Organizations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {organizations.map((org) => (
                <div
                  key={org.organizationId}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{org.orgName}</p>
                    <p className="text-xs text-gray-500 capitalize">{org.role.replace("_", " ")}</p>
                  </div>
                  {org.organizationId === currentOrg?.organizationId && (
                    <Badge>Current</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
