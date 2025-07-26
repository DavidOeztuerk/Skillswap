import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const AdminSystemHealthPage: React.FC = () => {
  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        System Health
      </Typography>
      <Card>
        <CardContent>
          <Typography>Admin System Health</Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AdminSystemHealthPage;