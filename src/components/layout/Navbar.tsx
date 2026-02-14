import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Calculator, Search, Grid3X3, LogOut, User, Sparkles, Crosshair, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabaseProjectRef } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ThemeCustomizer } from '@/components/layout/ThemeCustomizer'; // Import ThemeCustomizer
import { useRandomColor } from '@/lib/random-color-context';

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { accentColor } = useRandomColor();

  const navLinks = [
    { to: '/hunts', label: 'Hunts', icon: Crosshair },
    { to: '/counter', label: 'Counter', icon: Calculator },
    { to: '/pokedex', label: 'Pokédex', icon: Search },
    { to: '/collection', label: 'Collection', icon: Grid3X3 },

  ];

  return (
    <nav className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 gap-2">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <Sparkles className="h-6 w-6" style={{ color: accentColor }} />
          <span
            className="text-lg sm:text-xl font-bold whitespace-nowrap bg-clip-text text-transparent bg-gradient-to-r hidden sm:block"
            style={{
              backgroundImage: `linear-gradient(to right, ${accentColor}, color-mix(in srgb, ${accentColor}, white 30%))`
            }}
          >
            PokeShinyTracker
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;

            return (
              <Link key={link.to} to={link.to}>
                <Button
                  variant={isActive ? 'default' : 'ghost'}
                  size="sm"
                  className={cn(
                    "h-9 px-2 sm:px-3 gap-1.5 sm:gap-2",
                    isActive && "bg-primary text-primary-foreground shadow-sm"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden md:inline">{link.label}</span>
                </Button>
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <ThemeCustomizer />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate('/pokedex')}>
                  <Search className="mr-2 h-4 w-4" />
                  Pokédex
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/pokedex/manage')}>
                  <Settings2 className="mr-2 h-4 w-4" />
                  Gestione
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/collection')}>
                  <Grid3X3 className="mr-2 h-4 w-4" />
                  Collezione
                </DropdownMenuItem>
                <DropdownMenuSeparator />
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
              <Button
                size="sm"
                className="font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                style={{
                  backgroundColor: accentColor,
                  color: 'white',
                  boxShadow: `0 0 15px ${accentColor}40`
                }}
              >
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
