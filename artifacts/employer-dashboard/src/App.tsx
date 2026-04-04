import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignIn,
  OrganizationSwitcher,
  useOrganization,
} from "@clerk/clerk-react";
import AppLayout from "@/components/layout/app-layout";
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

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function OrgGate({ children }: { children: React.ReactNode }) {
  const { organization, isLoaded } = useOrganization();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4 p-8">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-xl">LA</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Select an Organization</h1>
          <p className="text-sm text-gray-500">Choose or create an organization to get started</p>
          <div className="flex justify-center">
            <OrganizationSwitcher
              hidePersonal
              afterCreateOrganizationUrl="/"
              afterSelectOrganizationUrl="/"
              appearance={{
                elements: {
                  rootBox: "flex justify-center",
                },
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function AppRouter() {
  return (
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
  );
}

function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <SignedOut>
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center space-y-6">
                <div className="w-14 h-14 rounded-xl bg-indigo-600 flex items-center justify-center mx-auto">
                  <span className="text-white font-bold text-2xl">LA</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">LastATS</h1>
                <p className="text-sm text-gray-500">Applicant Tracking System</p>
                <SignIn
                  routing="hash"
                  appearance={{
                    elements: {
                      rootBox: "mx-auto",
                      cardBox: "shadow-lg",
                    },
                  }}
                />
              </div>
            </div>
          </SignedOut>
          <SignedIn>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <OrgGate>
                <AppRouter />
              </OrgGate>
            </WouterRouter>
          </SignedIn>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default App;
