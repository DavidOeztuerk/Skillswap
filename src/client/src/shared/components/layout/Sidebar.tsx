import React, { useMemo, useCallback, useEffect } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Home as HomeIcon,
  Dashboard as DashboardIcon,
  EmojiObjects as SkillsIcon,
  People as MatchmakingIcon,
  Event as AppointmentsIcon,
  Person as ProfileIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Menu as MenuIcon,
  Search as SearchIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Chat as ChatIcon,
} from '@mui/icons-material';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Toolbar,
  Typography,
  Collapse,
  useTheme,
  useMediaQuery,
  Chip,
} from '@mui/material';
import Badge from '@mui/material/Badge';
import { usePermissions } from '../../../core/contexts/permissionContextHook';
import { Permissions } from '../../../features/auth/components/permissions.constants';
import useAuth from '../../../features/auth/hooks/useAuth';
import useChat from '../../../features/chat/hooks/useChat';
import { brandColors } from '../../../styles/tokens/colors';
import { spacing, componentSpacing } from '../../../styles/tokens/spacing';
import { useAdminNavigation } from './adminbar/useAdminNavigation';

const DEBUG = import.meta.env.DEV && import.meta.env.VITE_VERBOSE_SIDEBAR === 'true';

// Constants for repeated values
const ACTION_HOVER_STYLE = 'action.hover' as const;

/**
 * Helper to render expand/collapse icon for menu items with children
 */
const renderExpandIcon = (hasChildren: boolean, isExpanded: boolean): React.ReactNode => {
  if (!hasChildren) return null;
  return isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />;
};

interface SidebarProps {
  drawerWidth: number;
  mobileOpen: boolean;
  onDrawerToggle: () => void;
}

interface MenuItem {
  text: string;
  icon: React.ReactNode;
  path: string;
  authRequired: boolean;
  adminRequired?: boolean;
  permissions?: string[];
  children?: MenuItem[];
}

// Haupt-Menüeinträge - defined outside component to prevent recreation
const MENU_ITEMS: MenuItem[] = [
  {
    text: 'Startseite',
    icon: <HomeIcon />,
    path: '/',
    authRequired: false,
  },
  {
    text: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/dashboard',
    authRequired: true,
  },
  {
    text: 'Skills',
    icon: <SkillsIcon />,
    path: '/skills',
    authRequired: true,
    children: [
      {
        text: 'Skills entdecken',
        icon: <SkillsIcon fontSize="small" />,
        path: '/skills',
        authRequired: true,
      },
      {
        text: 'Meine Skills',
        icon: <SkillsIcon fontSize="small" />,
        path: '/skills/my-skills',
        authRequired: true,
      },
      {
        text: 'Meine Favoriten',
        icon: <SkillsIcon fontSize="small" />,
        path: '/skills/favorites',
        authRequired: true,
      },
    ],
  },
  {
    text: 'Matchmaking',
    icon: <MatchmakingIcon />,
    path: '/matchmaking',
    authRequired: true,
  },
  {
    text: 'Termine',
    icon: <AppointmentsIcon />,
    path: '/appointments',
    authRequired: true,
  },
  {
    text: 'Search',
    icon: <SearchIcon />,
    path: '/search',
    authRequired: false,
  },
  {
    text: 'Profil',
    icon: <ProfileIcon />,
    path: '/profile',
    authRequired: true,
  },
  {
    text: 'Sicherheit',
    icon: <SecurityIcon />,
    path: '/settings/security',
    authRequired: true,
  },
  {
    text: 'Benachrichtigungen',
    icon: <NotificationsIcon />,
    path: '/settings/notifications',
    authRequired: true,
  },
];

