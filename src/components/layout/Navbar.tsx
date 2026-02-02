import { Link, useLocation } from 'react-router-dom';
import { Calculator, Search, Grid3X3, LogOut, User, Sparkles, Crosshair } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabaseProjectRef } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeCustomizer } from '@/components/layout/ThemeCustomizer'; // Import ThemeCustomizer

export function Navbar() {
  const location = useLocation();
  const { user, signOut } = useAuth();

  const navLinks = [
    { to: '/hunts', label: 'Hunts', icon: Crosshair },
    { to: '/counter', label: 'Counter', icon: Calculator },
    { to: '/pokedex', label: 'Pokédex', icon: Search },
    { to: '/collection', label: 'Collection', icon: Grid3X3 },

  ];

  return (
    <nav className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold shiny-text">PokeShinyTracker</span>
        </Link>

        <div className="flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;

            return (
              <Link key={link.to} to={link.to}>
                <Button
                  variant={isActive ? 'default' : 'ghost'}
                  size="sm"
                  className="gap-2"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{link.label}</span>
                </Button>
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <ThemeCustomizer /> {/* Add ThemeCustomizer here */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="text-muted-foreground text-xs flex flex-col items-start gap-1">
                  <span className="font-semibold text-foreground">{user.email}</span>
                  <span>ID: {user.id.slice(0, 8)}...</span>
                  <span>Project: {supabaseProjectRef}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth">
              <Button size="sm">Login</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
