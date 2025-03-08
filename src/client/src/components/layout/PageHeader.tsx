// src/components/layout/PageHeader.tsx
import React from 'react';
import {
  Box,
  Typography,
  Breadcrumbs,
  Link,
  SxProps,
  Theme,
  Button,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  action?: React.ReactNode;
  sx?: SxProps<Theme>;
}

/**
 * Standard-Seitenkopf mit Titel, Untertitel, Breadcrumbs und optionaler Aktion
 */
const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  action,
  sx = {},
}) => {
  return (
    <Box
      sx={{
        mb: 4,
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'flex-start', sm: 'center' },
        justifyContent: 'space-between',
        ...sx,
      }}
    >
      <Box>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumbs
            separator={<NavigateNextIcon fontSize="small" />}
            aria-label="Breadcrumb"
            sx={{ mb: 1 }}
          >
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1;

              return isLast || !item.href ? (
                <Typography
                  key={item.label}
                  color="text.primary"
                  variant="body2"
                >
                  {item.label}
                </Typography>
              ) : (
                <Link
                  key={item.label}
                  component={RouterLink}
                  to={item.href}
                  underline="hover"
                  color="inherit"
                  variant="body2"
                >
                  {item.label}
                </Link>
              );
            })}
          </Breadcrumbs>
        )}

        <Typography
          variant="h4"
          component="h1"
          color="text.primary"
          fontWeight="medium"
          sx={{ mb: subtitle ? 1 : 0 }}
        >
          {title}
        </Typography>

        {subtitle && (
          <Typography variant="subtitle1" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>

      {action && (
        <Box
          sx={{
            mt: { xs: 2, sm: 0 },
            alignSelf: { xs: 'flex-start', sm: 'center' },
          }}
        >
          {action}
        </Box>
      )}
    </Box>
  );
};

/**
 * Typisches Aktions-Button-Element für den PageHeader
 */
export const PageHeaderAction: React.FC<{
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  to?: string;
  color?:
    | 'inherit'
    | 'primary'
    | 'secondary'
    | 'success'
    | 'error'
    | 'info'
    | 'warning';
  variant?: 'text' | 'outlined' | 'contained';
}> = ({
  label,
  icon,
  onClick,
  to,
  color = 'primary',
  variant = 'contained',
}) => {
  if (to) {
    return (
      <Button
        component={RouterLink}
        to={to}
        variant={variant}
        color={color}
        startIcon={icon}
      >
        {label}
      </Button>
    );
  }

  return (
    <Button variant={variant} color={color} startIcon={icon} onClick={onClick}>
      {label}
    </Button>
  );
};

export default PageHeader;
