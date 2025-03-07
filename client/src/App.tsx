import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import CareerAnalysis from "@/pages/career-analysis";
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
        <NavigationMenuItem>
          <Link href="/">
            <NavigationMenuLink>Home</NavigationMenuLink>
          </Link>
        </NavigationMenuItem>

        {hasProfile && (
          <>
            <NavigationMenuItem>
              <Link href="/career-analysis">
                <NavigationMenuLink>Career Analysis</NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="/interview-prep">
                <NavigationMenuLink>Interview Prep</NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="/application-tips">
                <NavigationMenuLink>Application Tips</NavigationMenuLink>
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
            <Route path="/career-analysis" component={CareerAnalysis} />
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