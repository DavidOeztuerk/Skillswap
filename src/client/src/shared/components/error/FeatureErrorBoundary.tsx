import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Refresh } from '@mui/icons-material';
import { Box, Alert, AlertTitle, Button } from '@mui/material';

interface Props {
  children: ReactNode;
  featureName?: string;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Feature-level Error Boundary for catching errors within specific components/features
 */
class FeatureErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error for debugging
    console.error(
      `Feature Error Boundary (${this.props.featureName ?? 'Unknown Feature'}):`,
      error,
      errorInfo
    );

    // Call custom error handler if provided
    if (this.props.onError !== undefined) {
      this.props.onError(error, errorInfo);
    }

    // Log to error tracking service
    this.logError(error, errorInfo);
  }

  private logError = (error: Error, errorInfo: ErrorInfo): void => {
    const errorData = {
      type: 'FEATURE_ERROR',
      feature: this.props.featureName ?? 'Unknown',
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    };

    console.error('Feature Error logged:', errorData);
    // Future: send to error tracking service (e.g., Sentry) when configured
  };

  private handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: undefined,
    });
  };

  override render(): React.ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback !== undefined) {
        return this.props.fallback;
      }

      return (
        <Box sx={{ my: 2 }}>
          <Alert
            severity="warning"
            action={
              <Button
                color="inherit"
                size="small"
                onClick={this.handleRetry}
                startIcon={<Refresh />}
              >
                Retry
              </Button>
            }
          >
            <AlertTitle>Feature Unavailable</AlertTitle>
            {this.props.featureName ? (
              <>The {this.props.featureName} feature is temporarily unavailable. </>
            ) : null}
            Please try again or refresh the page.
          </Alert>

          {process.env.NODE_ENV === 'development' && this.state.error !== undefined && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <details>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                  Error Details (Development)
                </summary>
                <pre style={{ marginTop: '8px', fontSize: '12px', overflow: 'auto' }}>
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            </Box>
          )}
        </Box>
      );
    }

    return this.props.children;
  }
}

export default FeatureErrorBoundary;
