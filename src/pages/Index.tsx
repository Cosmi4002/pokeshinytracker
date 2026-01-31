import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, Calculator, BookOpen, Archive, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
      icon: Calculator,
      title: 'Shiny Counter',
      description: 'Track your encounters with accurate probability statistics based on your hunting method.',
      link: '/counter',
    },
    {
      icon: BookOpen,
      title: 'Shiny Pokédex',
      description: 'Browse all shiny Pokémon sprites including gender differences, regional forms, and variants.',
      link: '/pokedex',
    },
    {
      icon: Archive,
      title: 'Collection',
      description: 'Save and organize your caught shinies with details like attempts, method, and game.',
      link: '/collection',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
        
        <div className="container mx-auto px-4 py-20 relative">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <div className="flex justify-center">
              <div className="relative">
                <Sparkles className="h-20 w-20 text-primary animate-pulse" />
                <div className="absolute inset-0 blur-xl bg-primary/30" />
              </div>
            </div>
            
            <h1 className="text-5xl sm:text-6xl font-bold">
              <span className="shiny-text">PokeShinyTracker</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The ultimate shiny hunting companion. Track your encounters, 
              browse the shiny Pokédex, and save your precious catches.
            </p>
            
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
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link key={feature.title} to={feature.link}>
                <Card className="h-full hover:border-primary transition-colors cursor-pointer group">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
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
