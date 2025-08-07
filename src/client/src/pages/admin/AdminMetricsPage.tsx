// src/pages/admin/AdminMetricsPage.tsx
import { useEffect, useState } from 'react';
import { Typography, Box, TextField, Button } from '@mui/material';
import metricsService from '../../api/services/metricsService';
import MetricsTable from '../../components/admin/MetricsTable';

const AdminMetricsPage = () => {
  const [service, setService] = useState('userservice');
  const [metrics, setMetrics] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = async () => {
    try {
      setError(null);
      const data = await metricsService.getMetrics(service);
      setMetrics(data);
    } catch (e: any) {
      setError(e.message);
      setMetrics(null);
    }
  };

  useEffect(() => {
    // Inline load um Function-Dependency zu vermeiden
    const load = async () => {
      try {
        const data = await metricsService.getMetrics(service);
        setMetrics(data);
      } catch (e: any) {
        setError(e.message);
        setMetrics(null);
      }
    };
    
    void load();
  }, []); // Nur beim Mount laden

  return (
    <Box p={2}>
      <Typography variant="h4" gutterBottom>
        System Metrics
      </Typography>
      <Box display="flex" gap={2} alignItems="center" mb={2}>
        <TextField
          label="Service"
          value={service}
          onChange={(e) => setService(e.target.value)}
          size="small"
        />
        <Button variant="contained" onClick={loadMetrics}>
          Load
        </Button>
      </Box>
      {error && (
        <Typography color="error" variant="body2" gutterBottom>
          {error}
        </Typography>
      )}
      {metrics && <MetricsTable metrics={metrics} />}
    </Box>
  );
};

export default AdminMetricsPage;
