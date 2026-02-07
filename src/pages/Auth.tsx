import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Sparkles, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { getSupabaseConfigErrorMessage, isSupabaseConfigured } from '@/integrations/supabase/client';
import { useRandomColor } from '@/lib/random-color-context';
import { cn } from '@/lib/utils';

// --- Custom Floating Label Input Component ---
interface FloatingLabelInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ElementType;
  error?: string;
  accentColor: string;
}

const FloatingInput = ({ label, icon: Icon, error, accentColor, className, value, ...props }: FloatingLabelInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value && String(value).length > 0;

  return (
    <div className="relative group">
      <div
        className={cn(
          "flex items-center border-2 rounded-xl transition-all duration-300 bg-background/50 overflow-hidden",
          (isFocused || hasValue) ? "bg-background shadow-lg" : "border-transparent bg-secondary/30 hover:bg-secondary/50",
          error ? "border-destructive/50" : (isFocused ? "" : "border-transparent"),
          className
        )}
        style={{
          borderColor: error ? undefined : (isFocused ? accentColor : 'transparent'),
          boxShadow: isFocused ? `0 4px 20px -5px ${accentColor}40` : 'none'
        }}
      >
        {Icon && (
          <div className="pl-4 pr-2 text-muted-foreground transition-colors" style={{ color: isFocused ? accentColor : undefined }}>
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div className="relative w-full h-14 pt-4">
          <Input
            {...props}
            value={value}
            className="border-0 shadow-none focus-visible:ring-0 bg-transparent h-full pb-2 px-3 text-base"
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
          />
          <Label
            className={cn(
              "absolute left-3 transition-all duration-200 pointer-events-none text-muted-foreground",
              (isFocused || hasValue)
                ? "top-1 text-xs font-semibold"
                : "top-1/2 -translate-y-1/2 text-base"
            )}
            style={{ color: (isFocused) ? accentColor : undefined }}
          >
            {label}
          </Label>
        </div>
      </div>
      {error && <p className="text-xs text-destructive mt-1.5 ml-1 font-medium animate-in slide-in-from-top-1">{error}</p>}
    </div>
  );
};

const authSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signIn, signUp } = useAuth();
  const { accentColor } = useRandomColor();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const supabaseConfigError = getSupabaseConfigErrorMessage();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/counter');
    }
  }, [user, navigate]);

  const validateForm = () => {
    try {
      authSchema.parse({ email, password });
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: { email?: string; password?: string } = {};
        err.errors.forEach((error) => {
          if (error.path[0] === 'email') fieldErrors.email = error.message;
          if (error.path[0] === 'password') fieldErrors.password = error.message;
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      toast({
        variant: 'destructive',
        title: 'Supabase non configurato',
        description: supabaseConfigError ?? 'Configura Supabase per usare login e registrazione.',
      });
      return;
    }
    if (!validateForm()) return;

    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Login failed',
        description: error.message === 'Invalid login credentials'
          ? 'Invalid email or password. Please try again.'
          : error.message,
      });
    } else {
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });
      navigate('/counter');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      toast({
        variant: 'destructive',
        title: 'Supabase non configurato',
        description: supabaseConfigError ?? 'Configura Supabase per usare login e registrazione.',
      });
      return;
    }
    if (!validateForm()) return;

    setLoading(true);
    const { error } = await signUp(email, password);
    setLoading(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Registration failed',
        description: error.message,
      });
    } else {
      toast({
        title: 'Account created!',
        description: 'Please check your email to verify your account.',
      });
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background">

      {/* LEFT SIDE - FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12 relative overflow-hidden">
        {/* Mobile Background Elements */}
        <div
          className="lg:hidden absolute top-[-20%] right-[-20%] w-[80vw] h-[80vw] rounded-full blur-[100px] opacity-20 pointer-events-none transition-colors duration-1000"
          style={{ backgroundColor: accentColor }}
        />

        <div className="w-full max-w-sm space-y-8 z-10">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center p-4 rounded-3xl bg-secondary/30 mb-4 backdrop-blur-sm border border-white/5">
              <Sparkles className="w-8 h-8 transition-colors duration-500" style={{ color: accentColor }} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Benvenuto</h1>
            <p className="text-muted-foreground">Accedi per gestire la tua collezione shiny</p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-secondary/30 p-1 rounded-xl h-auto">
              <TabsTrigger
                value="login"
                className="rounded-lg py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                Login
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="rounded-lg py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                Registrati
              </TabsTrigger>
            </TabsList>

            <div className="relative min-h-[300px]">
              <TabsContent value="login" className="space-y-6 mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <form onSubmit={handleSignIn} className="space-y-5">
                  <FloatingInput
                    label="Email"
                    type="email"
                    icon={Mail}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    accentColor={accentColor}
                    error={errors.email}
                  />
                  <FloatingInput
                    label="Password"
                    type="password"
                    icon={Lock}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    accentColor={accentColor}
                    error={errors.password}
                  />

                  <div className="pt-4">
                    <Button
                      type="submit"
                      className="w-full h-14 text-lg font-medium shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group rounded-xl"
                      disabled={loading}
                      style={{
                        backgroundColor: accentColor,
                        boxShadow: `0 8px 25px -5px ${accentColor}50`
                      }}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Accesso in corso...
                        </>
                      ) : (
                        <span className="flex items-center gap-2">
                          Accedi
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </span>
                      )}
                    </Button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="register" className="space-y-6 mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <form onSubmit={handleSignUp} className="space-y-5">
                  <FloatingInput
                    label="Email"
                    type="email"
                    icon={Mail}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    accentColor={accentColor}
                    error={errors.email}
                  />
                  <FloatingInput
                    label="Password"
                    type="password"
                    icon={Lock}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    accentColor={accentColor}
                    error={errors.password}
                  />

                  <div className="pt-4">
                    <Button
                      type="submit"
                      className="w-full h-14 text-lg font-medium shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group rounded-xl"
                      disabled={loading}
                      style={{
                        backgroundColor: accentColor,
                        boxShadow: `0 8px 25px -5px ${accentColor}50`
                      }}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Creazione account...
                        </>
                      ) : (
                        <span className="flex items-center gap-2">
                          Crea Account
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </span>
                      )}
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </div>
          </Tabs>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Tutti i tuoi progressi sono salvati nel cloud sicuro.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE - HERO (Desktop only) */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden items-center justify-center bg-black">
        {/* Dynamic Background */}
        <div
          className="absolute inset-0 transition-colors duration-1000 opacity-20"
          style={{ backgroundColor: accentColor }}
        />

        {/* Animated Orbs */}
        <div
          className="absolute top-[10%] left-[10%] w-[40vw] h-[40vw] rounded-full blur-[150px] opacity-40 animate-pulse transition-colors duration-1000"
          style={{ backgroundColor: accentColor, animationDuration: '4s' }}
        />
        <div
          className="absolute bottom-[10%] right-[10%] w-[30vw] h-[30vw] rounded-full blur-[120px] opacity-30 animate-pulse transition-colors duration-1000"
          style={{ backgroundColor: accentColor, animationDelay: '2s', animationDuration: '6s' }}
        />

        {/* Content Overlay */}
        <div className="relative z-10 max-w-lg text-center p-12 backdrop-blur-3xl bg-black/20 rounded-3xl border border-white/10 shadow-2xl">
          <h2 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-white to-white/60 mb-6">
            PokeShinyTracker
          </h2>
          <p className="text-xl text-white/80 leading-relaxed">
            La piattaforma definitiva per cacciatori di shiny.
            Sincronizza, traccia e completa il tuo Pokédex shiny.
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {['Cloud Sync', 'Multi-Counter', 'Stats', 'Collection'].map((tag) => (
              <span
                key={tag}
                className="px-4 py-2 rounded-full bg-white/10 border border-white/10 text-white/90 text-sm font-medium backdrop-blur-md"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
