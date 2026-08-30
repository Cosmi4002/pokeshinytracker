import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
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
import CollectionSpecial from "./pages/CollectionSpecial";
import CollectionFailUncatchable from "./pages/CollectionFailUncatchable";
import History from "./pages/History";
import HuntRooms from "./pages/HuntRooms";
import UserCollectionsSearch from "./pages/UserCollectionsSearch";
import Games from "./pages/Bingo";
import Stats from "./pages/Stats";
import { ScrollRestoration } from "@/components/layout/ScrollRestoration";
import { ApplyAppearance } from "@/components/layout/ApplyAppearance";
import { PwaNotificationManager } from "@/components/notifications/PwaNotificationManager";

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
      <PwaNotificationManager />
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
          <Route path="/collection/special" element={<CollectionSpecial />} />
          <Route path="/collection/events" element={<CollectionEvents />} />
          <Route path="/collection/fail-uncatchable" element={<CollectionFailUncatchable />} />
          <Route path="/history" element={<History />} />
          <Route path="/rooms" element={<HuntRooms />} />
          <Route path="/rooms/:roomId" element={<HuntRooms />} />
          <Route path="/users" element={<UserCollectionsSearch />} />
          <Route path="/games" element={<Games />} />
          <Route path="/bingo" element={<Navigate to="/games" replace />} />
          <Route path="/stats" element={<Stats />} />
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
