import React, { lazy } from 'react';
import { Permissions } from '../../../../features/auth/components/permissions.constants';
import IconWrapper from '../IconWrapper';
import type { MenuItem } from '../../../types/layout/types';

// ============================================================================
// Lazy-Loaded Admin Icons
// ============================================================================

const AdminIcon = lazy(() => import('@mui/icons-material/AdminPanelSettings'));
const UsersIcon = lazy(() => import('@mui/icons-material/Group'));
const AdminSkillsIcon = lazy(() => import('@mui/icons-material/Psychology'));
const AdminAppointmentsIcon = lazy(() => import('@mui/icons-material/EventNote'));
const AnalyticsIcon = lazy(() => import('@mui/icons-material/Analytics'));
const SystemHealthIcon = lazy(() => import('@mui/icons-material/HealthAndSafety'));
const AuditLogsIcon = lazy(() => import('@mui/icons-material/History'));
const ModerationIcon = lazy(() => import('@mui/icons-material/Gavel'));
const AdminSettingsIcon = lazy(() => import('@mui/icons-material/Settings'));
const MatchesIcon = lazy(() => import('@mui/icons-material/ConnectWithoutContact'));
const SecurityIcon = lazy(() => import('@mui/icons-material/Security'));
const ShieldIcon = lazy(() => import('@mui/icons-material/Shield'));
const EmailIcon = lazy(() => import('@mui/icons-material/Email'));
const DashboardIcon = lazy(() => import('@mui/icons-material/Dashboard'));

/**
 * Returns admin menu items only when needed
 * This module is dynamically imported, so it won't be in the initial bundle
 */
export const getAdminMenuItems = (): MenuItem[] => [
  {
    text: 'Admin',
    icon: (
      <IconWrapper>
        <AdminIcon />
      </IconWrapper>
    ),
    path: '/admin',
    authRequired: true,
    permissions: [Permissions.Admin.ACCESS_DASHBOARD],
    adminRequired: true,
    children: [
      {
        text: 'Dashboard',
        icon: (
          <IconWrapper size="small">
            <DashboardIcon />
          </IconWrapper>
        ),
        path: '/admin/dashboard',
        authRequired: true,
        permissions: [Permissions.Admin.ACCESS_DASHBOARD],
        adminRequired: true,
      },
      {
        text: 'Benutzer',
        icon: (
          <IconWrapper size="small">
            <UsersIcon />
          </IconWrapper>
        ),
        path: '/admin/users',
        authRequired: true,
        permissions: [Permissions.Users.VIEW_ALL],
        adminRequired: true,
      },
      {
        text: 'Skills',
        icon: (
          <IconWrapper size="small">
            <AdminSkillsIcon />
          </IconWrapper>
        ),
        path: '/admin/skills',
        authRequired: true,
        permissions: [Permissions.Skills.MANAGE_CATEGORIES, Permissions.Skills.MANAGE_PROFICIENCY],
        adminRequired: true,
      },
      {
        text: 'Skill Kategorien',
        icon: (
          <IconWrapper size="small">
            <AdminSkillsIcon />
          </IconWrapper>
        ),
        path: '/admin/skills/categories',
        authRequired: true,
        permissions: [Permissions.Skills.MANAGE_CATEGORIES],
        adminRequired: true,
      },
      {
        text: 'Proficiency Levels',
        icon: (
          <IconWrapper size="small">
            <AdminSkillsIcon />
          </IconWrapper>
        ),
        path: '/admin/skills/proficiency',
        authRequired: true,
        permissions: [Permissions.Skills.MANAGE_PROFICIENCY],
        adminRequired: true,
      },
      {
        text: 'Matches',
        icon: (
          <IconWrapper size="small">
            <MatchesIcon />
          </IconWrapper>
        ),
        path: '/admin/matches',
        authRequired: true,
        permissions: [Permissions.Matching.VIEW_ALL],
        adminRequired: true,
      },
      {
        text: 'Termine',
        icon: (
          <IconWrapper size="small">
            <AdminAppointmentsIcon />
          </IconWrapper>
        ),
        path: '/admin/appointments',
        authRequired: true,
        permissions: [Permissions.Appointments.VIEW_ALL],
        adminRequired: true,
      },
      {
        text: 'Analytics',
        icon: (
          <IconWrapper size="small">
            <AnalyticsIcon />
          </IconWrapper>
        ),
        path: '/admin/analytics',
        authRequired: true,
        permissions: [Permissions.Admin.VIEW_STATISTICS],
        adminRequired: true,
      },
      {
        text: 'Rollen & Berechtigungen',
        icon: (
          <IconWrapper size="small">
            <SecurityIcon />
          </IconWrapper>
        ),
        path: '/admin/roles',
        authRequired: true,
        permissions: [Permissions.Roles.VIEW],
        adminRequired: true,
      },
      {
        text: 'System Health',
        icon: (
          <IconWrapper size="small">
            <SystemHealthIcon />
          </IconWrapper>
        ),
        path: '/admin/system-health',
        authRequired: true,
        permissions: [Permissions.System.VIEW_LOGS],
        adminRequired: true,
      },
      {
        text: 'Audit Logs',
        icon: (
          <IconWrapper size="small">
            <AuditLogsIcon />
          </IconWrapper>
        ),
        path: '/admin/audit-logs',
        authRequired: true,
        permissions: [Permissions.System.VIEW_LOGS],
        adminRequired: true,
      },
      {
        text: 'Security Monitoring',
        icon: (
          <IconWrapper size="small">
            <ShieldIcon />
          </IconWrapper>
        ),
        path: '/admin/security',
        authRequired: true,
        permissions: [Permissions.System.VIEW_LOGS, Permissions.Security.VIEW_ALERTS],
        adminRequired: true,
      },
      {
        text: 'Moderation',
        icon: (
          <IconWrapper size="small">
            <ModerationIcon />
          </IconWrapper>
        ),
        path: '/admin/moderation',
        authRequired: true,
        permissions: [Permissions.Moderation.HANDLE_REPORTS, Permissions.Reviews.MODERATE],
        adminRequired: true,
      },
      {
        text: 'Email Templates',
        icon: (
          <IconWrapper size="small">
            <EmailIcon />
          </IconWrapper>
        ),
        path: '/admin/email-templates',
        authRequired: true,
        permissions: [Permissions.System.MANAGE_SETTINGS],
        adminRequired: true,
      },
      {
        text: 'Einstellungen',
        icon: (
          <IconWrapper size="small">
            <AdminSettingsIcon />
          </IconWrapper>
        ),
        path: '/admin/settings',
        authRequired: true,
        permissions: [Permissions.System.MANAGE_SETTINGS],
        adminRequired: true,
      },
    ],
  },
];

// ============================================================================
// Tabbar-specific Admin Menu Item
// ============================================================================

export interface NavMenuItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  authRequired: boolean;
  permissions?: string[];
  badge?: number;
}

/**
 * Returns admin menu item for Tabbar (mobile navigation)
 */
export const getAdminTabMenuItem = (): NavMenuItem => ({
  label: 'Admin',
  icon: (
    <IconWrapper>
      <AdminIcon />
    </IconWrapper>
  ),
  path: '/admin/dashboard',
  authRequired: true,
  permissions: [Permissions.Admin.ACCESS_DASHBOARD],
});
