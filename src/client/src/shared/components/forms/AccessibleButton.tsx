import React from 'react';
import {
  Button,
  type ButtonProps,
  CircularProgress,
  Box,
  type SxProps,
  type Theme,
} from '@mui/material';

type ButtonState = 'idle' | 'loading' | 'success' | 'error';

interface AccessibleButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
  successText?: string;
  errorText?: string;
  state?: ButtonState;
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
  const isDisabled = disabled === true || loading;
  const buttonId = props.id ?? 'button';

  // Get appropriate text and ARIA attributes based on state
  const getButtonContent = (): React.ReactNode => {
    switch (currentState) {
      case 'loading':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={16} color="inherit" />
            <span>{loadingText}</span>
          </Box>
        );
      case 'success':
        return successText ?? children;
      case 'error':
        return errorText ?? children;
      case 'idle':
        return children;
      default: {
        const _exhaustiveCheck: never = currentState;
        return _exhaustiveCheck;
      }
    }
  };

  const getAriaLabel = (): string | undefined => {
    switch (currentState) {
      case 'loading':
        return loadingText;
      case 'success':
        return successText ?? (typeof children === 'string' ? children : undefined);
      case 'error':
        return errorText ?? (typeof children === 'string' ? children : undefined);
      case 'idle':
        return typeof children === 'string' ? children : undefined;
      default: {
        const _exhaustiveCheck: never = currentState;
        return _exhaustiveCheck;
      }
    }
  };

  const getAriaDescription = (): string | undefined => {
    switch (currentState) {
      case 'loading':
        return 'Please wait while the action is being processed';
      case 'success':
        return 'Action completed successfully';
      case 'error':
        return 'Action failed, please try again';
      case 'idle':
        return undefined;
      default: {
        const _exhaustiveCheck: never = currentState;
        return _exhaustiveCheck;
      }
    }
  };

  const ariaDescription = getAriaDescription();

  // Base styles for the button
  const baseSx: SxProps<Theme> = {
    position: 'relative',
    '&:focus-visible': {
      outline: '3px solid',
      outlineColor: 'primary.main',
      outlineOffset: 2,
    },
  };

  // Combine base styles with provided sx prop
  const combinedSx: SxProps<Theme> = props.sx ? [baseSx, props.sx].flat() : baseSx;

  return (
    <Button
      {...props}
      disabled={isDisabled}
      aria-label={getAriaLabel()}
      aria-describedby={ariaDescription ? `${buttonId}-description` : undefined}
      aria-busy={currentState === 'loading'}
      aria-live={announce ? 'polite' : undefined}
      sx={combinedSx}
    >
      {getButtonContent()}

      {/* Screen reader only description */}
      {ariaDescription ? (
        <Box
          id={`${buttonId}-description`}
          sx={{
            position: 'absolute',
            left: -10000,
            width: 1,
            height: 1,
            overflow: 'hidden',
          }}
        >
          {ariaDescription}
        </Box>
      ) : null}
    </Button>
  );
};

export default AccessibleButton;
