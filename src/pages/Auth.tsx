import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { Sparkles, Mail, Lock, Loader2, ArrowRight, ChevronLeft } from 'lucide-react';
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
    <div className="relative group w-full">
      <div
        className={cn(
          "flex items-center border-2 rounded-2xl transition-all duration-300 bg-background/30 backdrop-blur-md overflow-hidden",
          (isFocused || hasValue) ? "bg-background/80 shadow-lg border-opacity-100" : "border-transparent bg-white/5 hover:bg-white/10",
          error ? "border-destructive/50" : (isFocused ? "" : "border-white/10"),
          className
        )}
        style={{
          borderColor: error ? undefined : (isFocused ? accentColor : undefined),
          boxShadow: isFocused ? `0 0 20px -5px ${accentColor}60` : 'none'
        }}
      >
        {Icon && (
          <div className="pl-4 pr-1 text-muted-foreground transition-colors duration-300" style={{ color: isFocused ? accentColor : undefined }}>
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div className="relative w-full h-16 pt-5">
          <Input
            {...props}
            value={value}
            className="border-0 shadow-none focus-visible:ring-0 bg-transparent h-full pb-2 px-3 text-base placeholder:opacity-0"
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
              "absolute left-3 transition-all duration-300 pointer-events-none text-muted-foreground/70",
              (isFocused || hasValue)
                ? "top-1.5 text-[10px] font-bold uppercase tracking-wider translate-y-0"
                : "top-1/2 -translate-y-1/2 text-base"
            )}
            style={{ color: (isFocused) ? accentColor : undefined }}
          >
            {label}
          </Label>
        </div>
      </div>
      {error && <p className="text-[10px] text-destructive mt-1 ml-2 font-bold uppercase tracking-tighter animate-in fade-in slide-in-from-top-1">{error}</p>}
    </div>
  );
};

