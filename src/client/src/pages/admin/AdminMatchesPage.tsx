import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const AdminMatchesPage: React.FC = () => {
  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Matches-Verwaltung
      </Typography>
      <Card>
        <CardContent>
          <Typography>Admin Matches-Verwaltung</Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AdminMatchesPage;