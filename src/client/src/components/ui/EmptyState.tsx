// src/components/ui/EmptyState.tsx
import React from 'react';
import { Box, Typography, Button, SxProps, Theme } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

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
const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionLabel,
  actionPath,
  actionHandler,
  sx = {},
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        py: 8,
        px: 2,
        ...sx,
      }}
    >
      {icon && (
        <Box
          sx={{
            fontSize: 64,
            mb: 2,
            color: 'text.secondary',
            '& svg': {
              fontSize: 'inherit',
            },
          }}
        >
          {icon}
        </Box>
      )}

      <Typography
        variant="h5"
        component="h2"
        color="text.primary"
        gutterBottom
        fontWeight="medium"
      >
        {title}
      </Typography>

      {description && (
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ maxWidth: 450, mb: actionLabel ? 3 : 0 }}
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
          sx={{ mt: description ? 0 : 3 }}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  );
};

export default EmptyState;
