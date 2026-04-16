import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { buttonVariants } from './button-variants';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'glitch';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = 'button', children, ...props }, ref) => {
    const isStringChild = typeof children === 'string';
    const displayText = isStringChild ? `[ ${children} ]` : children;

    return (
      <button
        ref={ref}
        type={type}
        className={cn(buttonVariants({ variant, size, className }))}
        data-text={variant === 'glitch' && isStringChild ? `[ ${children} ]` : undefined}
        {...props}
      >
        {displayText}
      </button>
    );
  },
);
Button.displayName = 'Button';

export { Button };
