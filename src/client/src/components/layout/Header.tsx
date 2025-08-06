// src/components/layout/Header.tsx
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
  // Badge,
  useTheme,
  useMediaQuery,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  // Notifications as NotificationsIcon,
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
  AccountCircle,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import SearchBar from './Searchbar';
import MobileSearchBar from './MobileSearchbar';
import NotificationBell from '../notifications/NotificationBell';
import { useSearchNavigation } from '../../hooks/useSearchNavigation';
// import { useAnnouncements } from '../../hooks/useAnnouncements';

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
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const theme = useTheme();

  // Responsive Breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const { isAuthenticated, logout } = useAuth();
  const { isOpen: searchOpen, openSearch, closeSearch } = useSearchNavigation();

  // States für Menüs
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchorEl, setNotificationAnchorEl] =
    useState<null | HTMLElement>(null);
  const [moreMenuAnchorEl, setMoreMenuAnchorEl] = useState<null | HTMLElement>(
    null
  );

  // Handler für Menüaktionen
  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  // const handleNotificationMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
  //   setNotificationAnchorEl(event.currentTarget);
  // };

  const handleMoreMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMoreMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationMenuClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleMoreMenuClose = () => {
    setMoreMenuAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    handleMoreMenuClose();
    await logout();
    navigate('/auth/login');
  };

  const handleProfile = () => {
    handleMenuClose();
    handleMoreMenuClose();
    navigate('/profile');
  };

  const handleOpenMobileSearch = () => {
    openSearch();
  };

  const handleCloseMobileSearch = () => {
    closeSearch();
  };

  const handleThemeToggleFromMenu = () => {
    onToggleTheme();
    handleMoreMenuClose();
  };

  // Render der rechten Seite der Toolbar (Buttons und Icons)
  const renderRightSideItems = () => {
    if (isMobile) {
      // Mobile: nur Icons für Notifikationen und Mehr-Menü
      return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            color="inherit"
            onClick={handleOpenMobileSearch}
            aria-label="Suche öffnen"
          >
            <SearchIcon />
          </IconButton>

          {isAuthenticated && <NotificationBell />}

          <IconButton
            color="inherit"
            aria-label="Mehr Optionen"
            onClick={handleMoreMenuOpen}
          >
            <MoreVertIcon />
          </IconButton>
        </Box>
      );
    } else if (isTablet) {
      // Tablet: Theme-Icon, Notifikation, Mehr-Button
      return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            color="inherit"
            onClick={onToggleTheme}
            aria-label={
              darkMode
                ? 'Zum hellen Modus wechseln'
                : 'Zum dunklen Modus wechseln'
            }
          >
            {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>

          {isAuthenticated && <NotificationBell />}

          <IconButton
            color="inherit"
            aria-label="Mehr Optionen"
            onClick={handleMoreMenuOpen}
            sx={{ ml: 1 }}
          >
            <MoreVertIcon />
          </IconButton>
        </Box>
      );
    } else {
      // Desktop: Alle Buttons sichtbar
      return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            color="inherit"
            onClick={onToggleTheme}
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
              <NotificationBell />

              <Tooltip title="Profil öffnen">
                <IconButton
                  onClick={handleProfileMenuOpen}
                  sx={{ ml: 1 }}
                  aria-label="Benutzerprofil"
                >
                  <AccountCircle />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
              <Button
                color="inherit"
                component={Link}
                to="/auth/login"
                sx={{ textTransform: 'none' }}
              >
                Anmelden
              </Button>
              <Button
                variant="contained"
                color="secondary"
                component={Link}
                to="/auth/register"
                sx={{ textTransform: 'none' }}
              >
                Registrieren
              </Button>
            </Box>
          )}
        </Box>
      );
    }
  };

  // Erstellen der Menüelemente für nicht angemeldete Benutzer
  const renderUnauthenticatedMenuItems = () => [
    <MenuItem
      key="login"
      component={Link}
      to="/auth/login"
      onClick={handleMoreMenuClose}
    >
      Anmelden
    </MenuItem>,
    <MenuItem
      key="register"
      component={Link}
      to="/auth/register"
      onClick={handleMoreMenuClose}
    >
      Registrieren
    </MenuItem>,
  ];

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          width: isHomePage ? '100%' : { sm: `calc(100% - ${drawerWidth}px)` },
          ml: isHomePage ? 0 : { sm: `${drawerWidth}px` },
          boxShadow: 1,
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ px: { xs: 1, sm: 2 } }}>
          {/* Linke Seite - Logo und Navigations-Toggle */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              minWidth: isMobile ? 'auto' : '150px',
            }}
          >
            {!isHomePage && (
              <IconButton
                color="inherit"
                aria-label="Navigation öffnen"
                edge="start"
                onClick={onDrawerToggle}
                sx={{ mr: 1, display: { sm: 'none' } }}
              >
                <MenuIcon />
              </IconButton>
            )}

            <Typography
              variant="h6"
              component={Link}
              to="/"
              sx={{
                textDecoration: 'none',
                color: 'inherit',
                fontWeight: 'bold',
                fontSize: isMobile ? '1.1rem' : '1.25rem',
                whiteSpace: 'nowrap',
              }}
            >
              {isMobile ? 'SkillSwap' : 'SkillShare'}
            </Typography>
          </Box>

          {/* Mittlere Seite - Suchleiste (maximale Breite) */}
          {!isMobile && (
            <Box
              sx={{
                flexGrow: 1,
                mx: 2,
                maxWidth: { sm: '100%' },
                width: '100%',
              }}
            >
              <SearchBar />
            </Box>
          )}

          {/* Flexible Spacer zwischen Suchleiste und Buttons */}
          <Box sx={{ flexGrow: isMobile ? 1 : 0 }} />

          {/* Rechte Seite - Icons und Buttons */}
          {renderRightSideItems()}
        </Toolbar>
      </AppBar>

      {/* Mobile Suchleiste als Overlay */}
      <MobileSearchBar
        open={searchOpen}
        onClose={handleCloseMobileSearch}
      />

      {/* Mehr-Menü für Optionen auf kleinen Bildschirmen */}
      <Menu
        id="more-menu"
        anchorEl={moreMenuAnchorEl}
        open={Boolean(moreMenuAnchorEl)}
        onClose={handleMoreMenuClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
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
        <MenuItem onClick={handleThemeToggleFromMenu}>
          {darkMode ? 'Zum hellen Modus' : 'Zum dunklen Modus'}
        </MenuItem>

        {isAuthenticated ? (
          <MenuItem onClick={handleProfile}>Profil</MenuItem>
        ) : (
          renderUnauthenticatedMenuItems()
        )}

        {isAuthenticated && [
          <Divider key="divider" />,
          <MenuItem key="logout" onClick={handleLogout}>
            Abmelden
          </MenuItem>,
        ]}
      </Menu>

      {/* Notification-Menü */}
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

      {/* Profil-Menü */}
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
  );
};

export default Header;
