import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import AppLayout from "@/components/layout/app-layout";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import JobsPage from "@/pages/jobs/index";
import JobForm from "@/pages/jobs/form";
import JobDetail from "@/pages/jobs/detail";
import CandidatesPage from "@/pages/candidates";
import ApplicationsPage from "@/pages/applications";
import ApplicationDetail from "@/pages/application-detail";
import EmailTemplatesPage from "@/pages/email-templates";
import SettingsPage from "@/pages/settings";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function OrgGate({ children }: { children: React.ReactNode }) {
  const { currentOrg, organizations, isLoading, selectOrg } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!currentOrg && organizations.length > 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4 p-8">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-xl">LA</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Select an Organization</h1>
          <p className="text-sm text-gray-500">Choose an organization to get started</p>
          <div className="space-y-2">
            {organizations.map((org) => (
              <button
                key={org.organizationId}
                onClick={() => selectOrg(org.organizationId)}
                className="w-full p-3 rounded-lg border border-gray-200 hover:bg-gray-50 text-left"
              >
                <p className="font-medium text-gray-900">{org.orgName}</p>
                <p className="text-xs text-gray-500 capitalize">{org.role.replace("_", " ")}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!currentOrg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4 p-8">
          <h1 className="text-xl font-bold text-gray-900">No Organization</h1>
          <p className="text-sm text-gray-500">You are not a member of any organization yet.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function AuthGate() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <OrgGate>
        <AppLayout>
          <Switch>
            <Route path="/" component={DashboardPage} />
            <Route path="/jobs" component={JobsPage} />
            <Route path="/jobs/new">{() => <JobForm />}</Route>
            <Route path="/jobs/:id/edit">{(params) => <JobForm jobId={params.id} />}</Route>
            <Route path="/jobs/:id">{(params) => <JobDetail jobId={params.id} />}</Route>
            <Route path="/candidates" component={CandidatesPage} />
            <Route path="/applications/:id">{(params) => <ApplicationDetail applicationId={params.id} />}</Route>
            <Route path="/applications">{() => <ApplicationsPage />}</Route>
            <Route path="/email-templates" component={EmailTemplatesPage} />
            <Route path="/settings" component={SettingsPage} />
            <Route component={NotFound} />
          </Switch>
        </AppLayout>
      </OrgGate>
    </WouterRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthGate />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
