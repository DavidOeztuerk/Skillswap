import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const AdminAppointmentsPage: React.FC = () => {
  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Termine-Verwaltung
      </Typography>
      <Card>
        <CardContent>
          <Typography>Admin Termine-Verwaltung</Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AdminAppointmentsPage;