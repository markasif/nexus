
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { TypewriterEffect } from '@/components/ui/TypewriterEffect';
import { GlassCard } from '@/components/ui/GlassCard';


export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Input Validation
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setIsLoggingIn(true);

    try {
      await login(email, password);
      // Navigation is handled by auth state change or in AuthContext usually, 
      // but keeping it here as per existing pattern for explicit redirect after success.
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to login');
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* Left Side: Unchanged */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between bg-nexus-dark p-12 text-white relative overflow-hidden">
        {/* ... (Previous visual content remains the same, assuming it's outside this block but I need to be careful with replace_file_content range if I don't select everything.
             I will select the function body up to the return statement start to inject state, and then the button area.
             Actually, better to replace the whole component to be safe given the distributed changes.)
        */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-nexus-primary rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-nexus-secondary rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-transparent">
              <img src="/logo.png" alt="Nexus Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-2xl font-bold tracking-tight">NEXUS ERP</span>
          </div>
        </div>

        <div className="relative z-10 max-w-lg mb-20 space-y-6">
          <h1 className="text-5xl font-bold leading-tight tracking-tight">
            The Smart Way to <br />
            <TypewriterEffect
              words={["Manage Business", "Track Growth", "Empower Teams", "Scale Faster"]}
              className="text-nexus-highlight"
              cursorClassName="bg-nexus-highlight"
            />
          </h1>
          <p className="text-lg text-nexus-light/80 leading-relaxed max-w-md">
            Streamline your operations with our all-in-one platform.
            Experience the future of enterprise resource planning today.
          </p>

          <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-white/10">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-nexus-highlight" />
              <span className="text-sm font-medium text-white/90">Real-time Analytics</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-nexus-highlight" />
              <span className="text-sm font-medium text-white/90">Inventory Management</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-nexus-highlight" />
              <span className="text-sm font-medium text-white/90">HR Automation</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-nexus-highlight" />
              <span className="text-sm font-medium text-white/90">Sales Tracking</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-white/40">
          © 2024 Nexus Enterprise. All rights reserved.
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background relative">
        <div className="absolute inset-0 bg-nexus-surface/30 pointer-events-none"></div>

        <GlassCard className="w-full max-w-md border-nexus-bg-tint/50 shadow-2xl relative z-10 bg-white/60 dark:bg-black/40 backdrop-blur-xl" hoverEffect={false}>
          <CardHeader className="text-center space-y-2 pb-8">
            <div className="lg:hidden flex justify-center mb-4">
              <img src="/logo.png" alt="Nexus Logo" className="h-12 w-12 rounded-xl shadow-lg shadow-nexus-primary/30" />
            </div>
            <CardTitle className="text-3xl font-bold text-nexus-dark">Welcome Back</CardTitle>
            <CardDescription className="text-base">
              Securely access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 px-8 pb-8">

            {/* Login Form */}
            <div className="space-y-5">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-600 text-center">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-muted-foreground/80 ml-1">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 bg-white/50 border-nexus-bg-tint/50 focus:border-nexus-primary focus:ring-nexus-primary/20 rounded-lg transition-all"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-xs font-medium uppercase tracking-wider text-muted-foreground/80 ml-1">Password</Label>
                  <a href="#" className="text-xs text-nexus-primary hover:text-nexus-dark font-medium transition-colors">Forgot?</a>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 bg-white/50 border-nexus-bg-tint/50 focus:border-nexus-primary focus:ring-nexus-primary/20 rounded-lg transition-all"
                />
              </div>

              <Button
                onClick={handleLogin}
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-nexus-primary to-nexus-secondary hover:from-nexus-dark hover:to-nexus-primary shadow-lg shadow-nexus-primary/25 rounded-lg transition-all duration-300 hover:scale-[1.01] hover:shadow-xl hover:shadow-nexus-primary/20 mt-2"
                disabled={isLoading || isLoggingIn}
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Authenticating...
                  </>
                ) : isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Initializing...
                  </>
                ) : (
                  <>
                    Sign In to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </div>

          </CardContent>
        </GlassCard>
      </div>
    </div>
  );
}
