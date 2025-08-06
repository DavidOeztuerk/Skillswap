// src/components/layout/Sidebar.tsx
import React from 'react';
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
  Assessment as MetricsIcon,
  ConnectWithoutContact as MatchesIcon,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { hasAdminRole } from '../../utils/auth';

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

const Sidebar: React.FC<SidebarProps> = ({
  drawerWidth,
  mobileOpen,
  onDrawerToggle,
}) => {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { isAuthenticated, user } = useAuth();
  const [openSubmenu, setOpenSubmenu] = React.useState<string | null>(null);
  
  const isAdmin = hasAdminRole(user?.roles);

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
  ];

  // Admin-Menüeinträge
  const adminMenuItems: MenuItem[] = [
    {
      text: 'Admin',
      icon: <AdminIcon />,
      path: '/admin',
      authRequired: true,
      adminRequired: true,
      children: [
        {
          text: 'Dashboard',
          icon: <DashboardIcon fontSize="small" />,
          path: '/admin/dashboard',
          authRequired: true,
          adminRequired: true,
        },
        {
          text: 'Benutzer',
          icon: <UsersIcon fontSize="small" />,
          path: '/admin/users',
          authRequired: true,
          adminRequired: true,
        },
        {
          text: 'Skills',
          icon: <AdminSkillsIcon fontSize="small" />,
          path: '/admin/skills',
          authRequired: true,
          adminRequired: true,
        },
        {
          text: 'Matches',
          icon: <MatchesIcon fontSize="small" />,
          path: '/admin/matches',
          authRequired: true,
          adminRequired: true,
        },
        {
          text: 'Termine',
          icon: <AdminAppointmentsIcon fontSize="small" />,
          path: '/admin/appointments',
          authRequired: true,
          adminRequired: true,
        },
        {
          text: 'Analytics',
          icon: <AnalyticsIcon fontSize="small" />,
          path: '/admin/analytics',
          authRequired: true,
          adminRequired: true,
        },
        {
          text: 'Metriken',
          icon: <MetricsIcon fontSize="small" />,
          path: '/admin/metrics',
          authRequired: true,
          adminRequired: true,
        },
        {
          text: 'System Health',
          icon: <SystemHealthIcon fontSize="small" />,
          path: '/admin/system-health',
          authRequired: true,
          adminRequired: true,
        },
        {
          text: 'Audit Logs',
          icon: <AuditLogsIcon fontSize="small" />,
          path: '/admin/audit-logs',
          authRequired: true,
          adminRequired: true,
        },
        {
          text: 'Moderation',
          icon: <ModerationIcon fontSize="small" />,
          path: '/admin/moderation',
          authRequired: true,
          adminRequired: true,
        },
        {
          text: 'Einstellungen',
          icon: <AdminSettingsIcon fontSize="small" />,
          path: '/admin/settings',
          authRequired: true,
          adminRequired: true,
        },
      ],
    },
  ];

  // Kombiniere Menüs und filtere basierend auf Berechtigung
  const allMenuItems = [...menuItems, ...(isAdmin ? adminMenuItems : [])];
  const filteredMenuItems = allMenuItems.filter(
    (item) => {
      if (item.adminRequired && !isAdmin) return false;
      return !item.authRequired || (item.authRequired && isAuthenticated);
    }
  );

  // Prüfe, ob ein Pfad oder eines seiner Kinder aktiv ist
  const isPathActive = (item: MenuItem): boolean => {
    if (location.pathname === item.path) return true;
    if (item.children) {
      return item.children.some((child) => location.pathname === child.path);
    }
    return false;
  };

  // Toggle Untermenü
  const handleSubmenuToggle = (text: string) => {
    setOpenSubmenu((prev) => (prev === text ? null : text));
  };

  // Auto-expand Admin menu if we're on an admin page
  React.useEffect(() => {
    if (location.pathname.startsWith('/admin') && isAdmin) {
      setOpenSubmenu('Admin');
    }
  }, [location.pathname, isAdmin]);

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
                        {item.adminRequired && (
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
};

export default Sidebar;