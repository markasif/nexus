import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';
import { Shield, User, ArrowRight, Loader2 } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    
    await login(email, password, selectedRole);
    navigate('/dashboard');
  };

  const handleDemoLogin = async (role: UserRole) => {
    setSelectedRole(role);
    const demoEmail = role === 'admin' ? 'admin@nexus.com' : 'employee@nexus.com';
    await login(demoEmail, 'demo', role);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-nexus-dark via-nexus-primary to-nexus-secondary">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
      
      <div className="relative flex min-h-screen flex-col items-center justify-center p-4">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-3 animate-fade-in">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-nexus-highlight shadow-glow">
            <span className="text-xl font-bold text-nexus-dark">N</span>
          </div>
          <span className="text-3xl font-bold text-nexus-surface">NEXUS</span>
        </div>

        <Card className="w-full max-w-md animate-slide-up border-0 shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>
              Select your role to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Role Selection */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setSelectedRole('admin')}
                className={`group relative flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all duration-200 ${
                  selectedRole === 'admin'
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                }`}
              >
                <div className={`flex h-14 w-14 items-center justify-center rounded-xl transition-colors ${
                  selectedRole === 'admin' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                }`}>
                  <Shield className="h-7 w-7" />
                </div>
                <div>
                  <p className="font-semibold">Super Admin</p>
                  <p className="text-xs text-muted-foreground">Full access</p>
                </div>
              </button>

              <button
                onClick={() => setSelectedRole('employee')}
                className={`group relative flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all duration-200 ${
                  selectedRole === 'employee'
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                }`}
              >
                <div className={`flex h-14 w-14 items-center justify-center rounded-xl transition-colors ${
                  selectedRole === 'employee' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                }`}>
                  <User className="h-7 w-7" />
                </div>
                <div>
                  <p className="font-semibold">Employee</p>
                  <p className="text-xs text-muted-foreground">Operator access</p>
                </div>
              </button>
            </div>

            {/* Login Form */}
            {selectedRole && (
              <form onSubmit={handleLogin} className="space-y-4 animate-slide-up">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={selectedRole === 'admin' ? 'admin@nexus.com' : 'employee@nexus.com'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* Demo Login */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Quick Demo Access</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDemoLogin('admin')}
                disabled={isLoading}
              >
                <Shield className="mr-2 h-4 w-4" />
                Demo Admin
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDemoLogin('employee')}
                disabled={isLoading}
              >
                <User className="mr-2 h-4 w-4" />
                Demo Employee
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-sm text-nexus-light/60 animate-fade-in">
          Integrated Business Management System
        </p>
      </div>
    </div>
  );
}
