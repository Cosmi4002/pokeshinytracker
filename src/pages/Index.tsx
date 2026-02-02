import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, Gamepad2, Search, Grid3X3, Crosshair, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';

export default function Index() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate('/counter');
    }
  }, [user, loading, navigate]);

  const features = [
    {
      icon: Gamepad2,
      title: 'Shiny Counter',
      description: 'Track your encounters.',
      link: '/counter',
    },
    {
      icon: Crosshair,
      title: 'Active Hunts',
      description: 'Manage your ongoing hunts.',
      link: '/hunts',
    },
    {
      icon: Search,
      title: 'Shiny Pokédex',
      description: 'Browse shiny sprites.',
      link: '/pokedex',
    },
    {
      icon: Grid3X3,
      title: 'Collection',
      description: 'Your caught shinies.',
      link: '/collection',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom right, color-mix(in srgb, var(--primary), transparent 90%), transparent, color-mix(in srgb, var(--primary), transparent 95%))' }}
        />

        <div className="container mx-auto px-4 py-20 relative">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <div className="flex justify-center">
              <div className="relative">
                <Sparkles className="h-20 w-20 text-primary animate-pulse" />
                <div
                  className="absolute inset-0 blur-xl"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--primary), transparent 70%)' }}
                />
              </div>
            </div>

            <h1 className="text-5xl sm:text-6xl font-bold">
              <span className="shiny-text">PokeShinyTracker</span>
            </h1>

            {/* Removed text as requested */}
            <div className="h-4"></div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="shiny-glow">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/counter">
                <Button size="lg" variant="outline">
                  Try Counter
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link key={feature.title} to={feature.link}>
                <Card className="h-full hover:border-primary transition-colors cursor-pointer group">
                  <CardHeader>
                    <div
                      className="h-12 w-12 rounded-lg flex items-center justify-center mb-4 transition-colors"
                      style={{ backgroundColor: 'color-mix(in srgb, var(--primary), transparent 90%)' }}
                    >
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Made with ✨ for shiny hunters</p>
        </div>
      </footer>
    </div>
  );
}
