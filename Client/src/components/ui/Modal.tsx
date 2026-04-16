import { X } from 'lucide-react';
import { type ReactNode, useEffect, useRef } from 'react';
import { Button } from './Button';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  'data-testid'?: string;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
  'data-testid': testId,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) {
      return;
    }
    if (open) {
      if (!el.open) {
        el.showModal();
      }
    } else if (el.open) {
      el.close();
    }
  }, [open]);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) {
      return;
    }
    const onCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    el.addEventListener('cancel', onCancel);
    return () => el.removeEventListener('cancel', onCancel);
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      data-testid={testId}
      className={cn(
        'fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 cyber-chamfer border border-accent bg-background p-0 text-foreground shadow-neon-lg [&::backdrop]:bg-black/80 [&::backdrop]:backdrop-blur-sm',
        className,
      )}
      onClick={(e) => {
        if (e.target === dialogRef.current) {
          onClose();
        }
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-6 bg-muted/50 border-b border-border flex items-center px-4 gap-2 z-10 cyber-chamfer-sm">
        <div className="w-2.5 h-2.5 rounded-full bg-destructive/80"></div>
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
        <div className="w-2.5 h-2.5 rounded-full bg-success/80"></div>
      </div>
      <div className="flex flex-col border-b border-border px-6 py-4 pt-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-heading tracking-widest text-accent uppercase leading-none drop-shadow-glow">
              {title}
            </h2>
            {description ? (
              <p className="mt-2 text-sm text-muted-foreground font-mono">{description}</p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 text-accent"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X className="h-5 w-5 drop-shadow-[0_0_4px_currentColor]" />
          </Button>
        </div>
      </div>
      <div className="px-6 py-4">{children}</div>
    </dialog>
  );
}
