import React, { useCallback, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Security as SecurityIcon,
  VpnKey as PasswordIcon,
  DeviceHub as DevicesIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import PageHeader from '../../components/layout/PageHeader';
import PageContainer from '../../components/layout/PageContainer';
import TwoFactorManagement from '../../components/auth/TwoFactorManagement';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// TabPanel that keeps components mounted to preserve state
const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  const isActive = value === index;
  
  return (
    <Box
      role="tabpanel"
      id={`security-tabpanel-${index}`}
      aria-labelledby={`security-tab-${index}`}
      sx={{
        // Use visibility instead of display to keep components mounted
        visibility: isActive ? 'visible' : 'hidden',
        position: isActive ? 'relative' : 'absolute',
        height: isActive ? 'auto' : 0,
        overflow: isActive ? 'visible' : 'hidden',
        py: isActive ? 3 : 0
      }}
    >
      {children}
    </Box>
  );
};

const SecuritySettings: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = useCallback((_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  }, []);

  return (
    <PageContainer>
      <PageHeader
        title="Security Settings"
        subtitle="Manage your account security and privacy"
        icon={<SecurityIcon sx={{ fontSize: 40 }} />}
      />

      <Paper sx={{ mt: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="security settings tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab
            icon={<SecurityIcon />}
            iconPosition="start"
            label="Two-Factor Authentication"
          />
          <Tab
            icon={<PasswordIcon />}
            iconPosition="start"
            label="Password"
          />
          <Tab
            icon={<DevicesIcon />}
            iconPosition="start"
            label="Active Sessions"
          />
          <Tab
            icon={<HistoryIcon />}
            iconPosition="start"
            label="Login History"
          />
        </Tabs>

        <Box sx={{ p: 3 }}>
          <TabPanel value={tabValue} index={0}>
            <TwoFactorManagement />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Typography variant="h6" gutterBottom>
              Password Settings
            </Typography>
            <Typography color="textSecondary" paragraph>
              Change your password regularly to keep your account secure.
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Password change functionality will be implemented here.
            </Alert>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Typography variant="h6" gutterBottom>
              Active Sessions
            </Typography>
            <Typography color="textSecondary" paragraph>
              View and manage devices where you're currently logged in.
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Session management will be implemented here.
            </Alert>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Typography variant="h6" gutterBottom>
              Login History
            </Typography>
            <Typography color="textSecondary" paragraph>
              Review recent login activity for your account.
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Login history will be implemented here.
            </Alert>
          </TabPanel>
        </Box>
      </Paper>

      <Paper sx={{ mt: 3, p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Security Recommendations
        </Typography>
        <Stack spacing={2}>
          <Alert severity="success">
            ✓ Your email is verified
          </Alert>
          <Alert severity="warning">
            Consider enabling two-factor authentication for enhanced security
          </Alert>
          <Alert severity="info">
            Last password change: More than 90 days ago
          </Alert>
        </Stack>
      </Paper>
    </PageContainer>
  );
};

export default SecuritySettings;