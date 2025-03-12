import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Jobs from "@/pages/jobs";
import InterviewPrep from "@/pages/interview-prep";
import ApplicationTips from "@/pages/application-tips";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/components/ui/navigation-menu";
import { Link } from "wouter";

function Navigation() {
  const { data: profile } = useQuery({
    queryKey: ["/api/career-recommendations/1"], // TODO: Get user ID from auth
  });

  const hasProfile = !!profile;

  return (
    <NavigationMenu className="p-4">
      <NavigationMenuList>
        <NavigationMenuItem className="mr-auto">
          <Link href="/">
            <a className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text hover:scale-105 transition-transform duration-200 decoration-transparent">
              CareerPath Pro
            </a>
          </Link>
        </NavigationMenuItem>

        {hasProfile && (
          <>
            <NavigationMenuItem>
              <Link href="/jobs">
                <NavigationMenuLink className="hover:scale-105 transition-all duration-200">
                  Jobs
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="/interview-prep">
                <NavigationMenuLink className="hover:scale-105 transition-all duration-200">
                  Interview Prep
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="/application-tips">
                <NavigationMenuLink className="hover:scale-105 transition-all duration-200">
                  Application Tips
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          </>
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