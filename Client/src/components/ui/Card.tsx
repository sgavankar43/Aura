import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'terminal' | 'holographic';
  hoverEffect?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', hoverEffect = false, children, ...props }, ref) => {
    // Variant-specific classes
    const variantClasses = {
      default: cn(
        'bg-card border-border cyber-chamfer',
        hoverEffect &&
          'hover:-translate-y-[1px] hover:border-accent hover:shadow-neon transition-all duration-300',
      ),
      terminal: 'bg-background border-border cyber-chamfer',
      holographic: 'bg-muted/30 border-accent/30 shadow-neon-sm backdrop-blur-md cyber-chamfer',
    };

    return (
      <div
        ref={ref}
        className={cn('relative border text-card-foreground', variantClasses[variant], className)}
        {...props}
      >
        {variant === 'terminal' && (
          <div className="absolute top-0 left-0 right-0 h-8 bg-muted/50 border-b border-border flex items-center px-4 gap-2 z-10 cyber-chamfer-sm">
            <div className="w-3 h-3 rounded-full bg-destructive/80"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-success/80"></div>
          </div>
        )}
        <div className={cn('h-full w-full', variant === 'terminal' ? 'pt-8' : '')}>{children}</div>
      </div>
    );
  },
);
Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  ),
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        'text-lg font-heading tracking-widest text-accent uppercase leading-none',
        className,
      )}
      {...props}
    />
  ),
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-muted-foreground font-mono', className)} {...props} />
));
CardDescription.displayName = 'CardDescription';

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  ),
);
CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  ),
);
CardFooter.displayName = 'CardFooter';
