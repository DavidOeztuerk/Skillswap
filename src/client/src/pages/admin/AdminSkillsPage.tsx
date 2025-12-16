import React, { useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Grid,
  Stack,
  MenuItem,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  VerifiedUser as VerifyIcon,
} from '@mui/icons-material';
import { useSkills } from '../../hooks/useSkills';
import { usePermissions } from '../../contexts/permissionContextHook';
import { Permissions } from '../../components/auth/permissions.constants';
import PageLoader from '../../components/ui/PageLoader';
import EmptyState from '../../components/ui/EmptyState';

const AdminSkillsPage: React.FC = () => {
  const { allSkills, isLoading, fetchAllSkills } = useSkills();
  const { hasPermission } = usePermissions();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState<string>('all');

  // Memoize permission checks
  const canVerifySkills = useMemo(() => hasPermission(Permissions.Skills.VERIFY), [hasPermission]);
  const canManageSkills = useMemo(() => hasPermission(Permissions.Skills.MANAGE), [hasPermission]);
  const canViewAllSkills = useMemo(
    () => hasPermission(Permissions.Skills.VIEW_ALL),
    [hasPermission]
  );

  useEffect(() => {
    fetchAllSkills({ pageNumber: 1, pageSize: 100 });
  }, [fetchAllSkills]);

  const filteredSkills = allSkills.filter((skill) => {
    const matchesSearch =
      searchQuery === '' ||
      skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || skill.category.id === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(allSkills.map((s) => s.category.id))).map(
    (id) => allSkills.find((s) => s.category.id === id)?.category
  );

  const stats = {
    total: allSkills.length,
    offered: allSkills.filter((s) => s.isOffered).length,
    wanted: allSkills.filter((s) => !s.isOffered).length,
    averageRating:
      allSkills.length > 0
        ? (
            allSkills.reduce((acc, s) => acc + (s.averageRating ?? 0), 0) / allSkills.length
          ).toFixed(1)
        : '0.0',
  };

  if (isLoading && allSkills.length === 0) {
    return <PageLoader variant="list" message="Lade Skills..." />;
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Skills-Verwaltung
      </Typography>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Gesamt
              </Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Angeboten
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.offered}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Gesucht
              </Typography>
              <Typography variant="h4" color="primary.main">
                {stats.wanted}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Ø Bewertung
              </Typography>
              <Typography variant="h4" color="warning.main">
                {stats.averageRating} ⭐
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              placeholder="Suche nach Skill..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
              }}
              sx={{ flexGrow: 1 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
              }}
              sx={{ minWidth: 200 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <FilterIcon />
                    </InputAdornment>
                  ),
                },
              }}
            >
              <MenuItem value="all">Alle Kategorien</MenuItem>
              {categories
                .filter((cat): cat is NonNullable<typeof cat> => Boolean(cat))
                .map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </MenuItem>
                ))}
            </TextField>
          </Stack>
        </CardContent>
      </Card>

      {/* Skills Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Kategorie</TableCell>
                <TableCell>Typ</TableCell>
                <TableCell>Bewertung</TableCell>
                <TableCell>Endorsements</TableCell>
                <TableCell>Aktionen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSkills.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <EmptyState
                      title="Keine Skills gefunden"
                      description="Es wurden keine Skills mit den aktuellen Filterkriterien gefunden."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredSkills.map((skill) => (
                  <TableRow key={skill.id}>
                    <TableCell>{skill.name}</TableCell>
                    <TableCell>
                      <Chip
                        label={skill.category.name}
                        size="small"
                        sx={{
                          backgroundColor: skill.category.color ?? undefined,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={skill.isOffered ? 'Angeboten' : 'Gesucht'}
                        color={skill.isOffered ? 'success' : 'primary'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {skill.averageRating?.toFixed(1) ?? 'N/A'} ⭐ ({skill.reviewCount ?? 0})
                    </TableCell>
                    <TableCell>{skill.endorsementCount}</TableCell>
                    <TableCell>
                      {/* View - available to anyone with VIEW_ALL permission */}
                      {canViewAllSkills && (
                        <Tooltip title="Details anzeigen">
                          <IconButton size="small" color="primary">
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {/* Verify - requires VERIFY permission */}
                      {canVerifySkills && (
                        <Tooltip title="Skill verifizieren">
                          <IconButton size="small" color="success">
                            <VerifyIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {/* Edit - requires MANAGE permission */}
                      {canManageSkills && (
                        <Tooltip title="Bearbeiten">
                          <IconButton size="small" color="default">
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {/* Delete - requires MANAGE permission */}
                      {canManageSkills && (
                        <Tooltip title="Löschen">
                          <IconButton size="small" color="error">
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};

export default AdminSkillsPage;
