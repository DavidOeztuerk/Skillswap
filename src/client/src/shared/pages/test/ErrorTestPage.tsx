import React, { useState } from 'react';
import {
  BugReport as BugIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Alert,
  Divider,
  Stack,
  Grid,
} from '@mui/material';
import errorService from '../../../core/services/errorService';
import AdminErrorBoundary from '../../components/error/AdminErrorBoundary';
import AppointmentErrorBoundary from '../../components/error/AppointmentErrorBoundary';
import AsyncErrorBoundary from '../../components/error/AsyncErrorBoundary';
import AuthErrorBoundary from '../../components/error/AuthErrorBoundary';
import MatchingErrorBoundary from '../../components/error/MatchingErrorBoundary';
import SkillErrorBoundary from '../../components/error/SkillErrorBoundary';

// Component that throws errors based on state - defined outside render
const ErrorThrower: React.FC<{ errorType: string }> = ({ errorType }) => {
  if (errorType === 'render') {
    throw new Error('Test render error: Component failed to render');
  }

  if (errorType === 'async') {
    setTimeout(() => {
      throw new Error('Test async error: Async operation failed');
    }, 100);
  }

  return <div>Component rendered successfully</div>;
};

/**
 * Test page for demonstrating and testing error boundaries
 * Only available in development mode
 */