const authSchema = z.object({
  email: z.string().email('Inserisci un email valida'),
  password: z.string().min(6, 'Minimo 6 caratteri'),
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
      toast({ variant: 'destructive', title: 'Supabase non configurato', description: supabaseConfigError ?? 'Configura Supabase.' });
      return;
    }
    if (!validateForm()) return;
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Accesso fallito', description: error.message === 'Invalid login credentials' ? 'Credenziali non valide.' : error.message });
    } else {
      toast({ title: 'Bentornato!', description: 'Accesso effettuato con successo.' });
      navigate('/counter');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      toast({ variant: 'destructive', title: 'Supabase non configurato', description: supabaseConfigError ?? 'Configura Supabase.' });
      return;
    }
    if (!validateForm()) return;
    setLoading(true);
    const { error } = await signUp(email, password);
    setLoading(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Errore registrazione', description: error.message });
    } else {
      toast({ title: 'Account creato!', description: 'Controlla la tua email per verificare l\'account.' });
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-2 sm:p-4 bg-[#0a0a0a] overflow-hidden">

      {/* Immersive Animated Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Primary Glowing Orb */}
        <div
          className="absolute -top-[10%] -left-[10%] w-[60vw] h-[60vw] rounded-full blur-[120px] opacity-20 animate-pulse transition-colors duration-1000"
          style={{ backgroundColor: accentColor, animationDuration: '8s' }}
        />
        {/* Secondary Glowing Orb */}
        <div
          className="absolute -bottom-[20%] -right-[10%] w-[70vw] h-[70vw] rounded-full blur-[150px] opacity-15 animate-pulse transition-colors duration-1000"
          style={{ backgroundColor: accentColor, animationDelay: '3s', animationDuration: '12s' }}
        />
        {/* Mesh Gradient Overlay */}
        <div className="absolute inset-0 opacity-30 mix-blend-overlay"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, ${accentColor}20 0%, transparent 60%)`
          }}
        />
      </div>

      {/* Back to Home Link */}
      <Link to="/" className="absolute top-8 left-8 z-50 flex items-center gap-2 text-white/50 hover:text-white transition-colors group">
        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Torna alla Home</span>
      </Link>

      {/* Auth Card Container */}
      <div className="w-full max-w-md z-10 animate-in fade-in zoom-in-95 duration-700">

        {/* Brand Header */}
        <div className="text-center mb-4 space-y-2">
          <div className="inline-flex items-center justify-center p-4 rounded-[2rem] bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl mb-1 relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <Sparkles className="w-10 h-10 transition-all duration-700 group-hover:scale-110 group-hover:rotate-12" style={{ color: accentColor }} />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tighter text-white drop-shadow-2xl">
              PokeShiny<span style={{ color: accentColor }}>Tracker</span>
            </h1>
          </div>
        </div>

        {/* Main Glassmorphic Card */}
        <div className="bg-white/[0.03] backdrop-blur-[40px] border border-white/10 rounded-[2rem] p-4 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">

          {/* Subtle reflection line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-white/5 p-1 rounded-xl h-12">
              <TabsTrigger
                value="login"
                className="rounded-xl py-2 font-bold text-sm uppercase tracking-widest data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-xl transition-all"
              >
                Login
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="rounded-xl py-2 font-bold text-sm uppercase tracking-widest data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-xl transition-all"
              >
                Registrati
              </TabsTrigger>
            </TabsList>

            <div className="relative min-h-[300px]">
              <TabsContent value="login" className="space-y-6 mt-0 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <form onSubmit={handleSignIn} className="space-y-5">
                  <div className="space-y-4">
                    <FloatingInput
                      label="Indirizzo Email"
                      type="email"
                      icon={Mail}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      accentColor={accentColor}
                      error={errors.email}
                    />
                    <FloatingInput
                      label="Tua Password"
                      type="password"
                      icon={Lock}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      accentColor={accentColor}
                      error={errors.password}
                    />
                  </div>

                  <div className="pt-6">
                    <Button
                      type="submit"
                      className="w-full h-16 text-lg font-bold shadow-2xl transition-all duration-500 hover:-translate-y-1.5 active:scale-95 group rounded-2xl overflow-hidden relative"
                      disabled={loading}
                      style={{
                        backgroundColor: accentColor,
                        color: 'white',
                        boxShadow: `0 15px 35px -10px ${accentColor}80`
                      }}
                    >
                      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {loading ? (
                        <>
                          <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                          <span>Caricamento...</span>
                        </>
                      ) : (
                        <div className="flex items-center justify-center gap-3">
                          <span>Accedi</span>
                          <ArrowRight className="w-6 h-6 group-hover:translate-x-1.5 transition-transform duration-500" />
                        </div>
                      )}
                    </Button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="register" className="space-y-6 mt-0 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <form onSubmit={handleSignUp} className="space-y-5">
                  <div className="space-y-4">
                    <FloatingInput
                      label="Indirizzo Email"
                      type="email"
                      icon={Mail}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      accentColor={accentColor}
                      error={errors.email}
                    />
                    <FloatingInput
                      label="Scegli Password"
                      type="password"
                      icon={Lock}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      accentColor={accentColor}
                      error={errors.password}
                    />
                  </div>

                  <div className="pt-6">
                    <Button
                      type="submit"
                      className="w-full h-16 text-lg font-bold shadow-2xl transition-all duration-500 hover:-translate-y-1.5 active:scale-95 group rounded-2xl overflow-hidden relative"
                      disabled={loading}
                      style={{
                        backgroundColor: accentColor,
                        color: 'white',
                        boxShadow: `0 15px 35px -10px ${accentColor}80`
                      }}
                    >
                      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {loading ? (
                        <>
                          <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                          <span>Creazione...</span>
                        </>
                      ) : (
                        <div className="flex items-center justify-center gap-3">
                          <span>Registrati</span>
                          <ArrowRight className="w-6 h-6 group-hover:translate-x-1.5 transition-transform duration-500" />
                        </div>
                      )}
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </div>
          </Tabs>

          {/* Bottom security assurance */}
          <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-center gap-3 text-white/30 text-xs font-semibold uppercase tracking-widest">
            <Lock className="w-3.5 h-3.5" />
            Cloud Sincronizzato & Sicuro
          </div>
        </div>

      </div>

    </div>
  );
}
