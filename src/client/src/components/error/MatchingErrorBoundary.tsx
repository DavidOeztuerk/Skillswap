import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { Alert, Button, Box, Typography, LinearProgress } from '@mui/material';
import {
  GroupWork as GroupWorkIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface MatchingErrorBoundaryProps {
  children: React.ReactNode;
}

/**
 * Specialized error boundary for matching algorithm components
 * Handles matching errors, algorithm failures, and recommendation issues
 */
const MatchingErrorFallback: React.FC<{ error: Error; onRetry: () => void }> = ({
  error,
  onRetry,
}) => {
  const navigate = useNavigate();
  const [isRecalculating, setIsRecalculating] = React.useState(false);

  const isAlgorithmError =
    error.message.toLowerCase().includes('algorithm') ||
    error.message.toLowerCase().includes('calculation');

  const isDataError =
    error.message.toLowerCase().includes('insufficient') ||
    error.message.toLowerCase().includes('data');

  const isTimeoutError =
    error.message.toLowerCase().includes('timeout') ||
    error.message.toLowerCase().includes('took too long');

  const handleRecalculate = (): void => {
    setIsRecalculating(true);
    // Clear matching cache
    sessionStorage.removeItem('matchingCache');
    localStorage.removeItem('matchingPreferences');

    setTimeout(() => {
      setIsRecalculating(false);
      onRetry();
    }, 2000);
  };

  const getSuggestion = (): string => {
    if (isAlgorithmError) {
      return "The matching algorithm encountered an error. We're working on finding better matches for you.";
    }
    if (isDataError) {
      return 'Not enough data to generate matches. Try updating your profile and skills.';
    }
    if (isTimeoutError) {
      return "The matching process took too long. We'll try with optimized settings.";
    }
    return 'Unable to generate matches at this time.';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Alert severity="warning" icon={<GroupWorkIcon />} sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Matching Error
        </Typography>
        <Typography variant="body2">{getSuggestion()}</Typography>
      </Alert>

      {isDataError && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">To improve matching results:</Typography>
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li>Complete your profile information</li>
            <li>Add more skills to your profile</li>
            <li>Specify your learning preferences</li>
            <li>Set your availability</li>
          </ul>
        </Alert>
      )}

      {isRecalculating && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Recalculating matches...
          </Typography>
          <LinearProgress />
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
        {!isRecalculating && (
          <>
            <Button
              variant="contained"
              onClick={handleRecalculate}
              startIcon={<RefreshIcon />}
              size="small"
            >
              Recalculate Matches
            </Button>
            {isDataError && (
              <Button
                variant="outlined"
                startIcon={<SettingsIcon />}
                onClick={() => navigate('/profile/settings')}
                size="small"
              >
                Update Profile
              </Button>
            )}
            <Button variant="text" onClick={() => navigate('/matches')} size="small">
              View All Matches
            </Button>
          </>
        )}
      </Box>

      {isTimeoutError && (
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="caption">
            Tip: Try using fewer filters or broader search criteria for faster results.
          </Typography>
        </Alert>
      )}

      {process.env.NODE_ENV === 'development' && (
        <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Error: {error.message}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export const MatchingErrorBoundary: React.FC<MatchingErrorBoundaryProps> = ({ children }) => (
  <ErrorBoundary
    level="component"
    onError={(error, _errorInfo) => {
      console.error('Matching Component Error:', error);
      // Log matching-specific errors with context
      const matchingContext = {
        timestamp: new Date().toISOString(),
        filters: sessionStorage.getItem('matchingFilters'),
        preferences: localStorage.getItem('matchingPreferences'),
      };
      console.warn('Matching error context:', matchingContext);
    }}
  >
    {(hasError, error, retry) =>
      hasError && error !== null ? (
        <MatchingErrorFallback error={error} onRetry={retry} />
      ) : (
        children
      )
    }
  </ErrorBoundary>
);

export default MatchingErrorBoundary;
