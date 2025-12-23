import React, { type JSX, memo } from 'react';
import { Link } from 'react-router-dom';
import { type ButtonProps, CircularProgress, Button } from '@mui/material';

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
          {endIcon === undefined ? null : (
            <span style={{ marginLeft: 8, display: 'inline-flex' }}>{endIcon}</span>
          )}
        </>
      );
    };

    // Compute sx: base style + custom styles
    const baseSx = { position: 'relative' };
    let computedSx: ButtonProps['sx'] = baseSx;
    if (sx !== undefined && !Array.isArray(sx)) {
      // Object sx: merge with base
      computedSx = { ...baseSx, ...(sx as Record<string, unknown>) };
    } else if (Array.isArray(sx)) {
      // Array sx: prepend base using push to avoid spread/concat type conflicts
      const sxArray: Record<string, unknown>[] = [baseSx];
      sx.forEach((item) => {
        sxArray.push(item as Record<string, unknown>);
      });
      computedSx = sxArray as ButtonProps['sx'];
    }

    const commonProps: ButtonProps = {
      ...buttonProps,
      disabled: loading || disabled,
      startIcon: loading && loadingPosition === 'center' ? undefined : startIcon,
      sx: computedSx,
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
