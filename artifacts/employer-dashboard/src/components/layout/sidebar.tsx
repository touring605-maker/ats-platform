import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";
import { UserButton, useOrganization } from "@clerk/clerk-react";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  FileText,
  Settings,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Jobs", href: "/jobs", icon: Briefcase },
  { label: "Candidates", href: "/candidates", icon: Users },
  { label: "Applications", href: "/applications", icon: FileText },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { organization } = useOrganization();

  return (
    <aside className="hidden lg:flex lg:flex-col w-64 border-r border-gray-200 bg-white">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-100">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
          <span className="text-white font-bold text-sm">LA</span>
        </div>
        <span className="font-semibold text-lg text-gray-900">LastATS</span>
      </div>

      {organization && (
        <div className="px-6 py-3 border-b border-gray-100">
          <p className="text-xs text-gray-500">Organization</p>
          <p className="text-sm font-medium text-gray-900 truncate">{organization.name}</p>
        </div>
      )}

      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors",
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-100 p-4">
        <div className="flex items-center gap-3">
          <UserButton afterSignOutUrl="/" />
          <span className="text-sm text-gray-600">Account</span>
        </div>
      </div>
    </aside>
  );
}
