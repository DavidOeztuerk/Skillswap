// src/components/notifications/NotificationBell.tsx
import React, { useState } from 'react';
import {
  IconButton,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationCenter from './NotificationCenter';

/**
 * Notification Bell Component für den Header
 * Zeigt ungelesene Benachrichtigungen an und öffnet das Notification Center
 */
const NotificationBell: React.FC = () => {
  const { unreadCount } = useNotifications();
  const [centerOpen, setCenterOpen] = useState(false);

  const handleBellClick = () => {
    setCenterOpen(true);
  };

  const handleCenterClose = () => {
    setCenterOpen(false);
  };

  return (
    <>
      <Tooltip title="Benachrichtigungen">
        <IconButton
          color="inherit"
          onClick={handleBellClick}
          aria-label={`${unreadCount} ungelesene Benachrichtigungen`}
        >
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>
      
      <NotificationCenter
        open={centerOpen}
        onClose={handleCenterClose}
      />
    </>
  );
};

export default NotificationBell;