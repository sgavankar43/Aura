import { UserPlus } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthShell } from '@/components/auth/AuthShell';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError, apiFetch } from '@/lib/api';
import type { User } from '@/types/domain';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiFetch<{ token?: string; user?: User; message?: string }>(
        '/auth/register',
        {
          method: 'POST',
          body: JSON.stringify({ name, email, password }),
          skipAuth: true,
        },
      );

      if (data.token && data.user) {
        login(data.token, data.user);
        navigate('/projects');
        return;
      }

      navigate('/login', {
        state: { message: data.message ?? 'Registration successful. Please sign in.' },
      });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Registration failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your workspace"
      subtitle="Register to run a distributed feature-flag control plane with audit history."
    >
      <Card variant="terminal" className="shadow-neon-sm" data-testid="register-card">
        <CardContent className="p-8 pt-4">
          <div className="mb-6 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center border border-accent bg-accent/10 text-accent cyber-chamfer-sm">
              <UserPlus className="h-6 w-6" aria-hidden />
            </div>
          </div>

          {error ? (
            <div className="mb-4 cyber-chamfer-sm border border-destructive bg-destructive/10 px-4 py-3 font-mono text-sm uppercase text-destructive">
              {error}
            </div>
          ) : null}

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="reg-name">Name</Label>
              <Input
                id="reg-name"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                data-testid="register-name"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="reg-email">Email</Label>
              <Input
                id="reg-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                data-testid="register-email"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="reg-password">Password</Label>
              <Input
                id="reg-password"
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                data-testid="register-password"
              />
            </div>
            <Button
              type="submit"
              variant="glitch"
              className="w-full mt-4"
              disabled={loading}
              data-testid="register-submit"
            >
              {loading ? 'INITIALIZING...' : 'INITIALIZE PROTOCOL'}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm font-mono text-muted-foreground uppercase">
            Already active?{' '}
            <Link
              to="/login"
              className="font-bold text-accent hover:underline hover:text-accentSecondary transition-colors"
            >
              Access Terminal
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
