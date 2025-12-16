import React, { useState, useMemo, useCallback, memo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  BottomNavigation,
  BottomNavigationAction,
  Badge,
  useTheme,
  Menu,
  MenuItem as MuiMenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Home as HomeIcon,
  Dashboard as DashboardIcon,
  EmojiObjects as SkillsIcon,
  People as MatchmakingIcon,
  Event as AppointmentsIcon,
  Person as ProfileIcon,
  MoreHoriz as MoreIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { useAppSelector } from '../../store/store.hooks';
import { usePermissions } from '../../contexts/permissionContextHook';
import { selectPendingMatches } from '../../store/selectors/matchmakingSelectors';
import { Permissions } from '../auth/permissions.constants';

// ============================================================================
// Types
// ============================================================================

interface NavMenuItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  authRequired: boolean;
  permissions?: string[];
  badge?: number;
}

// ============================================================================
// Constants
// ============================================================================

const MAX_VISIBLE_ITEMS = 4;

// ============================================================================
// Component
// ============================================================================

const Tabbar: React.FC = memo(() => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { isAuthenticated } = useAuth();
  const { hasPermission, isAdmin } = usePermissions();
  const [moreMenuAnchor, setMoreMenuAnchor] = useState<null | HTMLElement>(null);

  // Get dynamic badge counts from Redux store
  const pendingMatchesRaw = useAppSelector(selectPendingMatches);
  const pendingMatches = Array.isArray(pendingMatchesRaw) ? pendingMatchesRaw : [];
  const pendingMatchCount = pendingMatches.length;

  // =========================================================================
  // Memoized Menu Items
  // =========================================================================
  const menuItems = useMemo<NavMenuItem[]>(() => {
    const items: NavMenuItem[] = [
      {
        label: 'Home',
        icon: <HomeIcon />,
        path: '/',
        authRequired: false,
      },
      {
        label: 'Dashboard',
        icon: <DashboardIcon />,
        path: '/dashboard',
        authRequired: true,
      },
      {
        label: 'Skills',
        icon: <SkillsIcon />,
        path: '/skills',
        authRequired: true,
      },
      {
        label: 'Matches',
        icon: <MatchmakingIcon />,
        path: '/matchmaking',
        authRequired: true,
        badge: pendingMatchCount,
      },
      {
        label: 'Termine',
        icon: <AppointmentsIcon />,
        path: '/appointments',
        authRequired: true,
      },
      {
        label: 'Profil',
        icon: <ProfileIcon />,
        path: '/profile',
        authRequired: true,
      },
    ];

    // Add admin menu item for admins
    const hasAdminPermission = hasPermission(Permissions.Admin.ACCESS_DASHBOARD);
    if (isAdmin || hasAdminPermission) {
      items.push({
        label: 'Admin',
        icon: <AdminIcon />,
        path: '/admin/dashboard',
        authRequired: true,
        permissions: [Permissions.Admin.ACCESS_DASHBOARD],
      });
    }

    return items;
  }, [isAdmin, hasPermission, pendingMatchCount]);

  // =========================================================================
  // Filtered Menu Items
  // =========================================================================
  const filteredMenuItems = useMemo(
    () =>
      menuItems.filter((item) => {
        // Check authentication
        if (item.authRequired && !isAuthenticated) return false;

        // Check permissions
        if (item.permissions !== undefined && item.permissions.length > 0) {
          return item.permissions.some((permission) => {
            const hasPerm = hasPermission(permission);
            return hasPerm;
          });
        }

        return true;
      }),
    [menuItems, isAuthenticated, hasPermission]
  );

  // Split into visible and overflow
  const visibleMenuItems = useMemo(
    () => filteredMenuItems.slice(0, MAX_VISIBLE_ITEMS),
    [filteredMenuItems]
  );

  const overflowMenuItems = useMemo(
    () => filteredMenuItems.slice(MAX_VISIBLE_ITEMS),
    [filteredMenuItems]
  );

  const hasOverflow = overflowMenuItems.length > 0;

  // =========================================================================
  // Path Detection
  // =========================================================================
  const getCurrentPath = useCallback(() => {
    const path = location.pathname;

    // Exact path match first
    const exactMatches = [
      '/',
      '/dashboard',
      '/skills',
      '/matchmaking',
      '/appointments',
      '/profile',
    ];
    if (exactMatches.includes(path)) {
      return path;
    }

    // Intelligent path mapping with priority
    if (path.startsWith('/skills/')) return '/skills';
    if (path.startsWith('/matchmaking/')) return '/matchmaking';
    if (path.startsWith('/appointments/')) return '/appointments';
    if (path.startsWith('/profile/') || path.startsWith('/users/')) return '/profile';
    if (path.startsWith('/dashboard/')) return '/dashboard';
    if (path.startsWith('/admin/')) return '/admin/dashboard';

    // For unknown paths: authenticated -> dashboard, otherwise -> home
    return isAuthenticated ? '/dashboard' : '/';
  }, [location.pathname, isAuthenticated]);

  // =========================================================================
  // Event Handlers
  // =========================================================================
  const handleMoreClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setMoreMenuAnchor(event.currentTarget);
  }, []);

  const handleMoreClose = useCallback(() => {
    setMoreMenuAnchor(null);
  }, []);

  const handleOverflowNavigation = useCallback(
    (path: string) => {
      void navigate(path);
      handleMoreClose();
    },
    [navigate, handleMoreClose]
  );

  const handleNavigationChange = useCallback(
    (_: React.SyntheticEvent, newValue: string) => {
      if (newValue !== 'more') {
        void navigate(newValue);
      }
    },
    [navigate]
  );

  // =========================================================================
  // Render
  // =========================================================================
  const currentPath = getCurrentPath();

  return (
    <Box
      sx={{
        width: '100%',
        position: 'fixed',
        bottom: 0,
        left: 0,
        zIndex: 1100,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          overflow: 'hidden',
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
      >
        <BottomNavigation
          value={currentPath}
          onChange={handleNavigationChange}
          showLabels
          sx={{
            height: { xs: 72, sm: 64 },
            '& .MuiBottomNavigationAction-root': {
              // Ensure minimum 48px touch target width
              minWidth: { xs: 56, sm: 64 },
              minHeight: { xs: 72, sm: 64 },
              padding: { xs: '8px 6px', sm: '6px 8px' },
              color: theme.palette.text.secondary,
              transition: 'all 0.2s ease-in-out',
              '&.Mui-selected': {
                color: theme.palette.primary.main,
                transform: { xs: 'scale(1.02)', sm: 'scale(1)' },
              },
              '&:active': {
                transform: 'scale(0.95)',
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
              '& .MuiSvgIcon-root': {
                fontSize: { xs: '1.5rem', sm: '1.5rem' },
              },
              '& .MuiBottomNavigationAction-label': {
                // Minimum readable font size: 0.75rem (12px)
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                marginTop: { xs: '3px', sm: '2px' },
                fontWeight: 500,
                '&.Mui-selected': {
                  fontSize: { xs: '0.75rem', sm: '0.8rem' },
                  fontWeight: 600,
                },
              },
            },
          }}
        >
          {/* Visible Menu Items */}
          {visibleMenuItems.map((item) => (
            <BottomNavigationAction
              key={item.path}
              label={item.label}
              value={item.path}
              icon={
                item.badge !== undefined && item.badge > 0 ? (
                  <Badge badgeContent={item.badge} color="error">
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )
              }
            />
          ))}

          {/* More Button for overflow items */}
          {hasOverflow && (
            <BottomNavigationAction
              label="Mehr"
              value="more"
              icon={<MoreIcon />}
              onClick={handleMoreClick}
            />
          )}
        </BottomNavigation>
      </Paper>

      {/* Overflow Menu */}
      <Menu
        anchorEl={moreMenuAnchor}
        open={Boolean(moreMenuAnchor)}
        onClose={handleMoreClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        slotProps={{
          paper: {
            elevation: 8,
            sx: {
              minWidth: { xs: 180, sm: 200 },
              maxWidth: { xs: 'calc(100vw - 32px)', sm: 'auto' },
              '&::before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                bottom: -8,
                left: '50%',
                width: 0,
                height: 0,
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderTop: '8px solid',
                borderTopColor: 'background.paper',
                transform: 'translateX(-50%)',
                zIndex: 0,
              },
            },
          },
        }}
      >
        {overflowMenuItems.map((item) => {
          const isActive = currentPath === item.path;

          return (
            <MuiMenuItem
              key={item.path}
              onClick={() => {
                handleOverflowNavigation(item.path);
              }}
              selected={isActive}
              sx={{
                py: 1.5,
                px: 2,
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
                '&.Mui-selected': {
                  backgroundColor: 'action.selected',
                  color: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'action.selected',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: isActive ? 'primary.main' : 'inherit',
                  minWidth: 40,
                }}
              >
                {item.badge !== undefined && item.badge > 0 ? (
                  <Badge badgeContent={item.badge} color="error">
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                slotProps={{
                  primary: {
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? 'primary.main' : 'inherit',
                  },
                }}
              />
            </MuiMenuItem>
          );
        })}

        {overflowMenuItems.length > 0 && (
          <>
            <Divider sx={{ my: 1 }} />
            <MuiMenuItem
              onClick={handleMoreClose}
              sx={{
                py: 1,
                px: 2,
                color: 'text.secondary',
                fontSize: '0.875rem',
              }}
            >
              Schließen
            </MuiMenuItem>
          </>
        )}
      </Menu>
    </Box>
  );
});

Tabbar.displayName = 'Tabbar';

export default Tabbar;
