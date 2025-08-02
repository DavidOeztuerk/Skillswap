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
} from '@mui/material';
import {
  Home as HomeIcon,
  Dashboard as DashboardIcon,
  EmojiObjects as SkillsIcon,
  People as MatchmakingIcon,
  // Handshake as MatchesIcon,
  // MailOutline as RequestsIcon,
  Event as AppointmentsIcon,
  Person as ProfileIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Menu as MenuIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';

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
  const { isAuthenticated } = useAuth();
  const [openSubmenu, setOpenSubmenu] = React.useState<string | null>(null);

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

  // Filtere Menüeinträge basierend auf Authentifizierungsstatus
  const filteredMenuItems = menuItems.filter(
    (item) => !item.authRequired || (item.authRequired && isAuthenticated)
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
                    primary={item.text}
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
                    {item.children?.map((child) => (
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

  // Auf Mobile werden wir den Drawer nur als temporary anzeigen
  // Die permanente Navigation erfolgt über die MobileTabbar
  return (
    <Box
      component="nav"
      sx={{
        width: { sm: drawerWidth },
        flexShrink: { sm: 0 },
        // Auf mobilen Geräten zeigen wir nur den temporary Drawer
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
          keepMounted: true, // Bessere Performance auf Mobile
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
