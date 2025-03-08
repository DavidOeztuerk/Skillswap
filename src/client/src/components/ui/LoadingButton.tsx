// src/components/ui/LoadingButton.tsx
import React from 'react';
import { Button, ButtonProps, CircularProgress } from '@mui/material';
import { Link } from 'react-router-dom';

interface LoadingButtonProps
  extends Omit<ButtonProps, 'startIcon' | 'endIcon'> {
  loading?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  to?: string;
  disabled?: boolean;
}

/**
 * Ein Material-UI Button mit Ladezustand.
 * - Zeigt einen Spinner bei `loading = true`
 * - Umwickelt den Button mit einem React-Router <Link>, falls `to` vorhanden ist
 */
const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading = false,
  startIcon,
  endIcon,
  children,
  to,
  disabled,
  ...buttonProps
}) => {
  const buttonContent = (
    <>
      {loading && (
        <CircularProgress
          size={20}
          color="inherit"
          sx={{
            position: 'absolute',
            left: '50%',
            marginLeft: '-10px',
          }}
        />
      )}
      <span style={{ visibility: loading ? 'hidden' : 'visible' }}>
        {children}
      </span>
      {endIcon && !loading && (
        <span style={{ marginLeft: 8, display: 'inline-flex' }}>{endIcon}</span>
      )}
    </>
  );

  const commonProps: ButtonProps = {
    ...buttonProps,
    disabled: loading || disabled,
    startIcon: !loading ? startIcon : undefined,
    // Hier unbedingt KEIN accentColor o.ä. verwenden
    sx: {
      position: 'relative',
      ...(buttonProps.sx || {}),
    },
  };

  // Wenn eine Route (`to`) da ist, wickeln wir den Button in <Link>
  if (to) {
    return (
      <Link to={to} style={{ textDecoration: 'none' }}>
        <Button {...commonProps}>{buttonContent}</Button>
      </Link>
    );
  }

  // Normaler Button, falls `to` fehlt
  return <Button {...commonProps}>{buttonContent}</Button>;
};

export default LoadingButton;
