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
import { useAppSelector } from '../../store/store.hooks';

const Tabbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { isAuthenticated } = useAuth();
  
  // Get dynamic badge counts from Redux store
  const pendingMatches = useAppSelector((state) => state.matchmaking?.matches?.filter((match) => match.status === 'Pending') || []);

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
      badge: pendingMatches.length
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
            height: { xs: 72, sm: 64 }, // Increased height for mobile
            '& .MuiBottomNavigationAction-root': {
              minWidth: 'auto',
              minHeight: { xs: 72, sm: 64 },
              padding: { xs: '8px 4px', sm: '6px 0' },
              color: theme.palette.text.secondary,
              transition: 'all 0.2s ease-in-out',
              '&.Mui-selected': {
                color: theme.palette.primary.main,
                transform: { xs: 'scale(1.05)', sm: 'scale(1)' },
              },
              '&:active': {
                transform: 'scale(0.95)',
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
              '& .MuiSvgIcon-root': {
                fontSize: { xs: '1.75rem', sm: '1.5rem' },
              },
              '& .MuiBottomNavigationAction-label': {
                fontSize: { xs: '0.75rem', sm: '0.625rem' },
                marginTop: { xs: '4px', sm: '2px' },
                '&.Mui-selected': {
                  fontSize: { xs: '0.8rem', sm: '0.75rem' },
                  fontWeight: 600,
                },
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
