import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Box, Tabs, Tab, Alert, Snackbar } from '@mui/material';
import { Security as SecurityIcon } from '@mui/icons-material';
import PageContainer from '../../components/layout/PageContainer';
import PageHeader from '../../components/layout/PageHeader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import SecurityAlertList from '../../components/admin/SecurityAlertList';
import SecurityStatistics from '../../components/admin/SecurityStatistics';
import { usePermissions } from '../../contexts/permissionContextHook';
import { Permissions } from '../../components/auth/permissions.constants';
import { useAppDispatch, useAppSelector } from '../../store/store.hooks';
import {
  selectSecurityAlerts,
  selectSecurityAlertStatistics,
  selectIsLoadingSecurityAlerts,
  selectIsLoadingSecurityStatistics,
  selectSecurityAlertError,
  selectSecurityAlertFilters,
  selectSecurityAlertsPagination,
} from '../../store/selectors/adminSelectors';
import {
  fetchSecurityAlerts,
  fetchSecurityAlertStatistics,
  dismissSecurityAlert,
  markSecurityAlertAsRead,
} from '../../features/admin/adminThunks';
import {
  setSecurityAlertFilters,
  setSecurityAlertPagination,
} from '../../features/admin/adminSlice';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>{value === index && <Box sx={{ pt: 3 }}>{children}</Box>}</div>
);

const AdminSecurityPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { hasPermission } = usePermissions();
  const [tabValue, setTabValue] = useState(0);

  // Memoize permission checks
  const canViewAlerts = useMemo(
    () => hasPermission(Permissions.Security.VIEW_ALERTS),
    [hasPermission]
  );
  const canManageAlerts = useMemo(
    () => hasPermission(Permissions.Security.MANAGE_ALERTS),
    [hasPermission]
  );

  // Redux state
  const alerts = useAppSelector(selectSecurityAlerts);
  const statistics = useAppSelector(selectSecurityAlertStatistics);
  const isLoadingAlerts = useAppSelector(selectIsLoadingSecurityAlerts);
  const isLoadingStatistics = useAppSelector(selectIsLoadingSecurityStatistics);
  const alertsError = useAppSelector(selectSecurityAlertError);
  const filters = useAppSelector(selectSecurityAlertFilters);
  const pagination = useAppSelector(selectSecurityAlertsPagination);

  // Snackbar state (keeping local as it's UI-only)
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  // Fetch alerts using Redux
  const fetchAlerts = useCallback(() => {
    void dispatch(
      fetchSecurityAlerts({
        pageNumber: pagination.page,
        pageSize: pagination.limit,
        minLevel: filters?.minLevel ?? undefined,
        type: filters?.type ?? undefined,
        includeRead: filters?.includeRead,
        includeDismissed: filters?.includeDismissed,
      })
    );
  }, [dispatch, pagination.page, pagination.limit, filters]);

  // Fetch statistics using Redux
  const fetchStatistics = useCallback(() => {
    void dispatch(fetchSecurityAlertStatistics({}));
  }, [dispatch]);

  // Initial load
  useEffect(() => {
    fetchAlerts();
    fetchStatistics();
  }, [fetchAlerts, fetchStatistics]);

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number): void => {
    setTabValue(newValue);
  };

  // Handle page change using Redux
  const handlePageChange = (page: number): void => {
    dispatch(setSecurityAlertPagination({ page }));
  };

  // Handle dismiss alert using Redux
  const handleDismissAlert = async (alertId: string, reason: string): Promise<void> => {
    try {
      await dispatch(dismissSecurityAlert({ alertId, reason })).unwrap();

      setSnackbar({
        open: true,
        message: 'Alert erfolgreich dismissed',
        severity: 'success',
      });

      // Refresh data
      fetchAlerts();
      fetchStatistics();
    } catch (error: unknown) {
      console.error('Error dismissing alert:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Fehler beim Dismissing des Alerts';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    }
  };

  // Handle mark as read using Redux
  const handleMarkAlertAsRead = async (alertId: string): Promise<void> => {
    try {
      await dispatch(markSecurityAlertAsRead(alertId)).unwrap();

      setSnackbar({
        open: true,
        message: 'Alert als gelesen markiert',
        severity: 'success',
      });

      // Refresh data
      fetchAlerts();
      fetchStatistics();
    } catch (error: unknown) {
      console.error('Error marking alert as read:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Fehler beim Markieren des Alerts';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    }
  };

  // Handle view details (could open modal/dialog)
  const handleViewDetails = (alertId: string): void => {
    console.debug('View details for alert:', alertId);
    // TODO: Implement details view (modal/dialog)
  };

  // Handle refresh
  const handleRefresh = (): void => {
    fetchAlerts();
    fetchStatistics();
  };

  // Handle filter changes using Redux
  const handleMinLevelChange = (level: string): void => {
    dispatch(setSecurityAlertFilters({ minLevel: level }));
    dispatch(setSecurityAlertPagination({ page: 1 })); // Reset to first page
  };

  const handleAlertTypeChange = (type: string): void => {
    dispatch(setSecurityAlertFilters({ type }));
    dispatch(setSecurityAlertPagination({ page: 1 }));
  };

  const handleIncludeReadChange = (include: boolean): void => {
    dispatch(setSecurityAlertFilters({ includeRead: include }));
    dispatch(setSecurityAlertPagination({ page: 1 }));
  };

  const handleIncludeDismissedChange = (include: boolean): void => {
    dispatch(setSecurityAlertFilters({ includeDismissed: include }));
    dispatch(setSecurityAlertPagination({ page: 1 }));
  };

  const handleCloseSnackbar = (): void => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (isLoadingAlerts && alerts.length === 0 && !statistics) {
    return <LoadingSpinner fullPage message="Lade Security Dashboard..." />;
  }

  return (
    <PageContainer>
      <PageHeader
        title="Security Monitoring"
        subtitle="Überwachung von Sicherheitsvorfällen und Bedrohungen"
        icon={<SecurityIcon />}
      />

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Alerts" />
          <Tab label="Statistiken" />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        <SecurityAlertList
          alerts={alerts}
          totalCount={pagination.total}
          currentPage={pagination.page}
          pageSize={pagination.limit}
          isLoading={isLoadingAlerts}
          error={alertsError ?? undefined}
          onPageChange={handlePageChange}
          onDismiss={canManageAlerts ? handleDismissAlert : undefined}
          onMarkRead={canManageAlerts ? handleMarkAlertAsRead : undefined}
          onViewDetails={canViewAlerts ? handleViewDetails : undefined}
          onRefresh={handleRefresh}
          minLevel={filters?.minLevel}
          onMinLevelChange={handleMinLevelChange}
          alertType={filters?.type}
          onAlertTypeChange={handleAlertTypeChange}
          includeRead={filters?.includeRead}
          onIncludeReadChange={handleIncludeReadChange}
          includeDismissed={filters?.includeDismissed}
          onIncludeDismissedChange={handleIncludeDismissedChange}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <SecurityStatistics statistics={statistics ?? undefined} isLoading={isLoadingStatistics} />
      </TabPanel>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </PageContainer>
  );
};

export default AdminSecurityPage;
