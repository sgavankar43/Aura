import { cn } from '@/lib/utils';

export function PageLoader({ className }: { className?: string }) {
  return (
    <div
      data-testid="page-loader"
      className={cn('flex min-h-[12rem] flex-col items-center justify-center gap-3', className)}
    >
      <div
        className="h-9 w-9 animate-spin rounded-full border-2 border-muted border-t-primary"
        aria-hidden
      />
      <p className="text-sm text-muted-foreground">Loading…</p>
    </div>
  );
}