const Sidebar: React.FC<SidebarProps> = React.memo(
  ({ drawerWidth, mobileOpen, onDrawerToggle }) => {
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { isAuthenticated } = useAuth();
    const { totalUnreadCount, openChat: openChatDrawer } = useChat();
    const {
      hasPermission,
      isAdmin: isAdminFromContext,
      loading: permissionsLoading,
      permissions,
      roles,
    } = usePermissions();
    const [openSubmenu, setOpenSubmenu] = React.useState<string | null>(null);

    // Memoize isAdmin check - Re-evaluate when context changes or loading completes
    const isAdmin = useMemo(() => {
      if (permissionsLoading) {
        if (DEBUG) console.debug('🔄 Sidebar: Permissions still loading, hiding admin menu');
        return false; // Don't show admin menu while loading
      }

      return isAdminFromContext;
    }, [isAdminFromContext, permissionsLoading]);

    // Check admin access
    const hasAdminPermission = hasPermission(Permissions.Admin.ACCESS_DASHBOARD);
    const hasAdminAccess = !permissionsLoading && (hasAdminPermission || isAdmin);

    // Hook für Admin-Navigation nutzen (lädt dynamisch)
    const { adminMenuItems, isLoading: adminNavigationLoading } =
      useAdminNavigation(hasAdminAccess);

    // Log admin status changes in a separate effect (only in debug mode)
    useEffect(() => {
      if (DEBUG && !permissionsLoading) {
        console.debug('🔐 Sidebar: Admin check', {
          isAdminFromContext,
          permissionsLoading,
          result: isAdmin,
          hasAdminAccess,
          adminMenuItemsCount: adminMenuItems.length,
          adminNavigationLoading,
        });
      }
    }, [
      isAdmin,
      isAdminFromContext,
      permissionsLoading,
      hasAdminAccess,
      adminMenuItems.length,
      adminNavigationLoading,
    ]);

    // Memoize permission check functions
    const shouldShowMenuItem = useCallback(
      (item: MenuItem): boolean => {
        // Prüfe Authentifizierung
        if (item.authRequired && !isAuthenticated) return false;

        if (item.adminRequired && !isAdmin) return false;

        // Admin und SuperAdmin sehen alle Admin-Menüeinträge
        if (isAdmin && item.path.startsWith('/admin')) {
          return true;
        }

        // Prüfe Permissions für normale User
        if (item.permissions !== undefined && item.permissions.length > 0) {
          // Zeige Menüeintrag, wenn User mindestens eine der Permissions hat
          return item.permissions.some((permission) => hasPermission(permission));
        }

        return true;
      },
      [isAuthenticated, isAdmin, hasPermission]
    );

    // Memoize filter function
    const filterMenuItems = useCallback(
      (items: MenuItem[]): MenuItem[] =>
        items
          .filter(shouldShowMenuItem)
          .map((item) => {
            if (item.children) {
              const filteredChildren = item.children.filter(shouldShowMenuItem);
              // Zeige Parent nur wenn es sichtbare Kinder hat
              if (filteredChildren.length === 0) {
                return null;
              }
              return { ...item, children: filteredChildren };
            }
            return item;
          })
          .filter(Boolean) as MenuItem[],
      [shouldShowMenuItem]
    );

    // Memoize menu items combination and filtering
    const filteredMenuItems = useMemo(() => {
      if (DEBUG) {
        console.debug('🔄 Sidebar: Re-calculating menu items', {
          permissionsCount: permissions.length,
          rolesCount: roles.length,
          permissionsLoading,
          isAdmin,
          adminMenuItemsCount: adminMenuItems.length,
          adminNavigationLoading,
        });
      }

      const allMenuItems = [...MENU_ITEMS];

      // Admin-Menüpunkte dynamisch hinzufügen (aus dem Hook)
      if (hasAdminAccess && adminMenuItems.length > 0 && !adminNavigationLoading) {
        if (DEBUG) console.debug('✅ Sidebar: Adding dynamically loaded admin menu items');
        allMenuItems.push(...adminMenuItems);
      } else if (DEBUG) {
        console.debug('❌ Sidebar: Admin menu hidden', {
          hasAdminAccess,
          adminMenuItemsCount: adminMenuItems.length,
          adminNavigationLoading,
        });
      }

      const filtered = filterMenuItems(allMenuItems);
      if (DEBUG)
        console.debug(
          '📋 Sidebar: Final menu items',
          filtered.map((item) => item.text)
        );

      return filtered;
    }, [
      filterMenuItems,
      permissionsLoading,
      isAdmin,
      permissions.length,
      roles.length,
      hasAdminAccess,
      adminMenuItems,
      adminNavigationLoading,
    ]);

    // Prüfe, ob ein Pfad oder eines seiner Kinder aktiv ist
    const isPathActive = (item: MenuItem): boolean => {
      if (location.pathname === item.path) return true;
      if (item.children !== undefined) {
        return item.children.some((child) => location.pathname === child.path);
      }
      return false;
    };

    // Memoize submenu toggle handler
    const handleSubmenuToggle = useCallback((text: string) => {
      setOpenSubmenu((prev) => (prev === text ? null : text));
    }, []);

    /**
     * Auto-expand Admin menu when navigating to admin pages
     * Uses conditional state update to prevent infinite loops
     */
    React.useEffect(() => {
      if (location.pathname.startsWith('/admin') && isAdmin && !permissionsLoading) {
        setOpenSubmenu((prev) => (prev === 'Admin' ? prev : 'Admin'));
      }
    }, [location.pathname, isAdmin, permissionsLoading]);

    // Drawer-Inhalt
    const drawer = (
      <div>
        <Toolbar sx={{ justifyContent: 'center' }}>
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{
              fontWeight: 'bold',
              color: theme.palette.primary.main,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <MenuIcon sx={{ mr: 1 }} />
            SkillSwap
          </Typography>
        </Toolbar>
        <Divider />
        <List sx={{ pt: spacing[1] / 8 }}>
          {filteredMenuItems.map((item) => {
            const isActive = isPathActive(item);
            const hasChildren = item.children !== undefined && item.children.length > 0;
            const isExpanded = openSubmenu === item.text;

            return (
              <React.Fragment key={item.text}>
                <ListItem disablePadding>
                  <ListItemButton
                    component={hasChildren ? 'div' : RouterLink}
                    to={hasChildren ? undefined : item.path}
                    selected={isActive}
                    onClick={
                      hasChildren
                        ? () => {
                            handleSubmenuToggle(item.text);
                          }
                        : onDrawerToggle
                    }
                    sx={{
                      pl: spacing[2] / 8,
                      py: spacing[1] / 8,
                      borderRadius: `0 ${spacing[3]}px ${spacing[3]}px 0`,
                      mr: spacing[1] / 8,
                      color: isActive ? brandColors.primary[500] : 'text.primary',
                      '&.Mui-selected': {
                        bgcolor: 'action.selected',
                        '&:hover': {
                          bgcolor: ACTION_HOVER_STYLE,
                        },
                      },
                      '&:hover': {
                        bgcolor: ACTION_HOVER_STYLE,
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: isActive ? brandColors.primary[500] : 'inherit',
                        minWidth: componentSpacing.avatar.sizeMedium,
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={spacing[1] / 8}>
                          {item.text}
                          {(item.adminRequired === true || item.text === 'Admin') && (
                            <Chip
                              label="Admin"
                              size="small"
                              color="error"
                              sx={{
                                height: spacing[2],
                                fontSize: '0.625rem',
                                '& .MuiChip-label': { px: componentSpacing.chip.paddingY / 8 },
                              }}
                            />
                          )}
                        </Box>
                      }
                      slotProps={{
                        primary: {
                          fontWeight: isActive ? 'medium' : 'regular',
                        },
                      }}
                    />
                    {renderExpandIcon(hasChildren, isExpanded)}
                  </ListItemButton>
                </ListItem>

                {/* Untermenü für Elemente mit Kindern */}
                {hasChildren ? (
                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {item.children
                        ?.filter((child) => !child.adminRequired || isAdmin)
                        .map((child) => (
                          <ListItemButton
                            key={child.text}
                            component={RouterLink}
                            to={child.path}
                            selected={location.pathname === child.path}
                            onClick={onDrawerToggle}
                            sx={{
                              pl: componentSpacing.list.iconGap / 8 + spacing[3] / 8,
                              py: componentSpacing.navigation.itemGap / 8 + 0.25,
                              borderRadius: `0 ${spacing[3]}px ${spacing[3]}px 0`,
                              mr: spacing[1] / 8,
                              color:
                                location.pathname === child.path
                                  ? brandColors.primary[500]
                                  : 'text.primary',
                              '&.Mui-selected': {
                                bgcolor: 'action.selected',
                                '&:hover': {
                                  bgcolor: ACTION_HOVER_STYLE,
                                },
                              },
                              '&:hover': {
                                bgcolor: ACTION_HOVER_STYLE,
                              },
                            }}
                          >
                            <ListItemIcon
                              sx={{
                                color:
                                  location.pathname === child.path
                                    ? brandColors.primary[500]
                                    : 'inherit',
                                minWidth: componentSpacing.avatar.sizeSmall,
                              }}
                            >
                              {child.icon}
                            </ListItemIcon>
                            <ListItemText
                              primary={child.text}
                              slotProps={{
                                primary: {
                                  variant: 'body2',
                                  fontWeight:
                                    location.pathname === child.path ? 'medium' : 'regular',
                                },
                              }}
                            />
                          </ListItemButton>
                        ))}
                    </List>
                  </Collapse>
                ) : null}
              </React.Fragment>
            );
          })}
        </List>

        {/* Chat Button */}
        {isAuthenticated ? (
          <>
            <Divider sx={{ mt: 2, mb: 1 }} />
            <List>
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => {
                    openChatDrawer();
                    if (isMobile) onDrawerToggle();
                  }}
                  sx={{
                    pl: spacing[2] / 8,
                    py: spacing[1] / 8,
                    borderRadius: `0 ${spacing[3]}px ${spacing[3]}px 0`,
                    mr: spacing[1] / 8,
                    '&:hover': {
                      bgcolor: ACTION_HOVER_STYLE,
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: componentSpacing.avatar.sizeMedium,
                    }}
                  >
                    <Badge badgeContent={totalUnreadCount} color="error" max={99}>
                      <ChatIcon />
                    </Badge>
                  </ListItemIcon>
                  <ListItemText primary="Chats" />
                </ListItemButton>
              </ListItem>
            </List>
          </>
        ) : null}
      </div>
    );

    return (
      <Box
        component="nav"
        sx={{
          width: { sm: drawerWidth },
          flexShrink: { sm: 0 },
          display: isMobile && !mobileOpen ? 'none' : 'block',
        }}
        aria-label="Hauptnavigation"
      >
        {/* Mobile-Drawer (temporär) */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={onDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: `1px solid ${theme.palette.divider}`,
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop-Drawer (permanent) */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: `1px solid ${theme.palette.divider}`,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
    );
  }
);

// Add display name for debugging
Sidebar.displayName = 'Sidebar';

export default Sidebar;
