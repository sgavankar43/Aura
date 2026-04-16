import { FileQuestion } from 'lucide-react';
import { Link } from 'react-router-dom';
import { buttonVariants } from '@/components/ui/button-variants';
import { cn } from '@/lib/utils';

export default function NotFound() {
  return (
    <div
      data-testid="not-found"
      className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <FileQuestion className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">Page not found</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          The route does not exist or you may not have access. Head back to the control plane.
        </p>
      </div>
      <Link to="/projects" className={cn(buttonVariants())}>
        Back to projects
      </Link>
    </div>
  );
}
