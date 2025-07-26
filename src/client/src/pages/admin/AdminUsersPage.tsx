import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const AdminUsersPage: React.FC = () => {
  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Benutzerverwaltung
      </Typography>
      <Card>
        <CardContent>
          <Typography>Admin Benutzerverwaltung</Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AdminUsersPage;