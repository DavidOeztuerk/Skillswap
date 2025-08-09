import { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Button, Typography, Container, Paper, Chip, LinearProgress } from '@mui/material';
import { ErrorOutline, Refresh, Home, History, BugReport } from '@mui/icons-material';
import errorService from '../../services/errorService';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId: string;
  errorCount: number;
  isRecovering: boolean;
  lastErrorTime?: Date;
}

/**
 * Global Error Boundary that catches all unhandled errors in the application
 */
class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorId: '',
      errorCount: 0,
      isRecovering: false,
    };
    
    // Load error history from sessionStorage
    this.loadErrorHistory();
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    const errorCount = parseInt(sessionStorage.getItem('errorCount') || '0') + 1;
    sessionStorage.setItem('errorCount', errorCount.toString());
    
    return {
      hasError: true,
      error,
      errorId: `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      errorCount,
      lastErrorTime: new Date(),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Global Error Boundary caught an error:', error, errorInfo);
    }

    // Use centralized error service
    errorService.handleComponentError(
      error, 
      { componentStack: errorInfo.componentStack || '' },
      'GlobalErrorBoundary'
    );

    // Store error details for recovery
    this.storeErrorDetails(error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });
  }

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private loadErrorHistory = () => {
    const errorCount = parseInt(sessionStorage.getItem('errorCount') || '0');
    if (errorCount > 0) {
      this.setState({ errorCount });
    }
  };

  private storeErrorDetails = (error: Error, errorInfo: ErrorInfo) => {
    const errorHistory = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      errorId: this.state.errorId,
    };
    
    sessionStorage.setItem('lastError', JSON.stringify(errorHistory));
  };

  private clearErrorHistory = () => {
    sessionStorage.removeItem('errorCount');
    sessionStorage.removeItem('lastError');
    this.setState({ errorCount: 0 });
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: '',
      isRecovering: true,
    });

    // Clear recovery state after a short delay
    setTimeout(() => {
      this.setState({ isRecovering: false });
    }, 500);
  };

  private handleHardReset = () => {
    this.clearErrorHistory();
    // Clear all storage and reload
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/';
  };

  render() {
    const { hasError, isRecovering, errorCount } = this.state;
    
    // Show recovery spinner briefly
    if (isRecovering) {
      return (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh' 
        }}>
          <LinearProgress sx={{ width: 200 }} />
        </Box>
      );
    }
    
    if (hasError) {
      const isFrequentError = errorCount > 3;
      
      return (
        <Container maxWidth="md">
          <Box
            sx={{
              minHeight: '100vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              py: 4,
            }}
          >
            <Paper
              elevation={3}
              sx={{
                p: 4,
                textAlign: 'center',
                maxWidth: 600,
                width: '100%',
              }}
            >
              <ErrorOutline
                sx={{
                  fontSize: 64,
                  color: isFrequentError ? 'warning.main' : 'error.main',
                  mb: 2,
                }}
              />
              
              <Typography variant="h4" gutterBottom color="error">
                {isFrequentError ? 'Multiple Errors Detected' : 'Something went wrong'}
              </Typography>
              
              {isFrequentError && (
                <Chip 
                  label={`${errorCount} errors in this session`} 
                  color="warning" 
                  size="small"
                  sx={{ mb: 2 }}
                />
              )}
              
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {isFrequentError 
                  ? 'The application is experiencing multiple issues. A hard reset might help.'
                  : "We're sorry, but something unexpected happened. Our team has been notified."}
              </Typography>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Paper
                  sx={{
                    p: 2,
                    mb: 3,
                    bgcolor: 'grey.100',
                    textAlign: 'left',
                    overflow: 'auto',
                    maxHeight: 200,
                  }}
                >
                  <Typography variant="caption" color="error" component="pre">
                    {this.state.error.message}
                    {'\n\n'}
                    {this.state.error.stack}
                  </Typography>
                </Paper>
              )}

              <Typography variant="caption" color="text.disabled" sx={{ mb: 3, display: 'block' }}>
                Error ID: {this.state.errorId}
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  onClick={this.handleRetry}
                  startIcon={<Refresh />}
                >
                  Try Again
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={this.handleGoHome}
                  startIcon={<Home />}
                >
                  Go Home
                </Button>
                
                {isFrequentError && (
                  <Button
                    variant="outlined"
                    color="warning"
                    onClick={this.handleHardReset}
                    startIcon={<History />}
                  >
                    Hard Reset
                  </Button>
                )}
                
                {process.env.NODE_ENV === 'development' && (
                  <Button
                    variant="text"
                    onClick={() => console.log(this.state)}
                    startIcon={<BugReport />}
                  >
                    Debug Info
                  </Button>
                )}
              </Box>
            </Paper>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;