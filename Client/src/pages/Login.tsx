import { Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthShell } from '@/components/auth/AuthShell';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError, apiFetch } from '@/lib/api';
import type { User } from '@/types/domain';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    const msg = (location.state as { message?: string } | null)?.message;
    if (msg) {
      setFlash(msg);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiFetch<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        skipAuth: true,
      });
      login(data.token, data.user);
      navigate('/projects');
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Sign in failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to manage feature flags and environments across your systems."
    >
      <Card variant="terminal" className="shadow-neon-sm" data-testid="login-card">
        <CardContent className="p-8 pt-4">
          <div className="mb-6 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center border border-accent bg-accent/10 text-accent cyber-chamfer-sm">
              <Shield className="h-6 w-6" aria-hidden />
            </div>
          </div>

          {flash ? (
            <div className="mb-4 cyber-chamfer-sm border border-success bg-success/10 px-4 py-3 font-mono text-sm uppercase text-success">
              {flash}
            </div>
          ) : null}

          {error ? (
            <div className="mb-4 cyber-chamfer-sm border border-destructive bg-destructive/10 px-4 py-3 font-mono text-sm uppercase text-destructive">
              {error}
            </div>
          ) : null}

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                data-testid="login-email"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                data-testid="login-password"
              />
            </div>
            <Button
              type="submit"
              variant="glitch"
              className="w-full mt-4"
              disabled={loading}
              data-testid="login-submit"
            >
              {loading ? 'SIGNING IN...' : 'SIGN IN'}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm font-mono text-muted-foreground uppercase">
            No account?{' '}
            <Link
              to="/register"
              className="font-bold text-accent hover:underline hover:text-accentSecondary transition-colors"
            >
              Request Access
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
