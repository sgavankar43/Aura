import { Layers } from 'lucide-react';
import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div data-testid="auth-shell" className="relative min-h-screen overflow-hidden bg-background">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(0,255,136,0.08),transparent)]"
        aria-hidden
      />
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
        <Link
          to="/login"
          className="mb-10 flex items-center justify-center gap-2 text-muted-foreground transition-colors hover:text-accent group font-mono tracking-widest"
        >
          <span className="flex h-10 w-10 items-center justify-center border-accent border bg-accent/10 text-accent cyber-chamfer-sm group-hover:shadow-neon transition-all duration-300">
            <Layers className="h-5 w-5" aria-hidden />
          </span>
          <span className="text-xl font-bold uppercase text-accent drop-shadow-glow">
            [ AURA_V.1.0 ]
          </span>
        </Link>
        <div className="text-center">
          <h1
            className="text-5xl font-black tracking-tight uppercase cyber-glitch-text pb-2"
            data-text={title}
          >
            {title}
          </h1>
          <p className="mt-4 text-sm font-mono text-accent/80 tracking-widest leading-relaxed uppercase">
            [ {subtitle} ]
          </p>
        </div>
        <div className="mt-10 relative cyber-corners p-[2px]">{children}</div>
      </div>
    </div>
  );
}
