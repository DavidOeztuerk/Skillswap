import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { Alert, Button, Box, Typography, Chip } from '@mui/material';
import { School as SchoolIcon, Refresh as RefreshIcon, Search as SearchIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface SkillErrorBoundaryProps {
  children: React.ReactNode;
}

/**
 * Specialized error boundary for skill-related components
 * Handles skill search, matching, and management errors
 */
const SkillErrorFallback: React.FC<{ error: Error; onRetry: () => void }> = ({ error, onRetry }) => {
  const navigate = useNavigate();

  const isSearchError = error.message?.toLowerCase().includes('search') || 
                        error.message?.toLowerCase().includes('filter');
  
  const isDataError = error.message?.toLowerCase().includes('fetch') || 
                      error.message?.toLowerCase().includes('load');

  const handleNavigateToSkills = () => {
    navigate('/skills');
  };

  const getSuggestion = () => {
    if (isSearchError) {
      return 'Try using different search terms or clearing filters.';
    }
    if (isDataError) {
      return 'The skill data could not be loaded. Please check your connection.';
    }
    return 'There was an issue with the skills feature.';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Alert 
        severity="error"
        icon={<SchoolIcon />}
        sx={{ mb: 2 }}
      >
        <Typography variant="h6" gutterBottom>
          Skills Error
        </Typography>
        <Typography variant="body2">
          {getSuggestion()}
        </Typography>
      </Alert>

      {isSearchError && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Common issues:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip label="Invalid search syntax" size="small" />
            <Chip label="Too many filters" size="small" />
            <Chip label="Category not found" size="small" />
          </Box>
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <Button 
          variant="contained" 
          onClick={onRetry}
          startIcon={<RefreshIcon />}
          size="small"
        >
          Try Again
        </Button>
        {isSearchError && (
          <Button 
            variant="outlined" 
            startIcon={<SearchIcon />}
            onClick={() => {
              // Clear search filters and retry
              sessionStorage.removeItem('skillSearchFilters');
              onRetry();
            }}
            size="small"
          >
            Clear Filters & Retry
          </Button>
        )}
        <Button 
          variant="text" 
          onClick={handleNavigateToSkills}
          size="small"
        >
          Go to Skills Page
        </Button>
      </Box>

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

export const SkillErrorBoundary: React.FC<SkillErrorBoundaryProps> = ({ children }) => {
  return (
    <ErrorBoundary
      level="component"
      onError={(error, errorInfo) => {
        console.error('Skill Component Error:', error);
        // Log skill-specific errors
        if (error.message?.includes('skill')) {
          console.warn('Skill-specific error detected:', errorInfo.componentStack);
        }
      }}
    >
      {(hasError, error, retry) => 
        hasError ? (
          <SkillErrorFallback error={error!} onRetry={retry} />
        ) : (
          children
        )
      }
    </ErrorBoundary>
  );
};

export default SkillErrorBoundary;