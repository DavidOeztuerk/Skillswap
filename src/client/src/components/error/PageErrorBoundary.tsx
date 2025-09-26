// src/components/error/PageErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Button, Typography, Paper, Alert } from '@mui/material';
import { Refresh, Home } from '@mui/icons-material';

interface Props {
  children: ReactNode;
  pageName?: string;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Page-level Error Boundary for catching errors within specific pages
 */
class PageErrorBoundary extends Component<Props, State> {
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
    console.error(`Page Error Boundary (${this.props.pageName || 'Unknown Page'}):`, error, errorInfo);
    
    // Log to error tracking service
    this.logError(error, errorInfo);
  }

  private logError = (error: Error, errorInfo: ErrorInfo) => {
    const errorData = {
      type: 'PAGE_ERROR',
      page: this.props.pageName || 'Unknown',
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    };

    console.error('Page Error logged:', errorData);
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
    });
  };

  private handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 4 }}>
          <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
            <Alert severity="error" sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Page Error
              </Typography>
              <Typography variant="body2">
                Something went wrong on this page. You can try refreshing or go back to the dashboard.
              </Typography>
            </Alert>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="caption" component="pre" sx={{ textAlign: 'left', overflow: 'auto' }}>
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                onClick={this.handleRetry}
                startIcon={<Refresh />}
                size="small"
              >
                Try Again
              </Button>
              
              <Button
                variant="outlined"
                onClick={this.handleGoHome}
                startIcon={<Home />}
                size="small"
              >
                Go to Dashboard
              </Button>
            </Box>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default PageErrorBoundary;