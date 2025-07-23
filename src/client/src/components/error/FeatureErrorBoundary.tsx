// src/components/error/FeatureErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Alert, AlertTitle, Button } from '@mui/material';
import { Refresh } from '@mui/icons-material';

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

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error for debugging
    console.error(`Feature Error Boundary (${this.props.featureName || 'Unknown Feature'}):`, error, errorInfo);
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to error tracking service
    this.logError(error, errorInfo);
  }

  private logError = (error: Error, errorInfo: ErrorInfo) => {
    const errorData = {
      type: 'FEATURE_ERROR',
      feature: this.props.featureName || 'Unknown',
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    };

    console.error('Feature Error logged:', errorData);
    // TODO: Send to error tracking service
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
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
            {this.props.featureName && (
              <>The {this.props.featureName} feature is temporarily unavailable. </>
            )}
            Please try again or refresh the page.
          </Alert>

          {process.env.NODE_ENV === 'development' && this.state.error && (
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