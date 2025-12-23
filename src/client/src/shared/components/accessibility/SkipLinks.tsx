import React, { memo } from 'react';
import { Box, Link } from '@mui/material';

/**
 * Skip links component for keyboard navigation accessibility
 * Allows users to quickly jump to main content areas
 */
const SkipLinks: React.FC = memo(() => (
  <Box
    component="nav"
    aria-label="Skip navigation links"
    sx={{
      position: 'absolute',
      top: -100,
      left: 0,
      zIndex: 9999,
      '& a': {
        position: 'absolute',
        top: -100,
        left: 8,
        background: 'primary.main',
        color: 'primary.contrastText',
        padding: '8px 16px',
        textDecoration: 'none',
        borderRadius: 1,
        fontSize: '0.875rem',
        fontWeight: 'bold',
        border: '2px solid',
        borderColor: 'primary.main',
        transition: 'all 0.2s ease-in-out',
        '&:focus': {
          top: 8,
          outline: '3px solid',
          outlineColor: 'warning.main',
          outlineOffset: 2,
        },
        '&:focus-visible': {
          top: 8,
        },
      },
    }}
  >
    <Link href="#main-content">Skip to main content</Link>
    <Link href="#primary-navigation">Skip to navigation</Link>
    <Link href="#search">Skip to search</Link>
    <Link href="#footer">Skip to footer</Link>
  </Box>
));

SkipLinks.displayName = 'SkipLinks';

export default SkipLinks;
