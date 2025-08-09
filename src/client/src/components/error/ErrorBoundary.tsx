import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Alert,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Home as HomeIcon,
  BugReport as BugIcon,
} from '@mui/icons-material';
import errorService from '../../services/errorService';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

interface ErrorBoundaryProps {
  children: ReactNode | ((hasError: boolean, error: Error | null, retry: () => void) => ReactNode);
  fallback?: ReactNode;
  showDetails?: boolean;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'page' | 'component' | 'section';
}

interface ErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo;
  errorId: string;
  onRetry: () => void;
  onNavigateHome: () => void;
  showDetails: boolean;
  level: 'page' | 'component' | 'section';
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorId,
  onRetry,
  onNavigateHome,
  showDetails,
  level,
}) => {

  const getErrorMessage = (level: string) => {
    switch (level) {
      case 'page':
        return 'Diese Seite konnte nicht geladen werden.';
      case 'component':
        return 'Eine Komponente ist fehlgeschlagen.';
      case 'section':
        return 'Dieser Bereich konnte nicht geladen werden.';
      default:
        return 'Ein unerwarteter Fehler ist aufgetreten.';
    }
  };

  const getErrorTitle = (level: string) => {
    switch (level) {
      case 'page':
        return 'Seite nicht verfügbar';
      case 'component':
        return 'Komponenten-Fehler';
      case 'section':
        return 'Bereich nicht verfügbar';
      default:
        return 'Fehler';
    }
  };

  const isPageLevel = level === 'page';

  const content = (
    <Card
      elevation={isPageLevel ? 0 : 2}
      sx={{
        maxWidth: isPageLevel ? 600 : 400,
        mx: 'auto',
        mt: isPageLevel ? 4 : 2,
      }}
    >
      <CardContent sx={{ textAlign: 'center', py: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mb: 2,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 60,
              height: 60,
              borderRadius: '50%',
              bgcolor: 'error.light',
              color: 'error.contrastText',
            }}
          >
            <BugIcon fontSize="large" />
          </Box>
        </Box>

        <Typography variant={isPageLevel ? 'h4' : 'h6'} gutterBottom>
          {getErrorTitle(level)}
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mb: 3 }}
        >
          {getErrorMessage(level)}
        </Typography>

        {showDetails && (
          <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
            <Typography variant="body2" component="div">
              <strong>Fehler:</strong> {error.message}
            </Typography>
            {errorId && (
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Fehler-ID: {errorId}
              </Typography>
            )}
          </Alert>
        )}
      </CardContent>

      <CardActions sx={{ justifyContent: 'center', pb: 3, gap: 2 }}>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={onRetry}
          size={isPageLevel ? 'large' : 'medium'}
        >
          Erneut versuchen
        </Button>
        
        {isPageLevel && (
          <Button
            variant="outlined"
            startIcon={<HomeIcon />}
            onClick={onNavigateHome}
            size="large"
          >
            Zur Startseite
          </Button>
        )}
      </CardActions>
    </Card>
  );

  if (isPageLevel) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        {content}
      </Container>
    );
  }

  return content;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, level = 'component' } = this.props;
    
    this.setState({ errorInfo });

    errorService.handleComponentError(error, { componentStack: errorInfo.componentStack || '' }, `ErrorBoundary-${level}`);

    onError?.(error, errorInfo);

    console.group('🚨 Error Boundary Caught Error');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      window.clearTimeout(this.retryTimeoutId);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });
  };

  handleNavigateHome = () => {
    window.location.href = '/';
  };

  render() {
    const { hasError, error, errorInfo, errorId } = this.state;
    const { 
      children, 
      fallback, 
      showDetails = process.env.NODE_ENV === 'development',
      level = 'component' 
    } = this.props;

    // Support render prop pattern
    if (typeof children === 'function') {
      return children(hasError, error, this.handleRetry);
    }

    if (hasError && error) {
      if (fallback) {
        return fallback;
      }

      return (
        <ErrorFallback
          error={error}
          errorInfo={errorInfo!}
          errorId={errorId}
          onRetry={this.handleRetry}
          onNavigateHome={this.handleNavigateHome}
          showDetails={showDetails}
          level={level}
        />
      );
    }

    return children;
  }
}

export default ErrorBoundary;