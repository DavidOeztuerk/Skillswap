import React, { useMemo, useCallback, useEffect } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
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
import { componentSpacing, spacing, brandColors } from '../../styles/tokens';
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
  AdminPanelSettings as AdminIcon,
  Group as UsersIcon,
  Psychology as AdminSkillsIcon,
  EventNote as AdminAppointmentsIcon,
  Analytics as AnalyticsIcon,
  HealthAndSafety as SystemHealthIcon,
  History as AuditLogsIcon,
  Gavel as ModerationIcon,
  Settings as AdminSettingsIcon,
  ConnectWithoutContact as MatchesIcon,
  Security as SecurityIcon,
  Shield as ShieldIcon,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { Permissions } from '../auth/permissions.constants';
import { usePermissions } from '@/contexts/permissionContextHook';

const DEBUG = import.meta.env.DEV && import.meta.env.VITE_VERBOSE_SIDEBAR === 'true';

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
];

// Admin-Menüeinträge - defined outside component to prevent recreation
const ADMIN_MENU_ITEMS: MenuItem[] = [
  {
    text: 'Admin',
    icon: <AdminIcon />,
    path: '/admin',
    authRequired: true,
    permissions: [Permissions.Admin.ACCESS_DASHBOARD],
    children: [
      {
        text: 'Dashboard',
        icon: <DashboardIcon fontSize="small" />,
        path: '/admin/dashboard',
        authRequired: true,
        permissions: [Permissions.Admin.ACCESS_DASHBOARD],
      },
      {
        text: 'Benutzer',
        icon: <UsersIcon fontSize="small" />,
        path: '/admin/users',
        authRequired: true,
        permissions: [Permissions.Users.VIEW_ALL],
      },
      {
        text: 'Skills',
        icon: <AdminSkillsIcon fontSize="small" />,
        path: '/admin/skills',
        authRequired: true,
        permissions: [Permissions.Skills.MANAGE_CATEGORIES, Permissions.Skills.MANAGE_PROFICIENCY],
      },
      {
        text: 'Skill Kategorien',
        icon: <AdminSkillsIcon fontSize="small" />,
        path: '/admin/skills/categories',
        authRequired: true,
        permissions: [Permissions.Skills.MANAGE_CATEGORIES],
      },
      {
        text: 'Proficiency Levels',
        icon: <AdminSkillsIcon fontSize="small" />,
        path: '/admin/skills/proficiency',
        authRequired: true,
        permissions: [Permissions.Skills.MANAGE_PROFICIENCY],
      },
      {
        text: 'Matches',
        icon: <MatchesIcon fontSize="small" />,
        path: '/admin/matches',
        authRequired: true,
        permissions: [Permissions.Matching.VIEW_ALL],
      },
      {
        text: 'Termine',
        icon: <AdminAppointmentsIcon fontSize="small" />,
        path: '/admin/appointments',
        authRequired: true,
        permissions: [Permissions.Appointments.VIEW_ALL],
      },
      {
        text: 'Analytics',
        icon: <AnalyticsIcon fontSize="small" />,
        path: '/admin/analytics',
        authRequired: true,
        permissions: [Permissions.Admin.VIEW_STATISTICS],
      },
      {
        text: 'Rollen & Berechtigungen',
        icon: <SecurityIcon fontSize="small" />,
        path: '/admin/roles',
        authRequired: true,
        permissions: [Permissions.Roles.VIEW],
      },
      {
        text: 'System Health',
        icon: <SystemHealthIcon fontSize="small" />,
        path: '/admin/system-health',
        authRequired: true,
        permissions: [Permissions.System.VIEW_LOGS],
      },
      {
        text: 'Audit Logs',
        icon: <AuditLogsIcon fontSize="small" />,
        path: '/admin/audit-logs',
        authRequired: true,
        permissions: [Permissions.System.VIEW_LOGS],
      },
      {
        text: 'Security Monitoring',
        icon: <ShieldIcon fontSize="small" />,
        path: '/admin/security',
        authRequired: true,
        permissions: [Permissions.System.VIEW_LOGS, Permissions.Security.VIEW_ALERTS],
      },
      {
        text: 'Moderation',
        icon: <ModerationIcon fontSize="small" />,
        path: '/admin/moderation',
        authRequired: true,
        permissions: [Permissions.Moderation.HANDLE_REPORTS, Permissions.Reviews.MODERATE],
      },
      {
        text: 'Einstellungen',
        icon: <AdminSettingsIcon fontSize="small" />,
        path: '/admin/settings',
        authRequired: true,
        permissions: [Permissions.System.MANAGE_SETTINGS],
      },
    ],
  },
];

const Sidebar: React.FC<SidebarProps> = React.memo(
  ({ drawerWidth, mobileOpen, onDrawerToggle }) => {
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { isAuthenticated } = useAuth();
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

    // Log admin status changes in a separate effect (only in debug mode)
    useEffect(() => {
      if (DEBUG && !permissionsLoading) {
        console.debug('🔐 Sidebar: Admin check', {
          isAdminFromContext,
          permissionsLoading,
          result: isAdmin,
        });
      }
    }, [isAdmin, isAdminFromContext, permissionsLoading]);

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
        });
      }

      const allMenuItems = [...MENU_ITEMS];

      // Check both permission and admin role for admin access
      const hasAdminPermission = hasPermission(Permissions.Admin.ACCESS_DASHBOARD);
      const hasAdminAccess = !permissionsLoading && (hasAdminPermission || isAdmin);

      if (DEBUG) {
        console.debug('🔍 Sidebar: Admin access check', {
          permissionsLoading,
          hasAdminPermission,
          isAdmin,
          hasAdminAccess,
          willShowAdminMenu: hasAdminAccess,
        });
      }

      if (hasAdminAccess) {
        if (DEBUG) console.debug('✅ Sidebar: Adding admin menu items');
        allMenuItems.push(...ADMIN_MENU_ITEMS);
      } else {
        if (DEBUG) console.debug('❌ Sidebar: Admin menu hidden - no access');
      }

      const filtered = filterMenuItems(allMenuItems);
      if (DEBUG)
        console.debug(
          '📋 Sidebar: Final menu items',
          filtered.map((item) => item.text)
        );

      return filtered;
    }, [
      hasPermission,
      filterMenuItems,
      permissionsLoading,
      isAdmin,
      permissions.length,
      roles.length,
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
                      borderRadius: `0 ${String(spacing[3])}px ${String(spacing[3])}px 0`,
                      mr: spacing[1] / 8,
                      color: isActive ? brandColors.primary[500] : 'text.primary',
                      '&.Mui-selected': {
                        bgcolor: 'action.selected',
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                      },
                      '&:hover': {
                        bgcolor: 'action.hover',
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
                    {hasChildren && (isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />)}
                  </ListItemButton>
                </ListItem>

                {/* Untermenü für Elemente mit Kindern */}
                {hasChildren && (
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
                              borderRadius: `0 ${String(spacing[3])}px ${String(spacing[3])}px 0`,
                              mr: spacing[1] / 8,
                              color:
                                location.pathname === child.path
                                  ? brandColors.primary[500]
                                  : 'text.primary',
                              '&.Mui-selected': {
                                bgcolor: 'action.selected',
                                '&:hover': {
                                  bgcolor: 'action.hover',
                                },
                              },
                              '&:hover': {
                                bgcolor: 'action.hover',
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
                )}
              </React.Fragment>
            );
          })}
        </List>
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
