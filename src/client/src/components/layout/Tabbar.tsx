// src/components/layout/MobileTabbar.tsx
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  BottomNavigation,
  BottomNavigationAction,
  Badge,
  useTheme,
  Menu,
  MenuItem,
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
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { useAppSelector } from '../../store/store.hooks';

const Tabbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { isAuthenticated } = useAuth();
  const [moreMenuAnchor, setMoreMenuAnchor] = useState<null | HTMLElement>(null);
  
  // Get dynamic badge counts from Redux store
  const pendingMatches = useAppSelector((state) => state.matchmaking?.matches?.filter((match) => match.status === 'pending') || []);

  // Bestimme den aktiven Pfad für die Navigation mit verbesserter Logik
  const getCurrentPath = () => {
    const path = location.pathname;

    // Exakte Pfadübereinstimmung zuerst
    const exactMatches = ['/', '/dashboard', '/skills', '/matchmaking', '/appointments', '/profile'];
    if (exactMatches.includes(path)) {
      return path;
    }

    // Intelligente Pfad-Zuordnung mit Priorität
    if (path.startsWith('/skills/')) {
      // Skills-Unterpfade werden zu /skills zugeordnet
      return '/skills';
    }
    if (path.startsWith('/matchmaking/')) {
      return '/matchmaking';
    }
    if (path.startsWith('/appointments/')) {
      return '/appointments';
    }
    if (path.startsWith('/profile/') || path.startsWith('/users/')) {
      return '/profile';
    }
    if (path.startsWith('/dashboard/')) {
      return '/dashboard';
    }

    // Für unbekannte Pfade: prüfe ob authentifiziert, dann dashboard, sonst home
    return isAuthenticated ? '/dashboard' : '/';
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

  // Intelligente Mobile Menu Verteilung
  const MAX_VISIBLE_ITEMS = 4; // Reserve space for "More" button
  const visibleMenuItems = filteredMenuItems.slice(0, MAX_VISIBLE_ITEMS);
  const overflowMenuItems = filteredMenuItems.slice(MAX_VISIBLE_ITEMS);
  const hasOverflow = overflowMenuItems?.length > 0;

  const handleMoreClick = (event: React.MouseEvent<HTMLElement>) => {
    setMoreMenuAnchor(event.currentTarget);
  };

  const handleMoreClose = () => {
    setMoreMenuAnchor(null);
  };

  const handleOverflowNavigation = (path: string) => {
    navigate(path);
    handleMoreClose();
  };

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
            if (newValue !== 'more') {
              navigate(newValue);
            }
          }}
          showLabels
          sx={{
            height: { xs: 72, sm: 64 },
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
          {/* Visible Menu Items */}
          {visibleMenuItems.map((item) => (
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
        PaperProps={{
          elevation: 8,
          sx: {
            minWidth: 200,
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
        }}
      >
        {overflowMenuItems.map((item) => {
          const isActive = getCurrentPath() === item.path;
          
          return (
            <MenuItem
              key={item.path}
              onClick={() => handleOverflowNavigation(item.path)}
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
                {item.badge ? (
                  <Badge badgeContent={item.badge} color="error">
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'primary.main' : 'inherit',
                }}
              />
            </MenuItem>
          );
        })}
        
        {overflowMenuItems?.length > 0 && (
          <>
            <Divider sx={{ my: 1 }} />
            <MenuItem
              onClick={handleMoreClose}
              sx={{
                py: 1,
                px: 2,
                color: 'text.secondary',
                fontSize: '0.875rem',
              }}
            >
              Schließen
            </MenuItem>
          </>
        )}
      </Menu>
    </Box>
  );
};

export default Tabbar;
