import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const AdminAnalyticsPage: React.FC = () => {
  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Analytics
      </Typography>
      <Card>
        <CardContent>
          <Typography>Admin Analytics</Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AdminAnalyticsPage;