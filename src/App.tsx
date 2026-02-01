import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth-context";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Counter from "./pages/Counter";
import Hunts from "./pages/Hunts";
import Pokedex from "./pages/Pokedex";
import Collection from "./pages/Collection";

import NotFound from "./pages/NotFound";
import { useUserPreferences } from "@/hooks/use-user-preferences";

const queryClient = new QueryClient();

function AppContent() {
  // Load and apply user preferences globally
  useUserPreferences();

  return (
    <>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/counter" element={<Counter />} />
          <Route path="/counter/:huntId" element={<Counter />} />
          <Route path="/hunts" element={<Hunts />} />
          <Route path="/pokedex" element={<Pokedex />} />
          <Route path="/collection" element={<Collection />} />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <AppContent />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
