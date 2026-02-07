import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, Calculator, Search, Grid3X3, Crosshair, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { useRandomColor } from '@/lib/random-color-context';

export default function Index() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { accentColor } = useRandomColor();

  useEffect(() => {
    if (!loading && user) {
      navigate('/counter');
    }
  }, [user, loading, navigate]);

  const features = [
    {
      icon: Calculator,
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
          style={{
            background: `linear-gradient(to bottom right, color-mix(in srgb, ${accentColor}, transparent 90%), transparent, color-mix(in srgb, ${accentColor}, transparent 95%))`
          }}
        />

        <div className="container mx-auto px-4 py-20 relative">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <div className="flex justify-center">
              <div className="relative">
                <Sparkles className="h-20 w-20 animate-pulse" style={{ color: accentColor }} />
                <div
                  className="absolute inset-0 blur-xl"
                  style={{ backgroundColor: `color-mix(in srgb, ${accentColor}, transparent 70%)` }}
                />
              </div>
            </div>

            <h1 className="text-5xl sm:text-6xl font-bold">
              <span
                className="font-bold bg-clip-text text-transparent bg-gradient-to-r"
                style={{
                  backgroundImage: `linear-gradient(to right, ${accentColor}, color-mix(in srgb, ${accentColor}, white 30%))`
                }}
              >
                PokeShinyTracker
              </span>
            </h1>

            {/* Removed text as requested */}
            <div className="h-4"></div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button
                  size="lg"
                  style={{
                    backgroundColor: accentColor,
                    borderColor: accentColor,
                    boxShadow: `0 0 20px ${accentColor}40`
                  }}
                  className="hover:opacity-90 transition-opacity"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/counter">
                <Button
                  size="lg"
                  variant="outline"
                  style={{
                    borderColor: accentColor,
                    color: accentColor,
                    backgroundColor: 'transparent'
                  }}
                  className="hover:shadow-lg transition-shadow bg-transparent hover:bg-transparent focus:ring-0 active:bg-transparent focus:bg-transparent"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = `0 0 20px ${accentColor}40`;
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = accentColor;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '';
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = accentColor;
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  onTouchStart={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
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
                <Card
                  className="h-full transition-all cursor-pointer group"
                  style={{
                    borderColor: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = accentColor;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                >
                  <CardHeader>
                    <div
                      className="h-12 w-12 rounded-lg flex items-center justify-center mb-4 transition-colors"
                      style={{ backgroundColor: `color-mix(in srgb, ${accentColor}, transparent 90%)` }}
                    >
                      <Icon className="h-6 w-6" style={{ color: accentColor }} />
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
          {/* Footer content removed as requested */}
        </div>
      </footer>
    </div>
  );
}
