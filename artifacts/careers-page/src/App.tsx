import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import CareersLanding from "@/pages/careers-landing";
import JobDetail from "@/pages/job-detail";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
});

function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl font-bold text-white">LA</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">LastATS Careers</h1>
        <p className="mt-2 text-gray-600">
          Visit your organization's careers page to browse open positions.
        </p>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/:orgSlug/jobs/:jobId">
        {(params) => <JobDetail orgSlug={params.orgSlug} jobId={params.jobId} />}
      </Route>
      <Route path="/:orgSlug">
        {(params) => <CareersLanding orgSlug={params.orgSlug} />}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
