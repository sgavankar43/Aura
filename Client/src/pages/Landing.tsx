import { Layers, Shield, Zap, Terminal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      {/* Navigation Layer */}
      <nav className="relative z-10 flex w-full items-center justify-between px-6 py-6 border-b border-border bg-background/80 backdrop-blur-sm cyber-corners">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border border-accent bg-accent/10 text-accent cyber-chamfer-sm shadow-neon-sm">
            <Layers className="h-5 w-5" />
          </div>
          <span className="font-heading text-xl uppercase tracking-widest text-accent drop-shadow-glow">
            [ AURA ]
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login">
            <Button variant="outline" className="h-10 text-xs px-4">
              SYSTEM LOGIN
            </Button>
          </Link>
          <Link to="/register">
            <Button variant="glitch" className="h-10 text-xs hidden sm:inline-flex px-4">
              REQUEST ACCESS
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 mx-auto max-w-6xl px-4 pt-20 pb-32">
        <section className="flex flex-col items-center justify-center text-center space-y-8 py-20">
          <div className="font-mono text-sm tracking-[0.3em] text-accent/80 uppercase">
            &gt; STATUS: ONLINE // PROTOCOL INITIALIZED
          </div>
          <h1
            className="text-6xl md:text-8xl font-black uppercase tracking-tight cyber-glitch-text"
            data-text="AURA CONTROL PLANE"
          >
            AURA CONTROL PLANE
          </h1>
          <p className="max-w-2xl text-base md:text-lg font-mono text-muted-foreground uppercase tracking-widest leading-relaxed">
            [ Next-generation distributed feature flag architecture. Deploy with zero latency.
            Encrypt by default. ]
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
            <Link to="/register">
              <Button size="lg" variant="glitch" className="w-full sm:w-auto h-14 text-sm px-10">
                INITIALIZE WORKSPACE
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="default" className="w-full sm:w-auto h-14 text-sm px-10">
                ACCESS TERMINAL
              </Button>
            </Link>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="grid gap-8 md:grid-cols-3 mt-16 px-4">
          <Card
            variant="holographic"
            className="cyber-corners shadow-neon p-8 group transition-all duration-300 hover:shadow-neon-lg hover:-translate-y-1"
          >
            <div className="mb-6 flex h-14 w-14 items-center justify-center border border-accent bg-accent/5 text-accent cyber-chamfer transition-colors group-hover:bg-accent/20">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="font-heading text-xl uppercase tracking-widest text-foreground drop-shadow-glow mb-4">
              Zero Latency
            </h3>
            <p className="font-mono text-sm text-muted-foreground leading-relaxed uppercase">
              Global CDN edge deployment ensures your feature flag states resolve in under 5ms
              globally. No bottlenecks.
            </p>
          </Card>

          <Card
            variant="holographic"
            className="cyber-corners shadow-neon-secondary p-8 group border-accentSecondary/30 transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,0,255,0.6)] hover:-translate-y-1 hover:border-accentSecondary"
          >
            <div className="mb-6 flex h-14 w-14 items-center justify-center border border-accentSecondary bg-accentSecondary/5 text-accentSecondary cyber-chamfer transition-colors group-hover:bg-accentSecondary/20">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="font-heading text-xl uppercase tracking-widest text-foreground mb-4 drop-shadow-[0_0_10px_rgba(255,0,255,0.5)]">
              Encrypted Core
            </h3>
            <p className="font-mono text-sm text-muted-foreground leading-relaxed uppercase">
              End-to-end encrypted protocol data. Rollouts and rollbacks secured via deterministic
              cryptographic signing.
            </p>
          </Card>

          <Card
            variant="holographic"
            className="cyber-corners shadow-neon-tertiary p-8 group border-accentTertiary/30 transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,212,255,0.6)] hover:-translate-y-1 hover:border-accentTertiary"
          >
            <div className="mb-6 flex h-14 w-14 items-center justify-center border border-accentTertiary bg-accentTertiary/5 text-accentTertiary cyber-chamfer transition-colors group-hover:bg-accentTertiary/20">
              <Terminal className="h-6 w-6" />
            </div>
            <h3 className="font-heading text-xl uppercase tracking-widest text-foreground mb-4 drop-shadow-[0_0_10px_rgba(0,212,255,0.5)]">
              Full CLI Access
            </h3>
            <p className="font-mono text-sm text-muted-foreground leading-relaxed uppercase">
              Manage your entire architecture from the terminal. Scriptable deployment pipelines
              integrated via the Aura CLI.
            </p>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border bg-background/50 px-6 py-8 mt-12 flex flex-col md:flex-row items-center justify-between cyber-chamfer-sm mx-4 mb-4">
        <span className="font-mono text-xs text-accent uppercase tracking-widest">
          [ AURA_SYS :: VERSION 1.0.0 ]
        </span>
        <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest mt-4 md:mt-0">
          NODE: ACTIVE // LATENCY: 4MS // ENCRYPTION: AES-256
        </span>
      </footer>
    </div>
  );
}
