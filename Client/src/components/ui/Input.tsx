import { type InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

const Input = forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => (
  <div className="relative flex items-center w-full group">
    <span className="absolute left-3 font-mono text-sm text-accent animate-blink pointer-events-none select-none">
      &gt;
    </span>
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-11 w-full border border-border bg-input pl-8 pr-3 py-2 text-sm text-accent font-mono cyber-chamfer-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus:border-accent focus:shadow-neon transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 group-hover:border-accent/50',
        className,
      )}
      {...props}
    />
  </div>
));
Input.displayName = 'Input';

export { Input };
