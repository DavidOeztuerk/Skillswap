// src/components/layout/Header.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Button,
  // Avatar,
  Tooltip,
  Badge,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
  AccountCircle,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';

interface HeaderProps {
  drawerWidth: number;
  onDrawerToggle: () => void;
  darkMode: boolean;
  onToggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({
  drawerWidth,
  onDrawerToggle,
  darkMode,
  onToggleTheme,
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { isAuthenticated, logout } = useAuth();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchorEl, setNotificationAnchorEl] =
    useState<null | HTMLElement>(null);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationMenuClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    await logout();
    navigate('/login');
  };

  const handleProfile = () => {
    handleMenuClose();
    navigate('/profile');
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        width: { sm: `calc(100% - ${drawerWidth}px)` },
        ml: { sm: `${drawerWidth}px` },
        boxShadow: 1,
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="Navigation öffnen"
          edge="start"
          onClick={onDrawerToggle}
          sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{
            flexGrow: 1,
            textDecoration: 'none',
            color: 'inherit',
            fontWeight: 'bold',
            // Bei mobilen Geräten den Namen kürzen oder anpassen
            fontSize: { xs: '1.1rem', sm: '1.25rem' },
          }}
        >
          {isMobile ? 'SkillSwap' : 'SkillSwap Platform'}
        </Typography>

        <IconButton
          color="inherit"
          onClick={onToggleTheme}
          sx={{ ml: 1 }}
          aria-label={
            darkMode
              ? 'Zum hellen Modus wechseln'
              : 'Zum dunklen Modus wechseln'
          }
        >
          {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>

        {isAuthenticated ? (
          <>
            {/* Auf Mobil verstecken wir die Benachrichtigungen im Header, 
                da diese in der Tabbar angezeigt werden */}
            {!isMobile && (
              <IconButton
                color="inherit"
                onClick={handleNotificationMenuOpen}
                sx={{ ml: 1 }}
                aria-label="Benachrichtigungen"
              >
                <Badge badgeContent={3} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            )}

            <Tooltip title="Einstellungen öffnen">
              <IconButton
                onClick={handleProfileMenuOpen}
                sx={{ ml: 1 }}
                aria-label="Benutzerprofil"
              >
                <AccountCircle />
              </IconButton>
            </Tooltip>

            <Menu
              id="notification-menu"
              anchorEl={notificationAnchorEl}
              open={Boolean(notificationAnchorEl)}
              onClose={handleNotificationMenuClose}
              PaperProps={{
                elevation: 0,
                sx: {
                  overflow: 'visible',
                  filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                  mt: 1.5,
                  '& .MuiAvatar-root': {
                    width: 32,
                    height: 32,
                    ml: -0.5,
                    mr: 1,
                  },
                  '&::before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    right: 14,
                    width: 10,
                    height: 10,
                    bgcolor: 'background.paper',
                    transform: 'translateY(-50%) rotate(45deg)',
                    zIndex: 0,
                  },
                },
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={handleNotificationMenuClose}>
                <Typography variant="subtitle2">
                  Neue Match-Anfrage von Thomas
                </Typography>
              </MenuItem>
              <MenuItem onClick={handleNotificationMenuClose}>
                <Typography variant="subtitle2">
                  Termin bestätigt für morgen
                </Typography>
              </MenuItem>
              <MenuItem onClick={handleNotificationMenuClose}>
                <Typography variant="subtitle2">
                  Dein Skill wurde bestätigt
                </Typography>
              </MenuItem>
            </Menu>

            <Menu
              id="profile-menu"
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              PaperProps={{
                elevation: 0,
                sx: {
                  overflow: 'visible',
                  filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                  mt: 1.5,
                  '& .MuiAvatar-root': {
                    width: 32,
                    height: 32,
                    ml: -0.5,
                    mr: 1,
                  },
                  '&::before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    right: 14,
                    width: 10,
                    height: 10,
                    bgcolor: 'background.paper',
                    transform: 'translateY(-50%) rotate(45deg)',
                    zIndex: 0,
                  },
                },
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={handleProfile}>Profil</MenuItem>
              <MenuItem onClick={handleLogout}>Abmelden</MenuItem>
            </Menu>
          </>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Auf mobilen Geräten nur den Login-Button anzeigen */}
            {isMobile ? (
              <Button
                variant="contained"
                color="secondary"
                component={Link}
                to="/login"
                size="small"
                sx={{ textTransform: 'none' }}
              >
                Login
              </Button>
            ) : (
              <>
                <Button
                  color="inherit"
                  component={Link}
                  to="/login"
                  sx={{ textTransform: 'none' }}
                >
                  Anmelden
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  component={Link}
                  to="/register"
                  sx={{ textTransform: 'none' }}
                >
                  Registrieren
                </Button>
              </>
            )}
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
