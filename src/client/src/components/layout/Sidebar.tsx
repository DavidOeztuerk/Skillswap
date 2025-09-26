// src/components/layout/Sidebar.tsx
import React, { useMemo, useCallback } from 'react';
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
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../contexts/PermissionContext';

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

const Sidebar: React.FC<SidebarProps> = React.memo(({
  drawerWidth,
  mobileOpen,
  onDrawerToggle,
}) => {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { isAuthenticated } = useAuth();
  const { 
    hasPermission, 
    isAdmin: isAdminFromContext, 
    loading: permissionsLoading,
    permissions,
    roles 
  } = usePermissions();
  const [openSubmenu, setOpenSubmenu] = React.useState<string | null>(null);
  
  // Memoize isAdmin check - Re-evaluate when context changes or loading completes
  const isAdmin = useMemo(() => {
    if (permissionsLoading) {
      console.log('🔄 Sidebar: Permissions still loading, hiding admin menu');
      return false; // Don't show admin menu while loading
    }
    
    console.log('🔐 Sidebar: Admin check', { 
      isAdminFromContext, 
      permissionsLoading,
      result: isAdminFromContext 
    });
    
    return isAdminFromContext;
  }, [isAdminFromContext, permissionsLoading]);

  // Haupt-Menüeinträge
  const menuItems: MenuItem[] = [
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
      children: [
        { text: 'Anfragen', icon: null, path: '/matchmaking', authRequired: true },
        { text: 'Meine Matches', icon: null, path: '/matchmaking/matches', authRequired: true },
      ],
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

  // Admin-Menüeinträge
  const adminMenuItems: MenuItem[] = [
    {
      text: 'Admin',
      icon: <AdminIcon />,
      path: '/admin',
      authRequired: true,
      permissions: ['admin:access_dashboard'],
      children: [
        {
          text: 'Dashboard',
          icon: <DashboardIcon fontSize="small" />,
          path: '/admin/dashboard',
          authRequired: true,
          permissions: ['admin:access_dashboard'],
        },
        {
          text: 'Benutzer',
          icon: <UsersIcon fontSize="small" />,
          path: '/admin/users',
          authRequired: true,
          permissions: ['users:view_all'],
        },
        {
          text: 'Skills',
          icon: <AdminSkillsIcon fontSize="small" />,
          path: '/admin/skills',
          authRequired: true,
          permissions: ['skills:manage_categories', 'skills:manage_proficiency'],
        },
        {
          text: 'Skill Kategorien',
          icon: <AdminSkillsIcon fontSize="small" />,
          path: '/admin/skills/categories',
          authRequired: true,
          permissions: ['skills:manage_categories'],
        },
        {
          text: 'Proficiency Levels',
          icon: <AdminSkillsIcon fontSize="small" />,
          path: '/admin/skills/proficiency',
          authRequired: true,
          permissions: ['skills:manage_proficiency'],
        },
        {
          text: 'Matches',
          icon: <MatchesIcon fontSize="small" />,
          path: '/admin/matches',
          authRequired: true,
          permissions: ['matching:view_all'],
        },
        {
          text: 'Termine',
          icon: <AdminAppointmentsIcon fontSize="small" />,
          path: '/admin/appointments',
          authRequired: true,
          permissions: ['appointments:view_all'],
        },
        {
          text: 'Analytics',
          icon: <AnalyticsIcon fontSize="small" />,
          path: '/admin/analytics',
          authRequired: true,
          permissions: ['admin:view_statistics'],
        },
        {
          text: 'Rollen & Berechtigungen',
          icon: <SecurityIcon fontSize="small" />,
          path: '/admin/roles',
          authRequired: true,
          permissions: ['roles:view'],
        },
        {
          text: 'System Health',
          icon: <SystemHealthIcon fontSize="small" />,
          path: '/admin/system-health',
          authRequired: true,
          permissions: ['system:view_logs'],
        },
        {
          text: 'Audit Logs',
          icon: <AuditLogsIcon fontSize="small" />,
          path: '/admin/audit-logs',
          authRequired: true,
          permissions: ['system:view_logs'],
        },
        {
          text: 'Moderation',
          icon: <ModerationIcon fontSize="small" />,
          path: '/admin/moderation',
          authRequired: true,
          permissions: ['reports:handle', 'reviews:moderate'],
        },
        {
          text: 'Einstellungen',
          icon: <AdminSettingsIcon fontSize="small" />,
          path: '/admin/settings',
          authRequired: true,
          permissions: ['system:manage_settings'],
        },
      ],
    },
  ];

  // Memoize permission check functions
  const shouldShowMenuItem = useCallback((item: MenuItem): boolean => {
    // Prüfe Authentifizierung
    if (item.authRequired && !isAuthenticated) return false;
    
    // Prüfe Admin-Rolle (legacy support)
    if (item.adminRequired && !isAdmin) return false;
    
    // Admin und SuperAdmin sehen alle Admin-Menüeinträge
    if (isAdmin && item.path && item.path.startsWith('/admin')) {
      return true;
    }
    
    // Prüfe Permissions für normale User
    if (item.permissions && item.permissions.length > 0) {
      // Zeige Menüeintrag, wenn User mindestens eine der Permissions hat
      return item.permissions?.some(permission => hasPermission(permission));
    }
    
    return true;
  }, [isAuthenticated, isAdmin, hasPermission]);

  // Memoize filter function
  const filterMenuItems = useCallback((items: MenuItem[]): MenuItem[] => {
    return items
      .filter(shouldShowMenuItem)
      .map(item => {
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
      .filter(Boolean) as MenuItem[];
  }, [shouldShowMenuItem]);

  // Memoize menu items combination and filtering
  const filteredMenuItems = useMemo(() => {
    console.log('🔄 Sidebar: Re-calculating menu items', { 
      permissionsCount: permissions.length,
      rolesCount: roles.length,
      permissionsLoading,
      isAdmin
    });
    
    const allMenuItems = [...menuItems];
    
    // Check both permission and admin role for admin access
    const hasAdminPermission = hasPermission('admin:access_dashboard');
    const hasAdminAccess = !permissionsLoading && (hasAdminPermission || isAdmin);
    
    console.log('🔍 Sidebar: Admin access check', { 
      permissionsLoading,
      hasAdminPermission,
      isAdmin,
      hasAdminAccess,
      willShowAdminMenu: hasAdminAccess
    });
    
    if (hasAdminAccess) {
      console.log('✅ Sidebar: Adding admin menu items');
      allMenuItems.push(...adminMenuItems);
    } else {
      console.log('❌ Sidebar: Admin menu hidden - no access');
    }
    
    const filtered = filterMenuItems(allMenuItems);
    console.log('📋 Sidebar: Final menu items', filtered.map(item => item.text));
    
    return filtered;
  }, [hasPermission, filterMenuItems, permissionsLoading, isAdmin, permissions, roles]);

  // Prüfe, ob ein Pfad oder eines seiner Kinder aktiv ist
  const isPathActive = (item: MenuItem): boolean => {
    if (location.pathname === item.path) return true;
    if (item.children) {
      return item.children?.some((child) => location.pathname === child.path);
    }
    return false;
  };

  // Memoize submenu toggle handler
  const handleSubmenuToggle = useCallback((text: string) => {
    setOpenSubmenu((prev) => (prev === text ? null : text));
  }, []);

  // TEMPORARY DISABLE - PREVENTING INFINITE LOOPS!
  // React.useEffect(() => {
  //   if (location.pathname.startsWith('/admin') && isAdmin && !permissionsLoading) {
  //     setOpenSubmenu('Admin');
  //   }
  // }, [location.pathname, isAdmin, permissionsLoading]);

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
      <List sx={{ pt: 1 }}>
        {filteredMenuItems.map((item) => {
          const isActive = isPathActive(item);
          const hasChildren = item.children && item.children?.length > 0;
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
                      ? () => handleSubmenuToggle(item.text)
                      : onDrawerToggle
                  }
                  sx={{
                    pl: 2,
                    py: 1,
                    borderRadius: '0 24px 24px 0',
                    mr: 1,
                    color: isActive ? 'primary.main' : 'text.primary',
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
                      color: isActive ? 'primary.main' : 'inherit',
                      minWidth: 40,
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        {item.text}
                        {(item.adminRequired || item.text === 'Admin') && (
                          <Chip
                            label="Admin"
                            size="small"
                            color="error"
                            sx={{ 
                              height: 16, 
                              fontSize: '0.625rem',
                              '& .MuiChip-label': { px: 0.5 }
                            }}
                          />
                        )}
                      </Box>
                    }
                    primaryTypographyProps={{
                      fontWeight: isActive ? 'medium' : 'regular',
                    }}
                  />
                  {hasChildren &&
                    (isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />)}
                </ListItemButton>
              </ListItem>

              {/* Untermenü für Elemente mit Kindern */}
              {hasChildren && (
                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.children?.filter(child => 
                      !child.adminRequired || isAdmin
                    ).map((child) => (
                      <ListItemButton
                        key={child.text}
                        component={RouterLink}
                        to={child.path}
                        selected={location.pathname === child.path}
                        onClick={onDrawerToggle}
                        sx={{
                          pl: 5,
                          py: 0.75,
                          borderRadius: '0 24px 24px 0',
                          mr: 1,
                          color:
                            location.pathname === child.path
                              ? 'primary.main'
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
                                ? 'primary.main'
                                : 'inherit',
                            minWidth: 32,
                          }}
                        >
                          {child.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={child.text}
                          primaryTypographyProps={{
                            variant: 'body2',
                            fontWeight:
                              location.pathname === child.path
                                ? 'medium'
                                : 'regular',
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
});

// Add display name for debugging
Sidebar.displayName = 'Sidebar';

export default Sidebar;