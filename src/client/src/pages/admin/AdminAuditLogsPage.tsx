import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const AdminAuditLogsPage: React.FC = () => {
  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Audit Logs
      </Typography>
      <Card>
        <CardContent>
          <Typography>Admin Audit Logs</Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AdminAuditLogsPage;