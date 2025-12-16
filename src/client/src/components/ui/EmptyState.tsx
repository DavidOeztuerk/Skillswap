import React, { memo } from 'react';
import { Box, Typography, Button, type SxProps, type Theme } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { spacing } from '../../styles/tokens';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  actionPath?: string;
  actionHandler?: () => void;
  sx?: SxProps<Theme>;
}

/**
 * Komponente für den leeren Zustand, wenn keine Daten vorhanden sind
 */
const EmptyState: React.FC<EmptyStateProps> = memo(
  ({ title, description, icon, actionLabel, actionPath, actionHandler, sx = {} }) => (
    <Box
      sx={[
        {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          py: spacing[8] / 8,
          px: spacing[2] / 8,
        },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {icon !== undefined && (
        <Box
          sx={{
            fontSize: 64,
            mb: spacing[2] / 8,
            color: 'text.secondary',
            '& svg': {
              fontSize: 'inherit',
            },
          }}
        >
          {icon}
        </Box>
      )}

      <Typography variant="h5" component="h2" color="text.primary" gutterBottom fontWeight="medium">
        {title}
      </Typography>

      {description && (
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ maxWidth: 450, mb: actionLabel ? spacing[3] / 8 : 0 }}
        >
          {description}
        </Typography>
      )}

      {actionLabel && (
        <Button
          variant="contained"
          color="primary"
          component={actionPath ? RouterLink : 'button'}
          to={actionPath}
          onClick={actionHandler}
          sx={{ mt: description ? 0 : spacing[3] / 8 }}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  )
);

EmptyState.displayName = 'EmptyState';

export default EmptyState;
