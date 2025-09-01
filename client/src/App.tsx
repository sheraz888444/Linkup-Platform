import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import NotFound from "@/pages/not-found";
/* Landing removed: default route is Login */
import Home from "@/pages/home";
import Profile from "@/pages/profile";
import AdminDashboard from "@/pages/admin";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import SearchResults from "@/pages/search";
import Videos from "@/pages/videos";
import Friends from "@/pages/friends";

function Router() {
  const { isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();

  function HomeRedirect() {
    useEffect(() => {
      const target = user?.role === 'admin' ? "/admin" : "/home";
      setLocation(target);
    }, [setLocation, user?.role]);
    return null;
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Login} />
          <Route path="/login" component={Login} />
          <Route path="/signup" component={Signup} />
        </>
      ) : (
        <>
          <Route path="/" component={HomeRedirect} />
          <Route path="/home" component={Home} />
          <Route path="/videos" component={Videos} />
          <Route path="/friends" component={Friends} />
          <Route path="/profile" component={Profile} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/search" component={SearchResults} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
