import React, { useEffect, useState } from 'react';
import {
  LinkedIn as LinkedInIcon,
  Work as XingIcon,
  Sync as SyncIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CheckCircle as CheckCircleIcon,
  Link as LinkIcon,
  LinkOff as LinkOffIcon,
} from '@mui/icons-material';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../../core/store/hooks';
import {
  // Thunks
  fetchSocialConnections,
  initiateLinkedInConnect,
  disconnectLinkedIn,
  syncLinkedInProfile,
  initiateXingConnect,
  disconnectXing,
  syncXingProfile,
  addImportedSkill,
  deleteImportedSkill,
  updateImportedSkill,
  // Actions
  clearSocialConnectionsError,
  clearSyncResult,
  // Selectors
  selectLinkedInConnection,
  selectXingConnection,
  selectImportedSkills,
  selectSocialConnectionsSummary,
  selectSocialConnectionsLoading,
  selectSocialConnectionsSyncing,
  selectSocialConnectionsSaving,
  selectSocialConnectionsError,
  selectSyncResult,
  selectOAuthState,
  // Types
  type ImportedSkill,
} from '../store';

const SocialConnectionsTab: React.FC = () => {
  const dispatch = useAppDispatch();

  // Use selectors for state access
  const linkedIn = useAppSelector(selectLinkedInConnection);
  const xing = useAppSelector(selectXingConnection);
  const importedSkills = useAppSelector(selectImportedSkills);
  const summary = useAppSelector(selectSocialConnectionsSummary);
  const isLoading = useAppSelector(selectSocialConnectionsLoading);
  const isSyncing = useAppSelector(selectSocialConnectionsSyncing);
  const isSaving = useAppSelector(selectSocialConnectionsSaving);
  const error = useAppSelector(selectSocialConnectionsError);
  const syncResult = useAppSelector(selectSyncResult);
  const oauthState = useAppSelector(selectOAuthState);

  // Dialog state
  const [addSkillDialogOpen, setAddSkillDialogOpen] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('');

  // Load data on mount
  useEffect(() => {
    void dispatch(fetchSocialConnections());
  }, [dispatch]);

  // Handle OAuth redirect (when returning from LinkedIn/Xing)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const oauthToken = urlParams.get('oauth_token');
    const oauthVerifier = urlParams.get('oauth_verifier');

    // TODO: Implement callback handling when OAuth is set up
    if (code && state) {
      console.debug('LinkedIn callback detected');
    }
    if (oauthToken && oauthVerifier) {
      console.debug('Xing callback detected');
    }
  }, []);

  // Handle OAuth initiation result
  useEffect(() => {
    if (oauthState.authorizationUrl) {
      window.location.href = oauthState.authorizationUrl;
    }
  }, [oauthState.authorizationUrl]);

  const handleConnectLinkedIn = (): void => {
    const redirectUri = `${window.location.origin}/profile?tab=connections`;
    void dispatch(initiateLinkedInConnect(redirectUri));
  };

  const handleConnectXing = (): void => {
    const redirectUri = `${window.location.origin}/profile?tab=connections`;
    void dispatch(initiateXingConnect(redirectUri));
  };

  const handleSyncLinkedIn = (): void => {
    void dispatch(syncLinkedInProfile());
  };

  const handleSyncXing = (): void => {
    void dispatch(syncXingProfile());
  };

  const handleDisconnectLinkedIn = (): void => {
    void dispatch(disconnectLinkedIn());
  };

  const handleDisconnectXing = (): void => {
    void dispatch(disconnectXing());
  };

  const handleAddSkill = (): void => {
    if (!newSkillName.trim()) return;
    void dispatch(
      addImportedSkill({
        name: newSkillName.trim(),
        category: newSkillCategory.trim() || undefined,
      })
    );
    setNewSkillName('');
    setNewSkillCategory('');
    setAddSkillDialogOpen(false);
  };

  const handleToggleSkillVisibility = (skill: ImportedSkill): void => {
    void dispatch(
      updateImportedSkill({
        skillId: skill.id,
        request: {
          name: skill.name,
          category: skill.category ?? undefined,
          sortOrder: skill.sortOrder,
          isVisible: !skill.isVisible,
        },
      })
    );
  };

  const handleDeleteSkill = (skillId: string): void => {
    void dispatch(deleteImportedSkill(skillId));
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Nie';
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSourceColor = (source: string): 'primary' | 'secondary' | 'default' => {
    if (source === 'linkedin') return 'primary';
    if (source === 'xing') return 'secondary';
    return 'default';
  };

  const getSourceLabel = (source: string): string => {
    if (source === 'linkedin') return 'LinkedIn';
    if (source === 'xing') return 'Xing';
    return 'Manuell';
  };

  if (isLoading && !linkedIn && !xing) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {error ? (
        <Alert
          severity="error"
          onClose={() => dispatch(clearSocialConnectionsError())}
          sx={{ mb: 2 }}
        >
          {error}
        </Alert>
      ) : null}

      {syncResult ? (
        <Alert
          severity={syncResult.success ? 'success' : 'error'}
          onClose={() => dispatch(clearSyncResult())}
          sx={{ mb: 2 }}
        >
          {syncResult.success
            ? `Synchronisiert: ${syncResult.experiencesImported} Erfahrungen, ${syncResult.educationsImported} Ausbildungen importiert`
            : (syncResult.error ?? 'Synchronisierung fehlgeschlagen')}
        </Alert>
      ) : null}

      <Grid container columns={12} spacing={3}>
        {/* LinkedIn Connection Card */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }} elevation={0}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <LinkedInIcon sx={{ color: '#0077B5', fontSize: 28 }} />
              <Typography variant="h6">LinkedIn</Typography>
              {linkedIn ? (
                <Chip
                  icon={<CheckCircleIcon />}
                  label="Verbunden"
                  color="success"
                  size="small"
                  sx={{ ml: 'auto' }}
                />
              ) : null}
            </Box>
            <Divider sx={{ mb: 2 }} />

            {linkedIn ? (
              <>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Verbunden seit: {formatDate(linkedIn.createdAt)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Letzte Synchronisierung: {formatDate(linkedIn.lastSyncAt)}
                  </Typography>
                  {linkedIn.linkedInEmail ? (
                    <Typography variant="body2" color="text.secondary">
                      E-Mail: {linkedIn.linkedInEmail}
                    </Typography>
                  ) : null}
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Chip
                    label={`${linkedIn.importedExperienceCount} Erfahrungen`}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <Chip label={`${linkedIn.importedEducationCount} Ausbildungen`} size="small" />
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<SyncIcon />}
                    onClick={handleSyncLinkedIn}
                    disabled={isSyncing}
                  >
                    {isSyncing ? 'Synchronisiere...' : 'Synchronisieren'}
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<LinkOffIcon />}
                    onClick={handleDisconnectLinkedIn}
                    disabled={isLoading}
                  >
                    Trennen
                  </Button>
                </Box>
              </>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Verbinde dein LinkedIn-Konto um Berufserfahrung, Ausbildung und Fähigkeiten zu
                  importieren.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<LinkIcon />}
                  onClick={handleConnectLinkedIn}
                  disabled={oauthState.isInitiating}
                  sx={{ backgroundColor: '#0077B5', '&:hover': { backgroundColor: '#005885' } }}
                >
                  {oauthState.isInitiating && oauthState.provider === 'linkedin'
                    ? 'Verbinde...'
                    : 'Mit LinkedIn verbinden'}
                </Button>
              </>
            )}
          </Paper>
        </Grid>

        {/* Xing Connection Card */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }} elevation={0}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <XingIcon sx={{ color: '#006567', fontSize: 28 }} />
              <Typography variant="h6">Xing</Typography>
              {xing ? (
                <Chip
                  icon={<CheckCircleIcon />}
                  label="Verbunden"
                  color="success"
                  size="small"
                  sx={{ ml: 'auto' }}
                />
              ) : null}
            </Box>
            <Divider sx={{ mb: 2 }} />

            {xing ? (
              <>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Verbunden seit: {formatDate(xing.createdAt)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Letzte Synchronisierung: {formatDate(xing.lastSyncAt)}
                  </Typography>
                  {xing.xingEmail ? (
                    <Typography variant="body2" color="text.secondary">
                      E-Mail: {xing.xingEmail}
                    </Typography>
                  ) : null}
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Chip
                    label={`${xing.importedExperienceCount} Erfahrungen`}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <Chip label={`${xing.importedEducationCount} Ausbildungen`} size="small" />
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<SyncIcon />}
                    onClick={handleSyncXing}
                    disabled={isSyncing}
                  >
                    {isSyncing ? 'Synchronisiere...' : 'Synchronisieren'}
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<LinkOffIcon />}
                    onClick={handleDisconnectXing}
                    disabled={isLoading}
                  >
                    Trennen
                  </Button>
                </Box>
              </>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Verbinde dein Xing-Konto um Berufserfahrung, Ausbildung und Fähigkeiten zu
                  importieren.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<LinkIcon />}
                  onClick={handleConnectXing}
                  disabled={oauthState.isInitiating}
                  sx={{ backgroundColor: '#006567', '&:hover': { backgroundColor: '#004849' } }}
                >
                  {oauthState.isInitiating && oauthState.provider === 'xing'
                    ? 'Verbinde...'
                    : 'Mit Xing verbinden'}
                </Button>
              </>
            )}
          </Paper>
        </Grid>

        {/* Imported Skills */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3 }} elevation={0}>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
            >
              <Box>
                <Typography variant="h6">Berufliche Fähigkeiten</Typography>
                {summary ? (
                  <Typography variant="body2" color="text.secondary">
                    {summary.totalImportedSkills} Fähigkeiten ({summary.linkedInSkillCount}{' '}
                    LinkedIn, {summary.xingSkillCount} Xing, {summary.manualSkillCount} Manuell)
                  </Typography>
                ) : null}
              </Box>
              <Button startIcon={<AddIcon />} onClick={() => setAddSkillDialogOpen(true)}>
                Fähigkeit hinzufügen
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {importedSkills.length === 0 ? (
              <Typography color="text.secondary" textAlign="center" py={2}>
                Keine Fähigkeiten eingetragen. Verbinde LinkedIn/Xing oder füge manuell hinzu.
              </Typography>
            ) : (
              <List>
                {importedSkills.map((skill) => (
                  <ListItem
                    key={skill.id}
                    sx={{ px: 0 }}
                    secondaryAction={
                      <>
                        <IconButton
                          onClick={() => handleToggleSkillVisibility(skill)}
                          disabled={isSaving}
                          title={skill.isVisible ? 'Verstecken' : 'Anzeigen'}
                        >
                          {skill.isVisible ? <VisibilityIcon /> : <VisibilityOffIcon />}
                        </IconButton>
                        <IconButton
                          onClick={() => handleDeleteSkill(skill.id)}
                          disabled={isSaving}
                          color="error"
                          title="Löschen"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </>
                    }
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            sx={{
                              textDecoration: skill.isVisible ? 'none' : 'line-through',
                              color: skill.isVisible ? 'inherit' : 'text.disabled',
                            }}
                          >
                            {skill.name}
                          </Typography>
                          <Chip
                            label={getSourceLabel(skill.source)}
                            size="small"
                            color={getSourceColor(skill.source)}
                            variant="outlined"
                          />
                          {skill.endorsementCount > 0 && (
                            <Chip
                              label={`${skill.endorsementCount} Endorsements`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      }
                      secondary={skill.category}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Add Skill Dialog */}
      <Dialog
        open={addSkillDialogOpen}
        onClose={() => setAddSkillDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Neue Fähigkeit hinzufügen</DialogTitle>
        <DialogContent>
          <TextField
            label="Fähigkeit"
            fullWidth
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
            sx={{ mt: 2, mb: 2 }}
            placeholder="z.B. JavaScript, Projektmanagement"
          />
          <TextField
            label="Kategorie (optional)"
            fullWidth
            value={newSkillCategory}
            onChange={(e) => setNewSkillCategory(e.target.value)}
            placeholder="z.B. Programmierung, Management"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddSkillDialogOpen(false)}>Abbrechen</Button>
          <Button
            variant="contained"
            onClick={handleAddSkill}
            disabled={!newSkillName.trim() || isSaving}
          >
            Hinzufügen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SocialConnectionsTab;
