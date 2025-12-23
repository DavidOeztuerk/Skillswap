import React from 'react';
import { Grid, Box } from '@mui/material';
import { useMobile } from '../../hooks/useMobile';

interface MaxColumnsConfig {
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
}

interface ResponsiveGridProps {
  children: React.ReactNode;
  spacing?: number;
  minItemWidth?: number;
  maxColumns?: MaxColumnsConfig;
  variant?: 'cards' | 'list' | 'masonry';
}

const DEFAULT_MAX_COLUMNS: MaxColumnsConfig = {
  xs: 1,
  sm: 2,
  md: 3,
  lg: 4,
  xl: 5,
};

/**
 * Responsive grid component that automatically adjusts column count
 * based on screen size and item requirements
 */
const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  spacing = 2,
  minItemWidth = 280,
  maxColumns = DEFAULT_MAX_COLUMNS,
  variant = 'cards',
}) => {
  const mobile = useMobile();

  // For mobile, always use single column for better UX
  if (mobile.isMobile && variant === 'cards') {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing,
          width: '100%',
        }}
      >
        {children}
      </Box>
    );
  }

  // For list variant on mobile, use optimized spacing
  if (mobile.isMobile && variant === 'list') {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing * 0.5,
          width: '100%',
        }}
      >
        {children}
      </Box>
    );
  }

  // Desktop and tablet grid layout
  return (
    <Grid
      container
      spacing={spacing}
      sx={{
        width: '100%',
        margin: 0,
      }}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return (
            <Grid
              key={child.key}
              size={{
                xs: 12 / (maxColumns.xs ?? 1),
                sm: 12 / (maxColumns.sm ?? 2),
                md: 12 / (maxColumns.md ?? 3),
                lg: 12 / (maxColumns.lg ?? 4),
                xl: 12 / (maxColumns.xl ?? 5),
              }}
              sx={{
                minWidth: mobile.isTablet ? minItemWidth : 'auto',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {child}
            </Grid>
          );
        }
        return null;
      })}
    </Grid>
  );
};

export default ResponsiveGrid;
