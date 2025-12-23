import React from 'react';
import { Container, Box } from '@mui/material';
import { useMobile, useMobileStyles } from '../../hooks/useMobile';

interface MobileContainerProps {
  children: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  disableGutters?: boolean;
  addBottomPadding?: boolean;
  className?: string;
}

/**
 * Mobile-optimized container component that adapts to different screen sizes
 * and provides consistent spacing and layout patterns
 */
function getPaddingX(isMobile: boolean, isSmallMobile: boolean): number {
  if (!isMobile) return 3;
  return isSmallMobile ? 1 : 2;
}

const MobileContainer: React.FC<MobileContainerProps> = ({
  children,
  maxWidth = 'lg',
  disableGutters = false,
  addBottomPadding = true,
  className,
}) => {
  // const theme = useTheme();
  const mobile = useMobile();
  const mobileStyles = useMobileStyles();

  return (
    <Container
      maxWidth={maxWidth}
      disableGutters={disableGutters}
      className={className}
      sx={{
        px: getPaddingX(mobile.isMobile, mobile.isSmallMobile),
        py: mobile.isMobile ? 2 : 3,
        pb: addBottomPadding && mobile.isMobile ? 10 : 'inherit', // Account for bottom tabbar
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        ...mobileStyles.touchStyles,
      }}
    >
      {/* Safe area for mobile devices with notches */}
      {mobile.isMobile ? (
        <Box
          sx={{
            height: 'env(safe-area-inset-top)',
            width: '100%',
          }}
        />
      ) : null}

      {/* Main content */}
      <Box
        sx={{
          flex: 1,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: mobile.isMobile ? 2 : 3,
        }}
      >
        {children}
      </Box>

      {/* Bottom safe area for mobile devices */}
      {mobile.isMobile && addBottomPadding ? (
        <Box
          sx={{
            height: 'env(safe-area-inset-bottom)',
            width: '100%',
          }}
        />
      ) : null}
    </Container>
  );
};

export default MobileContainer;
