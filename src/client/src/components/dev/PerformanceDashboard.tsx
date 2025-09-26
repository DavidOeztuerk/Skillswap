import React, { useState, useEffect, memo, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Collapse,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Download as DownloadIcon,
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  BugReport as BugIcon
} from '@mui/icons-material';
import { performanceProfiler, BundleSizeTracker, memoryTracker } from '../../utils/performanceProfiler';
import { realTimeBundleTracker } from '../../utils/realTimeBundleTracker';

interface PerformanceDashboardProps {
  visible?: boolean;
}

const PerformanceDashboard: React.FC<PerformanceDashboardProps> = memo(({ visible = false }) => {
  const [renderStats, setRenderStats] = useState<any[]>([]);
  const [bundleStats, setBundleStats] = useState<any>(null);
  const [memoryStats, setMemoryStats] = useState<any>(null);
  const [expanded, setExpanded] = useState(false);
  const [, setMemoryInterval] = useState<NodeJS.Timeout | null>(null);
  const [realTimeStats, setRealTimeStats] = useState<any>({ components: 0, totalRenders: 0, averageRenderTime: 0, unnecessaryRenders: 0 });
  const [realTimeBundleStats, setRealTimeBundleStats] = useState<any>(null);

  // Real-time stats listeners
  const handleStatsUpdate = useCallback((stats: any[]) => {
    setRenderStats(stats);
    setRealTimeStats(performanceProfiler.getRealTimeStats());
  }, []);
  
  const handleBundleStatsUpdate = useCallback((bundleStats: any) => {
    setRealTimeBundleStats(bundleStats);
  }, []);
  
  useEffect(() => {
    if (visible) {
      // Start memory tracking
      const interval = memoryTracker.startTracking();
      setMemoryInterval(interval || null);

      // Add real-time listeners
      performanceProfiler.addListener(handleStatsUpdate);
      realTimeBundleTracker.init();
      realTimeBundleTracker.addListener(handleBundleStatsUpdate);
      
      // Initial load
      refreshStats();
      
      // Auto-refresh every 3 seconds
      const refreshInterval = setInterval(refreshStats, 3000);

      return () => {
        if (interval) clearInterval(interval);
        clearInterval(refreshInterval);
        performanceProfiler.removeListener(handleStatsUpdate);
        realTimeBundleTracker.removeListener(handleBundleStatsUpdate);
      };
    }
  }, [visible, handleStatsUpdate]);

  const refreshStats = useCallback(() => {
    // Bundle stats
    const bundle = BundleSizeTracker.measureBundleSize();
    setBundleStats(bundle);
    
    // Memory stats
    const memory = memoryTracker.getMemoryStats();
    setMemoryStats(memory);
    
    // Real-time stats (render stats updated via listener)
    setRealTimeStats(performanceProfiler.getRealTimeStats());
  }, []);

  const exportStats = () => {
    const data = {
      timestamp: new Date().toISOString(),
      renders: performanceProfiler.exportStats(),
      bundle: bundleStats,
      memory: memoryStats
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-stats-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetStats = () => {
    performanceProfiler.reset();
    refreshStats();
  };

  if (!visible) return null;

  // const unnecessaryRenders = renderStats.filter(stat => 
  //   stat.renderCount > 10 && stat.propsChanges < stat.renderCount * 0.3
  // );

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: expanded ? '600px' : '300px',
        height: expanded ? '80vh' : '200px',
        bgcolor: 'background.paper',
        boxShadow: 4,
        zIndex: 9999,
        overflow: 'auto',
        borderRadius: '0 0 0 8px',
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      {/* Header */}
      <Box sx={{ 
        p: 2, 
        bgcolor: 'primary.main', 
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="h6" sx={{ fontSize: '1rem' }}>
          <SpeedIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
          Performance Dashboard
        </Typography>
        <Box>
          <IconButton size="small" onClick={refreshStats} sx={{ color: 'white' }}>
            <RefreshIcon />
          </IconButton>
          <IconButton size="small" onClick={exportStats} sx={{ color: 'white' }}>
            <DownloadIcon />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={() => setExpanded(!expanded)}
            sx={{ color: 'white' }}
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
      </Box>

      <CardContent sx={{ p: 2 }}>
        {/* Summary Cards */}
        <Grid container spacing={1} sx={{ mb: 2 }}>
          <Grid size={{ xs: 4 }}>
            <Card variant="outlined">
              <CardContent sx={{ p: 1, textAlign: 'center' }}>
                <Typography variant="caption">Components</Typography>
                <Typography variant="h6" color={realTimeStats.components > 50 ? 'warning.main' : 'text.primary'}>
                  {realTimeStats.components}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 4 }}>
            <Card variant="outlined">
              <CardContent sx={{ p: 1, textAlign: 'center' }}>
                <Typography variant="caption">Total Renders</Typography>
                <Typography variant="h6" color={realTimeStats.totalRenders > 1000 ? 'error.main' : 'text.primary'}>
                  {realTimeStats.totalRenders}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 4 }}>
            <Card variant="outlined">
              <CardContent sx={{ p: 1, textAlign: 'center' }}>
                <Typography variant="caption">Bundle Size (LIVE)</Typography>
                <Typography 
                  variant="h6" 
                  color={realTimeBundleStats?.summary.totalSize > 2*1024*1024 ? 'error.main' : 'text.primary'}
                >
                  {realTimeBundleStats 
                    ? `${(realTimeBundleStats.summary.totalSize / 1024).toFixed(0)}KB` 
                    : '...'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Memory Stats */}
        {memoryStats && (
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <MemoryIcon sx={{ mr: 1, fontSize: '1rem' }} />
                <Typography variant="subtitle2">Memory Usage</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption">Used: {memoryStats.current.used} MB</Typography>
                <Typography variant="caption">Growth: {memoryStats.growth.used} MB</Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={(memoryStats.current.used / memoryStats.current.limit) * 100}
                sx={{ height: 6, borderRadius: 3 }}
              />
            </CardContent>
          </Card>
        )}

        {/* Real-time Warnings */}
        {realTimeStats.unnecessaryRenders > 0 && (
          <Alert severity="warning" sx={{ mb: 2, fontSize: '0.8rem' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <BugIcon sx={{ mr: 1, fontSize: '1rem' }} />
              {realTimeStats.unnecessaryRenders} components with unnecessary renders (LIVE)
            </Box>
          </Alert>
        )}
        
        {realTimeStats.averageRenderTime > 10 && (
          <Alert severity="error" sx={{ mb: 2, fontSize: '0.8rem' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <SpeedIcon sx={{ mr: 1, fontSize: '1rem' }} />
              Average render time: {realTimeStats.averageRenderTime.toFixed(1)}ms (TOO SLOW!)
            </Box>
          </Alert>
        )}

        <Collapse in={expanded}>
          {/* Top Rendering Components */}
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Top Rendering Components
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontSize: '0.7rem' }}>Component</TableCell>
                    <TableCell sx={{ fontSize: '0.7rem' }}>Renders</TableCell>
                    <TableCell sx={{ fontSize: '0.7rem' }}>Avg Time</TableCell>
                    <TableCell sx={{ fontSize: '0.7rem' }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {renderStats.slice(0, 15).map((stat, index) => {
                    const isProblematic = stat.propsChanges < stat.renderCount * 0.3 && stat.renderCount > 5;
                    const isSlow = stat.averageRenderTime > 10;
                    return (
                      <TableRow 
                        key={`${stat.componentName}-${index}`}
                        sx={{ 
                          bgcolor: isProblematic || isSlow ? 'warning.light' : 'transparent',
                          opacity: stat.renderCount === 0 ? 0.5 : 1 
                        }}
                      >
                        <TableCell sx={{ fontSize: '0.7rem', fontFamily: 'monospace' }}>
                          {stat.componentName.replace(/\[.*\]/, '')} 
                          {stat.renderCount > 50 && <span style={{ color: 'red' }}>🔥</span>}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.7rem', fontWeight: stat.renderCount > 100 ? 'bold' : 'normal' }}>
                          {stat.renderCount}
                        </TableCell>
                        <TableCell sx={{ 
                          fontSize: '0.7rem',
                          color: stat.averageRenderTime > 16 ? 'error.main' : stat.averageRenderTime > 10 ? 'warning.main' : 'text.primary'
                        }}>
                          {stat.averageRenderTime.toFixed(1)}ms
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.7rem' }}>
                          {isProblematic ? (
                            <Chip 
                              label="⚠️" 
                              size="small" 
                              color="warning"
                              sx={{ fontSize: '0.6rem', height: 16 }}
                            />
                          ) : isSlow ? (
                            <Chip 
                              label="🐌" 
                              size="small" 
                              color="error"
                              sx={{ fontSize: '0.6rem', height: 16 }}
                            />
                          ) : (
                            <Chip 
                              label="✓" 
                              size="small" 
                              color="success"
                              sx={{ fontSize: '0.6rem', height: 16 }}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Real-time Bundle Analysis */}
          {realTimeBundleStats && (
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Live Bundle Analysis
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="caption">
                    JS: {(realTimeBundleStats.summary.byType.javascript?.size / 1024 || 0).toFixed(0)}KB
                  </Typography>
                  <Typography variant="caption">
                    CSS: {(realTimeBundleStats.summary.byType.stylesheet?.size / 1024 || 0).toFixed(0)}KB
                  </Typography>
                  <Typography variant="caption">
                    Resources: {realTimeBundleStats.summary.totalResources}
                  </Typography>
                  <Typography variant="caption">
                    Cached: {realTimeBundleStats.summary.cachedResources}
                  </Typography>
                </Box>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontSize: '0.7rem' }}>Resource (LIVE)</TableCell>
                      <TableCell sx={{ fontSize: '0.7rem' }}>Size</TableCell>
                      <TableCell sx={{ fontSize: '0.7rem' }}>Load Time</TableCell>
                      <TableCell sx={{ fontSize: '0.7rem' }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {realTimeBundleStats.summary.largestResources.slice(0, 8).map((resource: any, index: number) => (
                      <TableRow 
                        key={`${resource.name}-${index}`}
                        sx={{ 
                          bgcolor: resource.loadTime > 1000 ? 'error.light' : resource.cached ? 'success.light' : 'transparent' 
                        }}
                      >
                        <TableCell sx={{ fontSize: '0.7rem', fontFamily: 'monospace' }}>
                          {resource.name}
                          {resource.category === 'main' && ' 🎯'}
                          {resource.loadTime > 1000 && ' 🐌'}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.7rem', fontWeight: resource.size > 100*1024 ? 'bold' : 'normal' }}>
                          {(resource.size / 1024).toFixed(1)}KB
                        </TableCell>
                        <TableCell sx={{ 
                          fontSize: '0.7rem',
                          color: resource.loadTime > 1000 ? 'error.main' : resource.loadTime > 500 ? 'warning.main' : 'text.primary'
                        }}>
                          {resource.loadTime > 0 ? resource.loadTime.toFixed(0) + 'ms' : 'N/A'}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.7rem' }}>
                          {resource.cached ? (
                            <Chip label="📦" size="small" color="success" sx={{ fontSize: '0.6rem', height: 16 }} />
                          ) : (
                            <Chip label="🌐" size="small" color="default" sx={{ fontSize: '0.6rem', height: 16 }} />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button size="small" variant="outlined" onClick={resetStats}>
              Reset Stats
            </Button>
            <Button size="small" variant="outlined" onClick={() => performanceProfiler.logReport()}>
              Log Report ({renderStats.length} components)
            </Button>
            <Button size="small" variant="outlined" onClick={() => {
              console.log('📦 Real-time Bundle Stats:', realTimeBundleStats);
              console.log('🎯 Bundle Recommendations:', realTimeBundleTracker.getRecommendations());
            }}>
              Log Live Bundle ({realTimeBundleStats?.summary.totalResources || 0} resources)
            </Button>
          </Box>
        </Collapse>
      </CardContent>
    </Box>
  );
});

PerformanceDashboard.displayName = 'PerformanceDashboard';

export default PerformanceDashboard;