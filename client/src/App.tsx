import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Admin from "@/pages/Admin";
import Cliente from "@/pages/Cliente";
import Reseller from "@/pages/Reseller";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Cliente} />
      <Route path="/cliente" component={Cliente} />
      <Route path="/admin" component={Admin} />
      <Route path="/reseller" component={Reseller} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
