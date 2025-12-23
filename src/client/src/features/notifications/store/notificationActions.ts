/**
 * Notification Actions - Separated to prevent circular dependencies
 *
 * This file contains action types and creators that are used by both
 * notificationSlice and notificationHub without creating import cycles.
 */

import { createAction } from '@reduxjs/toolkit';
import type { Notification } from '../types/Notification';

// Action type constants
const ACTION_PREFIX = 'notifications';

// Action creators used by notificationHub
export const addNotification = createAction<Notification>(`${ACTION_PREFIX}/addNotification`);
export const setConnectionStatus = createAction<boolean>(`${ACTION_PREFIX}/setConnectionStatus`);
export const setConnectionId = createAction<string | null>(`${ACTION_PREFIX}/setConnectionId`);
export const setUnreadCount = createAction<number>(`${ACTION_PREFIX}/setUnreadCount`);
export const setNotifications = createAction<Notification[]>(`${ACTION_PREFIX}/setNotifications`);
