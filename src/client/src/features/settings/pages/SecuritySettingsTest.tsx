import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const SecuritySettingsTest: React.FC = () => {
  console.debug('SecuritySettingsTest component rendered!');

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Security Settings - Test Component
        </Typography>
        <Typography>
          This is a minimal test component to verify that the /settings/security route is working.
          If you can see this message, the route navigation is successful.
        </Typography>
      </Paper>
    </Box>
  );
};

export default SecuritySettingsTest;
