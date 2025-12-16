import React, { type JSX, memo } from 'react';
import { Button, type ButtonProps, CircularProgress } from '@mui/material';
import { Link } from 'react-router-dom';

interface LoadingButtonProps extends Omit<ButtonProps, 'startIcon' | 'endIcon'> {
  loading?: boolean;
  loadingPosition?: 'start' | 'end' | 'center';
  loadingIndicator?: React.ReactNode;
  loadingText?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  to?: string;
}

/**
 * A Material-UI Button with loading state.
 * - Shows a spinner when `loading = true`
 * - Supports `loadingPosition` for spinner placement (start, center, end)
 * - Supports `loadingText` to display text while loading
 * - Wraps the button with React-Router <Link> if `to` is provided
 */
const LoadingButton: React.FC<LoadingButtonProps> = memo(
  ({
    loading = false,
    loadingPosition = 'center',
    loadingIndicator,
    loadingText,
    startIcon,
    endIcon,
    children,
    to,
    disabled,
    sx,
    ...buttonProps
  }) => {
    const defaultLoadingIndicator = (
      <CircularProgress
        size={20}
        color="inherit"
        sx={{
          ...(loadingPosition === 'start' && { mr: 1 }),
          ...(loadingPosition === 'end' && { ml: 1 }),
          ...(loadingPosition === 'center' && {
            position: 'absolute',
            left: '50%',
            marginLeft: '-10px',
          }),
        }}
      />
    );

    const loadingComponent = loadingIndicator ?? defaultLoadingIndicator;

    const getContent = (): JSX.Element => {
      if (loading) {
        if (loadingPosition === 'center') {
          return (
            <>
              {loadingComponent}
              <span style={{ visibility: 'hidden' }}>{loadingText ?? children}</span>
            </>
          );
        }

        return (
          <>
            {loadingPosition === 'start' ? loadingComponent : null}
            {loadingText ?? children}
            {loadingPosition === 'end' ? loadingComponent : null}
          </>
        );
      }

      return (
        <>
          {children}
          {endIcon !== undefined ? (
            <span style={{ marginLeft: 8, display: 'inline-flex' }}>{endIcon}</span>
          ) : null}
        </>
      );
    };

    const commonProps: ButtonProps = {
      ...buttonProps,
      disabled: loading || disabled,
      startIcon: loading && loadingPosition === 'center' ? undefined : startIcon,
      sx: [
        {
          position: 'relative',
        },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        ...(Array.isArray(sx) ? sx : sx !== undefined ? [sx] : []),
      ],
    };

    // If a route (`to`) is provided, wrap the button in <Link>
    if (to) {
      return (
        <Link to={to} style={{ textDecoration: 'none' }}>
          <Button {...commonProps}>{getContent()}</Button>
        </Link>
      );
    }

    return <Button {...commonProps}>{getContent()}</Button>;
  }
);

LoadingButton.displayName = 'LoadingButton';

export { LoadingButton };
export default LoadingButton;
