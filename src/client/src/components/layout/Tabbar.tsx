// src/components/layout/MobileTabbar.tsx
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  BottomNavigation,
  BottomNavigationAction,
  Badge,
  useTheme,
} from '@mui/material';
import {
  Home as HomeIcon,
  Dashboard as DashboardIcon,
  EmojiObjects as SkillsIcon,
  People as MatchmakingIcon,
  Event as AppointmentsIcon,
  Person as ProfileIcon,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';

const Tabbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { isAuthenticated } = useAuth();

  // Bestimme den aktiven Pfad für die Navigation
  const getCurrentPath = () => {
    const path = location.pathname;

    // Genaue Pfadübereinstimmung
    if (path === '/') return '/';
    if (path === '/dashboard') return '/dashboard';
    if (path.startsWith('/skills')) return '/skills';
    if (path.startsWith('/matchmaking')) return '/matchmaking';
    if (path.startsWith('/appointments')) return '/appointments';
    if (path.startsWith('/profile')) return '/profile';

    // Standardwert, wenn kein Match
    return '/';
  };

  const menuItems = [
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
      badge: 2, // Beispielwert für Benachrichtigungen
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

  // Filtere Menüeinträge basierend auf Authentifizierungsstatus
  const filteredMenuItems = menuItems.filter(
    (item) => !item.authRequired || (item.authRequired && isAuthenticated)
  );

  // Beschränke die Anzahl der Menüpunkte für Mobile auf 5,
  // auch wenn mehr verfügbar sind
  const mobileMenuItems = filteredMenuItems.slice(0, 5);

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
          value={getCurrentPath()}
          onChange={(_, newValue) => {
            navigate(newValue);
          }}
          showLabels
          sx={{
            height: 64,
            '& .MuiBottomNavigationAction-root': {
              minWidth: 'auto',
              padding: '6px 0',
              color: theme.palette.text.secondary,
              '&.Mui-selected': {
                color: theme.palette.primary.main,
              },
            },
          }}
        >
          {mobileMenuItems.map((item) => (
            <BottomNavigationAction
              key={item.path}
              label={item.label}
              value={item.path}
              icon={
                item.badge ? (
                  <Badge badgeContent={item.badge} color="error">
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )
              }
            />
          ))}
        </BottomNavigation>
      </Paper>
    </Box>
  );
};

export default Tabbar;
