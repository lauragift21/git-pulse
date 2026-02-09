import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional fallback to render instead of the default error UI */
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("[ErrorBoundary] Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] px-6 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bg-tertiary mb-4">
            <AlertTriangle size={24} className="text-text-secondary" />
          </div>

          <h2 className="text-lg font-semibold text-text-primary mb-1">
            Something went wrong
          </h2>
          <p className="text-sm text-text-secondary max-w-md mb-2">
            An unexpected error occurred while rendering this page.
          </p>

          {this.state.error && (
            <pre className="text-xs text-text-tertiary bg-bg-tertiary rounded-lg px-4 py-2 mb-4 max-w-lg overflow-x-auto font-mono">
              {this.state.error.message}
            </pre>
          )}

          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={this.handleReset}>
              <RefreshCw size={14} />
              Try again
            </Button>
            <Button variant="secondary" size="sm" onClick={this.handleReload}>
              Reload page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
