import { AlertTriangle } from 'lucide-react';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || 'Something went wrong.' };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary', error, info.componentStack);
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          data-testid="error-boundary"
          className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/15 text-destructive">
            <AlertTriangle className="h-7 w-7" aria-hidden />
          </div>
          <div className="max-w-md text-center">
            <h1 className="text-xl font-semibold">This view crashed</h1>
            <p className="mt-2 text-sm text-muted-foreground">{this.state.message}</p>
          </div>
          <Button type="button" onClick={() => this.setState({ hasError: false, message: '' })}>
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
