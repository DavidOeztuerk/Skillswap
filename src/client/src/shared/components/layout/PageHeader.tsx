import React, { useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import {
  Box,
  Typography,
  Breadcrumbs,
  Link,
  type SxProps,
  type Theme,
  Button,
} from '@mui/material';
import { useBreadcrumbs, type BreadcrumbItem } from '../../hooks/useBreadcrumbs';
import { useNavigation } from '../../hooks/useNavigation';

interface PageHeaderProps {
  title?: string; // Now optional - will be auto-generated if not provided
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[]; // Optional - will be auto-generated if not provided
  actions?: React.ReactNode;
  sx?: SxProps<Theme>;
  showBreadcrumbs?: boolean; // Control breadcrumb visibility
  useAutoBreadcrumbs?: boolean; // Use automatic breadcrumb generation
  useContextualBreadcrumbs?: boolean; // Use contextual breadcrumbs from useNavigation
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
  sx,
  showBreadcrumbs = true,
  useAutoBreadcrumbs = true,
  useContextualBreadcrumbs = false,
  icon,
}) => {
  const autoBreadcrumbs = useBreadcrumbs();
  const { contextualBreadcrumbs, navigateWithContext, navigationContext } = useNavigation();

  // Handler for breadcrumb navigation with context preservation
  const handleBreadcrumbClick = useCallback(
    (href: string, label: string) => {
      if (href === '/') {
        void navigateWithContext(href);
      } else if (href.startsWith('/skills/') && href !== '/skills') {
        void navigateWithContext(href, {
          from: 'home',
          skillName: label,
        });
      } else if (
        href === '/skills' ||
        href === '/skills/my-skills' ||
        href === '/skills/favorites'
      ) {
        void navigateWithContext(href, { from: 'home' });
      } else {
        void navigateWithContext(href, navigationContext);
      }
    },
    [navigateWithContext, navigationContext]
  );

  // Determine which breadcrumbs to use (contextual > custom > auto)
  const finalBreadcrumbs = useContextualBreadcrumbs
    ? contextualBreadcrumbs
    : useAutoBreadcrumbs
      ? (breadcrumbs ?? autoBreadcrumbs)
      : breadcrumbs;

  // Auto-generate title from breadcrumbs if not provided
  const getAutoTitle = (): string => {
    if (finalBreadcrumbs !== undefined && finalBreadcrumbs.length > 0) {
      const lastIndex = finalBreadcrumbs.length - 1;
      const lastBreadcrumb = finalBreadcrumbs[lastIndex];
      return lastBreadcrumb.label;
    }
    return 'Page';
  };
  const finalTitle = title ?? getAutoTitle();

  // Base styles for the header
  const baseStyles: SxProps<Theme> = {
    mb: 4,
    display: 'flex',
    flexDirection: { xs: 'column', sm: 'row' },
    alignItems: { xs: 'flex-start', sm: 'center' },
    justifyContent: 'space-between',
  };

  // Combine base styles with custom sx prop
  const combinedSx: SxProps<Theme> = sx === undefined ? baseStyles : [baseStyles, sx].flat();

  return (
    <Box sx={combinedSx}>
      <Box>
        {showBreadcrumbs && finalBreadcrumbs !== undefined && finalBreadcrumbs.length > 1 ? (
          <Breadcrumbs
            separator={<NavigateNextIcon fontSize="small" />}
            aria-label="Breadcrumb"
            sx={{ mb: 1 }}
          >
            {finalBreadcrumbs.map((item, index) => {
              const isLast = index === finalBreadcrumbs.length - 1;

              if (isLast || item.href === undefined || item.isActive === true) {
                return (
                  <Typography key={item.label} color="text.primary" variant="body2">
                    {item.label}
                  </Typography>
                );
              }

              // Use contextual navigation handler when enabled
              if (useContextualBreadcrumbs && item.href) {
                return (
                  <Link
                    key={item.label}
                    component="button"
                    underline="hover"
                    color="inherit"
                    variant="body2"
                    onClick={() => handleBreadcrumbClick(item.href ?? '', item.label)}
                    sx={{ cursor: 'pointer' }}
                  >
                    {item.label}
                  </Link>
                );
              }

              // Default: use RouterLink
              return (
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
        ) : null}

        <Box display="flex" alignItems="center" gap={2}>
          {icon !== undefined && <Box>{icon}</Box>}
          <Typography
            variant="h4"
            component="h1"
            color="text.primary"
            fontWeight="medium"
            sx={{ mb: subtitle === undefined ? 0 : 1 }}
          >
            {finalTitle}
          </Typography>
        </Box>

        {subtitle !== undefined && (
          <Typography variant="subtitle1" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>

      {actions !== undefined && (
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
  color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  variant?: 'text' | 'outlined' | 'contained';
}> = ({ label, icon, onClick, to, color = 'primary', variant = 'contained' }) => {
  if (to) {
    return (
      <Button component={RouterLink} to={to} variant={variant} color={color} startIcon={icon}>
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