const ErrorTestPage: React.FC = () => {
  const [throwError, setThrowError] = useState<string | null>(null);
  const [asyncError, setAsyncError] = useState(false);

  // Test different error types
  const triggerApiError = (): void => {
    errorService.handleApiError(
      { status: 500, message: 'Internal server error' },
      'Test API Error'
    );
  };

  const triggerAuthError = (): void => {
    errorService.handleApiError(
      { status: 401, message: 'Unauthorized: Token expired' },
      'Test Auth Error'
    );
  };

  const triggerValidationError = (): void => {
    errorService.handleValidationError(
      {
        email: ['Email is required', 'Email must be valid'],
        password: ['Password must be at least 8 characters'],
      },
      'Test Validation Error'
    );
  };

  const triggerNetworkError = (): void => {
    errorService.handleError(
      new TypeError('Failed to fetch'),
      'Network connection lost',
      'Test Network Error'
    );
  };

  const addBreadcrumb = (): void => {
    errorService.addBreadcrumb('User clicked test button', 'user-action', {
      timestamp: new Date().toISOString(),
      page: 'ErrorTestPage',
    });
    console.debug('✅ Breadcrumb added - check console for details');
  };

  if (process.env.NODE_ENV !== 'development') {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning">This page is only available in development mode.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          <BugIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Error Handling Test Page
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Test various error scenarios and error boundaries
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        {/* Error Service Tests */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Error Service Tests
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Stack spacing={2}>
              <Button
                variant="outlined"
                color="error"
                startIcon={<ErrorIcon />}
                onClick={triggerApiError}
                fullWidth
              >
                Trigger API Error (500)
              </Button>

              <Button
                variant="outlined"
                color="warning"
                startIcon={<WarningIcon />}
                onClick={triggerAuthError}
                fullWidth
              >
                Trigger Auth Error (401)
              </Button>

              <Button
                variant="outlined"
                color="info"
                startIcon={<InfoIcon />}
                onClick={triggerValidationError}
                fullWidth
              >
                Trigger Validation Error
              </Button>

              <Button variant="outlined" onClick={triggerNetworkError} fullWidth>
                Trigger Network Error
              </Button>

              <Button variant="contained" onClick={addBreadcrumb} fullWidth>
                Add Breadcrumb
              </Button>
            </Stack>
          </Paper>
        </Grid>

        {/* Component Error Tests */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Component Error Tests
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Stack spacing={2}>
              <Button
                variant="outlined"
                color="error"
                onClick={() => {
                  setThrowError('render');
                }}
                fullWidth
              >
                Throw Render Error
              </Button>

              <Button
                variant="outlined"
                color="error"
                onClick={() => {
                  setAsyncError(true);
                }}
                fullWidth
              >
                Throw Async Error
              </Button>

              <Button
                variant="contained"
                color="success"
                onClick={() => {
                  setThrowError(null);
                  setAsyncError(false);
                }}
                fullWidth
              >
                Reset Errors
              </Button>
            </Stack>

            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              {throwError ? <ErrorThrower errorType={throwError} /> : null}
              {asyncError ? (
                <AsyncErrorBoundary maxRetries={2} fallbackRetryDelay={1000}>
                  <ErrorThrower errorType="async" />
                </AsyncErrorBoundary>
              ) : null}
              {!throwError && !asyncError && (
                <Typography variant="body2" color="text.secondary">
                  No errors active
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Auth Error Boundary Test */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Auth Error Boundary
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <AuthErrorBoundary>
              <Button
                variant="outlined"
                onClick={() => {
                  throw new Error('Authentication token expired');
                }}
                fullWidth
              >
                Test Auth Error
              </Button>
            </AuthErrorBoundary>
          </Paper>
        </Grid>

        {/* Admin Error Boundary Test */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Admin Error Boundary
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <AdminErrorBoundary>
              <Button
                variant="outlined"
                onClick={() => {
                  throw new Error('Permission denied: Admin access required');
                }}
                fullWidth
              >
                Test Permission Error
              </Button>
            </AdminErrorBoundary>
          </Paper>
        </Grid>

        {/* Skill Error Boundary Test */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Skill Error Boundary
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <SkillErrorBoundary>
              <Button
                variant="outlined"
                onClick={() => {
                  throw new Error('Failed to load skill data');
                }}
                fullWidth
              >
                Test Skill Error
              </Button>
            </SkillErrorBoundary>
          </Paper>
        </Grid>

        {/* Matching Error Boundary Test */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Matching Error Boundary
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <MatchingErrorBoundary>
              <Button
                variant="outlined"
                onClick={() => {
                  throw new Error('Matching algorithm calculation failed');
                }}
                fullWidth
              >
                Test Matching Error
              </Button>
            </MatchingErrorBoundary>
          </Paper>
        </Grid>

        {/* Appointment Error Boundary Test */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Appointment Error Boundary
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <AppointmentErrorBoundary>
              <Button
                variant="outlined"
                onClick={() => {
                  throw new Error('Time slot conflict detected');
                }}
                fullWidth
              >
                Test Appointment Error
              </Button>
            </AppointmentErrorBoundary>
          </Paper>
        </Grid>

        {/* Async Error Boundary Test */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Async Error Boundary
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <AsyncErrorBoundary
              maxRetries={3}
              fallbackRetryDelay={2000}
              onRetryExhausted={() => {
                console.warn('⚠️ Retries exhausted - check console for error details');
              }}
            >
              <Button
                variant="outlined"
                onClick={async () => {
                  // Simulate async error
                  await Promise.reject(new Error('Async operation failed'));
                }}
                fullWidth
              >
                Test Async Error
              </Button>
            </AsyncErrorBoundary>
          </Paper>
        </Grid>
      </Grid>

      {/* Instructions */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Instructions
        </Typography>
        <Typography variant="body2" component="p">
          This page allows you to test various error scenarios:
        </Typography>
        <ul>
          <li>
            Error Service Tests: Trigger different types of errors that are handled by the error
            service
          </li>
          <li>
            Component Error Tests: Throw errors directly in components to test error boundaries
          </li>
          <li>
            Specific Error Boundaries: Test each specialized error boundary with relevant error
            types
          </li>
        </ul>
        <Alert severity="info" sx={{ mt: 2 }}>
          All errors are logged to the console. Check the browser console for detailed error
          information.
        </Alert>
      </Paper>
    </Container>
  );
};

export default ErrorTestPage;
