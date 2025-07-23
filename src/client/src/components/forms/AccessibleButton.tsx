// src/components/forms/AccessibleButton.tsx
import React from 'react';
import { Button, ButtonProps, CircularProgress, Box } from '@mui/material';

interface AccessibleButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
  successText?: string;
  errorText?: string;
  state?: 'idle' | 'loading' | 'success' | 'error';
  announce?: boolean;
}

/**
 * Enhanced Button component with improved accessibility features
 * Provides loading states, screen reader announcements, and proper ARIA attributes
 */
const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  loading = false,
  loadingText = 'Loading...',
  successText,
  errorText,
  state = 'idle',
  announce = true,
  children,
  disabled,
  ...props
}) => {
  // Determine current state
  const currentState = loading ? 'loading' : state;
  const isDisabled = disabled || loading;

  // Get appropriate text and ARIA attributes based on state
  const getButtonContent = () => {
    switch (currentState) {
      case 'loading':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={16} color="inherit" />
            <span>{loadingText}</span>
          </Box>
        );
      case 'success':
        return successText || children;
      case 'error':
        return errorText || children;
      default:
        return children;
    }
  };

  const getAriaLabel = () => {
    switch (currentState) {
      case 'loading':
        return loadingText;
      case 'success':
        return successText || (typeof children === 'string' ? children : undefined);
      case 'error':
        return errorText || (typeof children === 'string' ? children : undefined);
      default:
        return typeof children === 'string' ? children : undefined;
    }
  };

  const getAriaDescription = () => {
    switch (currentState) {
      case 'loading':
        return 'Please wait while the action is being processed';
      case 'success':
        return 'Action completed successfully';
      case 'error':
        return 'Action failed, please try again';
      default:
        return undefined;
    }
  };

  return (
    <Button
      {...props}
      disabled={isDisabled}
      aria-label={getAriaLabel()}
      aria-describedby={getAriaDescription() ? `${props.id || 'button'}-description` : undefined}
      aria-busy={currentState === 'loading'}
      aria-live={announce ? 'polite' : undefined}
      sx={{
        position: 'relative',
        ...props.sx,
        '&:focus-visible': {
          outline: '3px solid',
          outlineColor: 'primary.main',
          outlineOffset: 2,
        },
      }}
    >
      {getButtonContent()}
      
      {/* Screen reader only description */}
      {getAriaDescription() && (
        <Box
          id={`${props.id || 'button'}-description`}
          sx={{
            position: 'absolute',
            left: -10000,
            width: 1,
            height: 1,
            overflow: 'hidden',
          }}
        >
          {getAriaDescription()}
        </Box>
      )}
    </Button>
  );
};

export default AccessibleButton;