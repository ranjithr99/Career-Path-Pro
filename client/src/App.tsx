import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Jobs from "@/pages/jobs";
import InterviewPrep from "@/pages/interview-prep";
import ApplicationTips from "@/pages/application-tips";
import { NavigationMenu, NavigationMenuList, NavigationMenuItem } from "@/components/ui/navigation-menu";
import { Link } from "wouter";

function Navigation() {
  const { data: profile } = useQuery({
    queryKey: ["/api/career-recommendations/1"], // TODO: Get user ID from auth
  });

  const hasProfile = !!profile;

  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem className="mr-auto">
          <Link href="/">
            <a className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text hover:scale-105 transition-transform duration-200 decoration-transparent pl-8">
              CareerPath Pro
            </a>
          </Link>
        </NavigationMenuItem>

        {hasProfile && (
          <div className="flex items-center gap-6 pr-8">
            <NavigationMenuItem>
              <Link href="/jobs">
                <a className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-transparent hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 hover:bg-clip-text transition-all duration-300 hover:scale-105">
                  Jobs
                </a>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="/interview-prep">
                <a className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-transparent hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 hover:bg-clip-text transition-all duration-300 hover:scale-105">
                  Interview Prep
                </a>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="/application-tips">
                <a className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-transparent hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 hover:bg-clip-text transition-all duration-300 hover:scale-105">
                  Application Tips
                </a>
              </Link>
            </NavigationMenuItem>
          </div>
        )}
      </NavigationMenuList>
    </NavigationMenu>
  );
}

function Router() {
  const { data: profile } = useQuery({
    queryKey: ["/api/career-recommendations/1"], // TODO: Get user ID from auth
  });

  const hasProfile = !!profile;

  return (
    <div>
      <Navigation />
      <Switch>
        <Route path="/" component={Home} />
        {hasProfile ? (
          <>
            <Route path="/jobs" component={Jobs} />
            <Route path="/interview-prep" component={InterviewPrep} />
            <Route path="/application-tips" component={ApplicationTips} />
          </>
        ) : null}
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