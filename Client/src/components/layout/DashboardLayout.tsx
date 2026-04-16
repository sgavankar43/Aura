import {
  Activity,
  Boxes,
  Flag,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  ScrollText,
  Settings,
  Sun,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useHealth } from '@/hooks/queries';
import { cn } from '@/lib/utils';
function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggle = () => {
    const next = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('aura-theme', next ? 'dark' : 'light');
    setDark(next);
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      data-testid="theme-toggle"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

function HealthBadge() {
  const { data, isError, isPending } = useHealth();

  if (isPending) {
    return (
      <span
        className="inline-flex items-center gap-2 text-xs text-muted-foreground"
        data-testid="health-status"
      >
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground" />
        Checking API…
      </span>
    );
  }

  if (isError || !data) {
    return (
      <span
        className="inline-flex items-center gap-2 text-xs text-destructive"
        data-testid="health-status"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
        Control plane unreachable
      </span>
    );
  }

  const healthy = data.status === 'healthy';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 text-xs',
        healthy ? 'text-muted-foreground' : 'text-amber-600 dark:text-amber-400',
      )}
      data-testid="health-status"
    >
      <Activity className={cn('h-3.5 w-3.5', healthy && 'text-success')} />
      {healthy ? 'API healthy' : `Status: ${data.status ?? 'unknown'}`}
    </span>
  );
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-primary text-primary-foreground'
      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
  );

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  const projectMatch = location.pathname.match(/^\/projects\/([^/]+)/);
  const projectId = projectMatch?.[1];
  const insideProject = Boolean(projectId) && projectId !== undefined;

  return (
    <div className="flex min-h-screen w-full bg-background" data-testid="dashboard-layout">
      {mobileNavOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          aria-label="Close menu"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-card/80 backdrop-blur-xl transition-transform md:static md:translate-x-0',
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
        data-testid="sidebar"
      >
        <div className="flex items-center justify-between border-b border-border/60 p-5 md:block">
          <div>
            <h1 className="bg-gradient-to-r from-primary to-accent bg-clip-text text-xl font-bold text-transparent">
              Aura
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground">Feature control plane</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          <NavLink to="/projects" className={navLinkClass} data-testid="nav-projects" end>
            <LayoutDashboard className="h-4 w-4 shrink-0" />
            Projects
          </NavLink>

          {insideProject ? (
            <>
              <div className="my-2 border-t border-border/60 pt-2">
                <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  This project
                </p>
              </div>
              <NavLink
                to={`/projects/${projectId}`}
                className={navLinkClass}
                data-testid="nav-flags"
                end
              >
                <Flag className="h-4 w-4 shrink-0" />
                Feature flags
              </NavLink>
              <NavLink
                to={`/projects/${projectId}/environments`}
                className={navLinkClass}
                data-testid="nav-environments"
              >
                <Boxes className="h-4 w-4 shrink-0" />
                Environments
              </NavLink>
              <NavLink
                to={`/projects/${projectId}/audit`}
                className={navLinkClass}
                data-testid="nav-audit"
              >
                <ScrollText className="h-4 w-4 shrink-0" />
                Audit log
              </NavLink>
              <NavLink
                to={`/projects/${projectId}/settings`}
                className={navLinkClass}
                data-testid="nav-settings"
              >
                <Settings className="h-4 w-4 shrink-0" />
                Settings
              </NavLink>
            </>
          ) : null}
        </nav>

        <div className="border-t border-border/60 p-3">
          <div className="flex items-center gap-2 rounded-lg bg-muted/40 p-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user?.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 text-muted-foreground hover:text-destructive"
              onClick={logout}
              title="Sign out"
              data-testid="logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur-md md:h-16 md:px-8">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open menu"
            data-testid="mobile-menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <HealthBadge />
          </div>
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
