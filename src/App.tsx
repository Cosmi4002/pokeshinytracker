import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth-context";
import { RandomColorProvider } from "@/lib/random-color-context";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Counter from "./pages/Counter";
import Pokedex from "./pages/Pokedex";
import PokemonDetails from "./pages/PokemonDetails";
import PokedexManager from "./pages/PokedexManager";
import Collection from "./pages/Collection";
import CollectionEvents from "./pages/CollectionEvents";
import Memo from "./pages/Memo";
import UserCollectionsSearch from "./pages/UserCollectionsSearch";
import Bingo from "./pages/Bingo";
import { ScrollRestoration } from "@/components/layout/ScrollRestoration";
import { ApplyAppearance } from "@/components/layout/ApplyAppearance";

import NotFound from "./pages/NotFound";
import Debug from "./pages/Debug";
import { useUserPreferences } from "@/hooks/use-user-preferences";

const queryClient = new QueryClient();

function AppContent() {
  // Load and apply user preferences globally
  useUserPreferences();

  return (
    <>
      <ApplyAppearance />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollRestoration />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/counter" element={<Counter />} />
          <Route path="/counter/:huntId" element={<Counter />} />
          <Route path="/pokedex" element={<Pokedex />} />
          <Route path="/pokedex/:pokemonId" element={<PokemonDetails />} />
          <Route path="/pokedex/manage" element={<PokedexManager />} />
          <Route path="/collection" element={<Collection />} />
          <Route path="/collection/events" element={<CollectionEvents />} />
          <Route path="/memo" element={<Memo />} />
          <Route path="/users" element={<UserCollectionsSearch />} />
          <Route path="/bingo" element={<Bingo />} />
          <Route path="/debug" element={<Debug />} />

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
        <RandomColorProvider>
          <AppContent />
        </RandomColorProvider>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
