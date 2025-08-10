import React from 'react';
import { Button, ButtonProps, CircularProgress } from '@mui/material';

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
  loadingPosition?: 'start' | 'end' | 'center';
  loadingIndicator?: React.ReactNode;
  loadingText?: string;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading = false,
  loadingPosition = 'center',
  loadingIndicator,
  loadingText,
  disabled,
  children,
  startIcon,
  endIcon,
  ...props
}) => {
  const defaultLoadingIndicator = (
    <CircularProgress 
      size={20} 
      color="inherit"
      sx={{ 
        ...(loadingPosition === 'start' && { mr: 1 }),
        ...(loadingPosition === 'end' && { ml: 1 }),
      }}
    />
  );

  const loadingComponent = loadingIndicator || defaultLoadingIndicator;

  const getContent = () => {
    if (loading) {
      if (loadingPosition === 'center') {
        return (
          <>
            {loadingComponent}
            {loadingText && (
              <span style={{ marginLeft: 8 }}>{loadingText}</span>
            )}
          </>
        );
      }
      
      return (
        <>
          {loadingPosition === 'start' && loadingComponent}
          {loadingText || children}
          {loadingPosition === 'end' && loadingComponent}
        </>
      );
    }
    
    return children;
  };

  return (
    <Button
      {...props}
      disabled={disabled || loading}
      startIcon={loading && loadingPosition === 'center' ? undefined : startIcon}
      endIcon={loading && loadingPosition === 'center' ? undefined : endIcon}
    >
      {getContent()}
    </Button>
  );
};

export default LoadingButton;