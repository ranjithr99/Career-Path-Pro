import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Jobs from "@/pages/jobs";
import InterviewPrep from "@/pages/interview-prep";
import ApplicationTips from "@/pages/application-tips";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

function Navigation() {
  const [location] = useLocation();
  const { toast } = useToast();
  const hasUploadedThisSession = localStorage.getItem('currentSessionUpload') === 'true';

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (!hasUploadedThisSession && path !== '/') {
      e.preventDefault();
      toast({
        title: "Resume Required",
        description: "Please upload your resume first to access this feature.",
      });
      return;
    }
  };

  return (
    <nav className="w-full border-b border-gray-200/20 shadow-sm bg-white">
      <div className="max-w-screen-xl mx-auto flex items-center justify-between h-16 px-4">
        <Link href="/">
          <a className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
            CareerPath Pro
          </a>
        </Link>

        <div className="flex items-center gap-8">
          <Link href="/jobs">
            <a 
              className={`text-sm font-medium ${location === '/jobs' ? 'text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text' : 'text-gray-700'} hover:text-transparent hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 hover:bg-clip-text transition-all duration-300`}
              onClick={(e) => handleNavClick(e, '/jobs')}
            >
              Jobs
            </a>
          </Link>
          <Link href="/interview-prep">
            <a 
              className={`text-sm font-medium ${location === '/interview-prep' ? 'text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text' : 'text-gray-700'} hover:text-transparent hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 hover:bg-clip-text transition-all duration-300`}
              onClick={(e) => handleNavClick(e, '/interview-prep')}
            >
              Interview Prep
            </a>
          </Link>
          <Link href="/application-tips">
            <a 
              className={`text-sm font-medium ${location === '/application-tips' ? 'text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text' : 'text-gray-700'} hover:text-transparent hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 hover:bg-clip-text transition-all duration-300`}
              onClick={(e) => handleNavClick(e, '/application-tips')}
            >
              Application Tips
            </a>
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Router() {
  const hasUploadedThisSession = localStorage.getItem('currentSessionUpload') === 'true';

  return (
    <div>
      <Navigation />
      <Switch>
        <Route path="/" component={Home} />
        {hasUploadedThisSession && (
          <>
            <Route path="/jobs" component={Jobs} />
            <Route path="/interview-prep" component={InterviewPrep} />
            <Route path="/application-tips" component={ApplicationTips} />
          </>
        )}
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;