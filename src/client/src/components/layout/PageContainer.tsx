import React from 'react';
import { Box, Container, Paper, type SxProps, type Theme } from '@mui/material';

interface PageContainerProps {
  children: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  disablePadding?: boolean;
  elevation?: number;
  sx?: SxProps<Theme>;
}

/**
 * Standard-Container für Seiteninhalt
 * Umhüllt Inhalte in einem Container mit optionalem Paper-Element und anpassbaren Stilen
 */
const PageContainer: React.FC<PageContainerProps> = ({
  children,
  maxWidth = 'lg',
  disablePadding = false,
  elevation = 0,
  sx,
}) => (
  <Container
    maxWidth={maxWidth}
    sx={[
      { mt: 2, mb: 4 },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      ...(Array.isArray(sx) ? sx : sx !== undefined ? [sx] : []),
    ]}
  >
    <Paper
      elevation={elevation}
      sx={{
        width: '100%',
        p: disablePadding ? 0 : 3,
        borderRadius: 2,
      }}
    >
      <Box>{children}</Box>
    </Paper>
  </Container>
);

export default PageContainer;
