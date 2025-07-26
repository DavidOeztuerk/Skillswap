import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const AdminModerationPage: React.FC = () => {
  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Moderation
      </Typography>
      <Card>
        <CardContent>
          <Typography>Admin Moderation</Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AdminModerationPage;