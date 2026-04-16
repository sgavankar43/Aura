import { cn } from '@/lib/utils';

export const buttonVariants = ({
  variant = 'default',
  size = 'default',
  className,
}: {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'glitch';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
} = {}) =>
  cn(
    // Base Cyberpunk Button Styles
    'inline-flex items-center justify-center gap-2 whitespace-nowrap font-mono uppercase tracking-wider transition-all duration-150 cyber-chamfer-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 text-sm font-bold',
    {
      default:
        'bg-transparent border-2 border-accent text-accent hover:bg-accent hover:text-background hover:shadow-neon',
      secondary:
        'bg-transparent border-2 border-secondary text-secondary hover:bg-secondary hover:text-background hover:shadow-neon-secondary',
      outline:
        'border border-border bg-transparent hover:border-accent hover:text-accent hover:shadow-neon',
      ghost: 'hover:bg-accent/10 hover:text-accent',
      destructive:
        'bg-transparent border-2 border-destructive text-destructive hover:bg-destructive hover:text-foreground hover:shadow-neon',
      glitch: 'bg-accent text-background hover:brightness-110 cyber-glitch-text',
    }[variant || 'default'],
    {
      default: 'h-11 px-6 py-2',
      sm: 'h-9 px-4 text-xs',
      lg: 'h-12 px-8 text-base',
      icon: 'h-11 w-11',
    }[size || 'default'],
    className,
  );
