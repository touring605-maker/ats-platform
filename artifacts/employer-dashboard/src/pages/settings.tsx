import { OrganizationProfile } from "@clerk/clerk-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your organization settings and team members</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Organization</CardTitle>
        </CardHeader>
        <CardContent>
          <OrganizationProfile
            appearance={{
              elements: {
                rootBox: "w-full",
                cardBox: "shadow-none border-0 w-full",
                card: "shadow-none border-0 w-full",
              },
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
