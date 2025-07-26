import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const AdminSkillsPage: React.FC = () => {
  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Skills-Verwaltung
      </Typography>
      <Card>
        <CardContent>
          <Typography>Admin Skills-Verwaltung</Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AdminSkillsPage;