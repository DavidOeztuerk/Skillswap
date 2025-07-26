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
import { useBreadcrumbs, BreadcrumbItem } from '../../hooks/useBreadcrumbs';

interface PageHeaderProps {
  title?: string; // Now optional - will be auto-generated if not provided
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[]; // Optional - will be auto-generated if not provided
  actions?: React.ReactNode;
  sx?: SxProps<Theme>;
  showBreadcrumbs?: boolean; // Control breadcrumb visibility
  useAutoBreadcrumbs?: boolean; // Use automatic breadcrumb generation
  icon?: React.ReactNode; // Icon for the header, if needed
}

/**
 * Standard-Seitenkopf mit Titel, Untertitel, Breadcrumbs und optionaler Aktion
 */
const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  actions,
  sx = {},
  showBreadcrumbs = true,
  useAutoBreadcrumbs = true,
  icon
}) => {
  const autoBreadcrumbs = useBreadcrumbs();
  
  // Determine which breadcrumbs to use
  const finalBreadcrumbs = useAutoBreadcrumbs 
    ? (breadcrumbs || autoBreadcrumbs)
    : breadcrumbs;
    
  // Auto-generate title from breadcrumbs if not provided
  const finalTitle = title || (finalBreadcrumbs && finalBreadcrumbs.length > 0 
    ? finalBreadcrumbs[finalBreadcrumbs.length - 1]?.label 
    : 'Page');
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
        {showBreadcrumbs && finalBreadcrumbs && finalBreadcrumbs.length > 1 && (
          <Breadcrumbs
            separator={<NavigateNextIcon fontSize="small" />}
            aria-label="Breadcrumb"
            sx={{ mb: 1 }}
          >
            {finalBreadcrumbs.map((item, index) => {
              const isLast = index === finalBreadcrumbs.length - 1;

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

        <Box display="flex" alignItems="center" gap={2}>
          {icon && (
            <Box>
              {icon}
            </Box>
          )}
          <Typography
            variant="h4"
            component="h1"
            color="text.primary"
            fontWeight="medium"
            sx={{ mb: subtitle ? 1 : 0 }}
          >
            {finalTitle}
          </Typography>
        </Box>

        {subtitle && (
          <Typography variant="subtitle1" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>

      {actions && (
        <Box
          sx={{
            mt: { xs: 2, sm: 0 },
            alignSelf: { xs: 'flex-start', sm: 'center' },
          }}
        >
          {actions}
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
