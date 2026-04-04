import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import apiClient from "@/lib/api-config";
import { Shield, LogIn, UserPlus, Zap } from "lucide-react";

interface Persona {
  id: string;
  email: string;
  displayName: string;
  organizations: Array<{ organizationId: string; role: string; orgName: string }>;
}

function QuickAccessPanel() {
  const { personaLogin } = useAuth();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get("/auth/personas")
      .then(({ data }) => setPersonas(data))
      .catch(() => setPersonas([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (personas.length === 0) return null;

  const roleColors: Record<string, string> = {
    admin: "bg-red-100 text-red-700",
    hiring_manager: "bg-blue-100 text-blue-700",
    viewer: "bg-gray-100 text-gray-700",
  };

  const roleLabels: Record<string, string> = {
    admin: "Admin",
    hiring_manager: "Hiring Manager",
    viewer: "Viewer",
  };

  return (
    <Card className="border-dashed border-amber-300 bg-amber-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-amber-700">
          <Zap className="w-4 h-4" />
          Quick Access (Dev Only)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {personas.map((persona) => (
          <button
            key={persona.id}
            disabled={loginLoading !== null}
            onClick={async () => {
              setLoginLoading(persona.id);
              try {
                await personaLogin(persona.id);
              } catch {
                setLoginLoading(null);
              }
            }}
            className="w-full flex items-center gap-3 p-3 rounded-lg border border-amber-200 bg-white hover:bg-amber-50 transition-colors text-left disabled:opacity-50"
          >
            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm shrink-0">
              {persona.displayName.split(" ").map((n) => n[0]).join("")}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{persona.displayName}</p>
              <p className="text-xs text-gray-500 truncate">{persona.email}</p>
            </div>
            {persona.organizations.map((o) => (
              <span
                key={o.organizationId}
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[o.role] || "bg-gray-100 text-gray-700"}`}
              >
                {roleLabels[o.role] || o.role}
              </span>
            ))}
            {loginLoading === persona.id && (
              <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            )}
          </button>
        ))}
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "register") {
        await register(email, password, displayName);
      } else {
        await login(email, password);
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : "Something went wrong";
      setError(msg || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-xl bg-indigo-600 flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-2xl">LA</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">LastATS</h1>
          <p className="text-sm text-gray-500">Applicant Tracking System</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {mode === "login" ? (
                <>
                  <LogIn className="w-4 h-4" /> Sign In
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" /> Create Account
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <div className="space-y-2">
                  <Label htmlFor="displayName">Name</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    required
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                />
              </div>
              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : mode === "login" ? (
                  "Sign In"
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "login" ? "register" : "login");
                  setError("");
                }}
                className="text-sm text-indigo-600 hover:underline"
              >
                {mode === "login" ? "Need an account? Register" : "Already have an account? Sign in"}
              </button>
            </div>
          </CardContent>
        </Card>

        <QuickAccessPanel />

        <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
          <Shield className="w-3 h-3" /> Secured with session-based authentication
        </p>
      </div>
    </div>
  );
}
