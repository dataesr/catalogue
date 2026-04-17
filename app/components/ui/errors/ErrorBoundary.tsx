import { Component, type ErrorInfo, type ReactNode, useEffect, useRef } from 'react';
import { useLocation } from 'react-router';
import { Error403 } from './Error403';
import { Error404 } from './Error404';
import { Error500 } from './Error500';

interface ErrorFallbackProps {
  error: Error;
}

export interface ErrorStatusResolver {
  getStatus: (error: Error) => number | null;
}

function DefaultErrorFallback({
  error,
  resolver,
}: ErrorFallbackProps & { resolver?: ErrorStatusResolver }) {
  const status = resolver?.getStatus(error);

  if (status === 403) return <Error403 />;
  if (status === 404) return <Error404 />;

  return <Error500 />;
}

interface Props {
  children: ReactNode;
  fallback?: ReactNode | ((props: ErrorFallbackProps) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resolver?: ErrorStatusResolver;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  override render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback({ error: this.state.error });
        }
        return this.props.fallback;
      }

      return <DefaultErrorFallback error={this.state.error} resolver={this.props.resolver} />;
    }

    return this.props.children;
  }
}

function ErrorBoundaryWithRouteReset(props: Props) {
  const location = useLocation();
  const errorBoundaryRef = useRef<ErrorBoundaryClass>(null);
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname;
      errorBoundaryRef.current?.resetError();
    }
  }, [location.pathname]);

  return <ErrorBoundaryClass ref={errorBoundaryRef} {...props} />;
}

export function ErrorBoundary(props: Props) {
  return <ErrorBoundaryWithRouteReset {...props} />;
}

export default ErrorBoundary;
