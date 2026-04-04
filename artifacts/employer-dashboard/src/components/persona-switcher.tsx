import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import apiClient from "@/lib/api-config";
import { Zap } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Persona {
  id: string;
  email: string;
  displayName: string;
  organizations: Array<{ organizationId: string; role: string; orgName: string }>;
}

const roleLabels: Record<string, string> = {
  admin: "Admin",
  hiring_manager: "Hiring Manager",
  viewer: "Viewer",
};

export default function PersonaSwitcher() {
  const { user, personaLogin } = useAuth();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    apiClient
      .get("/auth/personas")
      .then(({ data }) => setPersonas(data))
      .catch(() => setPersonas([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading || personas.length === 0) return null;

  const otherPersonas = personas.filter((p) => p.id !== user?.id);
  if (otherPersonas.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors"
          title="Switch persona (dev only)"
        >
          <Zap className="w-3 h-3" />
          Switch
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs text-amber-600 flex items-center gap-1">
          <Zap className="w-3 h-3" /> Dev Personas
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {otherPersonas.map((persona) => (
          <DropdownMenuItem
            key={persona.id}
            disabled={switching}
            onClick={async () => {
              setSwitching(true);
              try {
                await personaLogin(persona.id);
                window.location.reload();
              } catch {
                setSwitching(false);
              }
            }}
            className="cursor-pointer"
          >
            <div className="flex items-center gap-2 w-full">
              <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-[10px] shrink-0">
                {persona.displayName.split(" ").map((n) => n[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{persona.displayName}</p>
                <p className="text-xs text-gray-500 truncate">
                  {persona.organizations.map((o) => roleLabels[o.role] || o.role).join(", ")}
                </p>
              </div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
