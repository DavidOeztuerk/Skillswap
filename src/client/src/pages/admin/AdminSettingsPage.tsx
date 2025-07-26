import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const AdminSettingsPage: React.FC = () => {
  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Admin Settings
      </Typography>
      <Card>
        <CardContent>
          <Typography>Admin Settings</Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AdminSettingsPage;