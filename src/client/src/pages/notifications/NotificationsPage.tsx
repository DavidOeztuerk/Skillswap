import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const NotificationsPage: React.FC = () => (
  <Box p={3}>
    <Typography variant="h4" gutterBottom>
      Benachrichtigungen
    </Typography>
    <Card>
      <CardContent>
        <Typography>Hier werden alle Benachrichtigungen angezeigt.</Typography>
      </CardContent>
    </Card>
  </Box>
);

export default NotificationsPage;
