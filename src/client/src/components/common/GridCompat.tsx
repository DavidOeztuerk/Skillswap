import React from 'react';
import { Box, BoxProps } from '@mui/material';

interface GridProps extends BoxProps {
  container?: boolean;
  item?: boolean;
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  spacing?: number;
}

export const Grid: React.FC<GridProps> = ({ 
  container, 
  item, 
  xs, 
  sm, 
  md, 
  lg, 
  xl, 
  spacing = 0,
  children,
  sx,
  ...rest 
}) => {
  if (container) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          margin: spacing ? `-${spacing * 4}px` : 0,
          width: spacing ? `calc(100% + ${spacing * 8}px)` : '100%',
          ...sx
        }}
        {...rest}
      >
        {children}
      </Box>
    );
  }

  if (item) {
    const getWidth = (size?: number) => {
      if (!size) return undefined;
      return `${(size / 12) * 100}%`;
    };

    return (
      <Box
        sx={{
          padding: spacing ? `${spacing * 4}px` : 0,
          width: {
            xs: getWidth(xs) || '100%',
            sm: getWidth(sm) || getWidth(xs) || '100%',
            md: getWidth(md) || getWidth(sm) || getWidth(xs) || '100%',
            lg: getWidth(lg) || getWidth(md) || getWidth(sm) || getWidth(xs) || '100%',
            xl: getWidth(xl) || getWidth(lg) || getWidth(md) || getWidth(sm) || getWidth(xs) || '100%',
          },
          ...sx
        }}
        {...rest}
      >
        {children}
      </Box>
    );
  }

  return <Box sx={sx} {...rest}>{children}</Box>;
};

export default Grid;