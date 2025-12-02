import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Security as SecurityIcon,
} from '@mui/icons-material';
import PageContainer from '../../components/layout/PageContainer';
import PageHeader from '../../components/layout/PageHeader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import SecurityAlertList from '../../components/admin/SecurityAlertList';
import SecurityStatistics from '../../components/admin/SecurityStatistics';
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

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

const AdminSecurityPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [tabValue, setTabValue] = useState(0);

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
    dispatch(fetchSecurityAlerts({
      pageNumber: pagination.page,
      pageSize: pagination.limit,
      minLevel: filters.minLevel || undefined,
      type: filters.type || undefined,
      includeRead: filters.includeRead,
      includeDismissed: filters.includeDismissed,
    }));
  }, [dispatch, pagination.page, pagination.limit, filters]);

  // Fetch statistics using Redux
  const fetchStatistics = useCallback(() => {
    dispatch(fetchSecurityAlertStatistics({}));
  }, [dispatch]);

  // Initial load
  useEffect(() => {
    fetchAlerts();
    fetchStatistics();
  }, [fetchAlerts, fetchStatistics]);

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle page change using Redux
  const handlePageChange = (page: number) => {
    dispatch(setSecurityAlertPagination({ page }));
  };

  // Handle dismiss alert using Redux
  const handleDismissAlert = async (alertId: string, reason: string) => {
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
    } catch (error: any) {
      console.error('Error dismissing alert:', error);
      setSnackbar({
        open: true,
        message: error?.message || 'Fehler beim Dismissing des Alerts',
        severity: 'error',
      });
    }
  };

  // Handle mark as read using Redux
  const handleMarkAlertAsRead = async (alertId: string) => {
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
    } catch (error: any) {
      console.error('Error marking alert as read:', error);
      setSnackbar({
        open: true,
        message: error?.message || 'Fehler beim Markieren des Alerts',
        severity: 'error',
      });
    }
  };

  // Handle view details (could open modal/dialog)
  const handleViewDetails = (alertId: string) => {
    console.log('View details for alert:', alertId);
    // TODO: Implement details view (modal/dialog)
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchAlerts();
    fetchStatistics();
  };

  // Handle filter changes using Redux
  const handleMinLevelChange = (level: string) => {
    dispatch(setSecurityAlertFilters({ minLevel: level }));
    dispatch(setSecurityAlertPagination({ page: 1 })); // Reset to first page
  };

  const handleAlertTypeChange = (type: string) => {
    dispatch(setSecurityAlertFilters({ type }));
    dispatch(setSecurityAlertPagination({ page: 1 }));
  };

  const handleIncludeReadChange = (include: boolean) => {
    dispatch(setSecurityAlertFilters({ includeRead: include }));
    dispatch(setSecurityAlertPagination({ page: 1 }));
  };

  const handleIncludeDismissedChange = (include: boolean) => {
    dispatch(setSecurityAlertFilters({ includeDismissed: include }));
    dispatch(setSecurityAlertPagination({ page: 1 }));
  };

  const handleCloseSnackbar = () => {
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
          error={alertsError || undefined}
          onPageChange={handlePageChange}
          onDismiss={handleDismissAlert}
          onMarkRead={handleMarkAlertAsRead}
          onViewDetails={handleViewDetails}
          onRefresh={handleRefresh}
          minLevel={filters.minLevel}
          onMinLevelChange={handleMinLevelChange}
          alertType={filters.type}
          onAlertTypeChange={handleAlertTypeChange}
          includeRead={filters.includeRead}
          onIncludeReadChange={handleIncludeReadChange}
          includeDismissed={filters.includeDismissed}
          onIncludeDismissedChange={handleIncludeDismissedChange}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <SecurityStatistics
          statistics={statistics || undefined}
          isLoading={isLoadingStatistics}
        />
      </TabPanel>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </PageContainer>
  );
};

export default AdminSecurityPage;
