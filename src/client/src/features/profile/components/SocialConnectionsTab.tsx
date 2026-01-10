import React, { useState } from 'react';
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
import { useSocialConnections } from '../hooks';
import type { ImportedSkill, LinkedInConnection, XingConnection } from '../store';

// =============================================================================
// Utility Functions
// =============================================================================

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

// =============================================================================
// Sub-Components
// =============================================================================

interface ConnectionCardProps {
  provider: 'linkedin' | 'xing';
  connection: LinkedInConnection | XingConnection | null;
  isLoading: boolean;
  isSyncing: boolean;
  isOAuthInitiating: boolean;
  oauthProvider: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  onSync: () => void;
}

const ConnectionCard: React.FC<ConnectionCardProps> = ({
  provider,
  connection,
  isLoading,
  isSyncing,
  isOAuthInitiating,
  oauthProvider,
  onConnect,
  onDisconnect,
  onSync,
}) => {
  const isLinkedIn = provider === 'linkedin';
  const Icon = isLinkedIn ? LinkedInIcon : XingIcon;
  const title = isLinkedIn ? 'LinkedIn' : 'Xing';
  const color = isLinkedIn ? '#0077B5' : '#006567';
  const hoverColor = isLinkedIn ? '#005885' : '#004849';

  const email = connection
    ? isLinkedIn
      ? (connection as LinkedInConnection).linkedInEmail
      : (connection as XingConnection).xingEmail
    : null;

  const renderConnectedState = (): React.ReactNode => (
    <>
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Verbunden seit: {formatDate(connection?.createdAt)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Letzte Synchronisierung: {formatDate(connection?.lastSyncAt)}
        </Typography>
        {email ? (
          <Typography variant="body2" color="text.secondary">
            E-Mail: {email}
          </Typography>
        ) : null}
      </Box>
      <Box sx={{ mb: 2 }}>
        <Chip
          label={`${connection?.importedExperienceCount ?? 0} Erfahrungen`}
          size="small"
          sx={{ mr: 1 }}
        />
        <Chip label={`${connection?.importedEducationCount ?? 0} Ausbildungen`} size="small" />
      </Box>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button variant="outlined" startIcon={<SyncIcon />} onClick={onSync} disabled={isSyncing}>
          {isSyncing ? 'Synchronisiere...' : 'Synchronisieren'}
        </Button>
        <Button
          variant="outlined"
          color="error"
          startIcon={<LinkOffIcon />}
          onClick={onDisconnect}
          disabled={isLoading}
        >
          Trennen
        </Button>
      </Box>
    </>
  );

  const renderDisconnectedState = (): React.ReactNode => (
    <>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Verbinde dein {title}-Konto um Berufserfahrung, Ausbildung und Fähigkeiten zu importieren.
      </Typography>
      <Button
        variant="contained"
        startIcon={<LinkIcon />}
        onClick={onConnect}
        disabled={isOAuthInitiating}
        sx={{ backgroundColor: color, '&:hover': { backgroundColor: hoverColor } }}
      >
        {isOAuthInitiating && oauthProvider === provider ? 'Verbinde...' : `Mit ${title} verbinden`}
      </Button>
    </>
  );

  return (
    <Paper sx={{ p: 3 }} elevation={0}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Icon sx={{ color, fontSize: 28 }} />
        <Typography variant="h6">{title}</Typography>
        {connection ? (
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
      {connection ? renderConnectedState() : renderDisconnectedState()}
    </Paper>
  );
};

interface ImportedSkillItemProps {
  skill: ImportedSkill;
  isSaving: boolean;
  onToggleVisibility: (skill: ImportedSkill) => void;
  onDelete: (skillId: string) => void;
}

const ImportedSkillItem: React.FC<ImportedSkillItemProps> = ({
  skill,
  isSaving,
  onToggleVisibility,
  onDelete,
}) => (
  <ListItem
    sx={{ px: 0 }}
    secondaryAction={
      <>
        <IconButton
          onClick={() => onToggleVisibility(skill)}
          disabled={isSaving}
          title={skill.isVisible ? 'Verstecken' : 'Anzeigen'}
        >
          {skill.isVisible ? <VisibilityIcon /> : <VisibilityOffIcon />}
        </IconButton>
        <IconButton
          onClick={() => onDelete(skill.id)}
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
);

// =============================================================================
// Main Component
// =============================================================================

const SocialConnectionsTab: React.FC = () => {
  // Use custom hook for all state and actions
  const {
    linkedIn,
    xing,
    importedSkills,
    summary,
    isLoading,
    isSyncing,
    isSaving,
    error,
    syncResult,
    oauthState,
    connectLinkedIn,
    disconnectLinkedIn,
    syncLinkedIn,
    connectXing,
    disconnectXing,
    syncXing,
    addSkill,
    toggleSkillVisibility,
    deleteSkill,
    clearError,
    dismissSyncResult,
  } = useSocialConnections();

  // Dialog state
  const [addSkillDialogOpen, setAddSkillDialogOpen] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('');

  // Handlers
  const handleAddSkill = async (): Promise<void> => {
    if (!newSkillName.trim()) return;
    await addSkill(newSkillName.trim(), newSkillCategory.trim() || undefined);
    setNewSkillName('');
    setNewSkillCategory('');
    setAddSkillDialogOpen(false);
  };

  // Loading state
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
        <Alert severity="error" onClose={clearError} sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      {syncResult ? (
        <Alert
          severity={syncResult.success ? 'success' : 'error'}
          onClose={dismissSyncResult}
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
          <ConnectionCard
            provider="linkedin"
            connection={linkedIn}
            isLoading={isLoading}
            isSyncing={isSyncing}
            isOAuthInitiating={oauthState.isInitiating}
            oauthProvider={oauthState.provider}
            onConnect={connectLinkedIn}
            onDisconnect={disconnectLinkedIn}
            onSync={syncLinkedIn}
          />
        </Grid>

        {/* Xing Connection Card */}
        <Grid size={{ xs: 12, md: 6 }}>
          <ConnectionCard
            provider="xing"
            connection={xing}
            isLoading={isLoading}
            isSyncing={isSyncing}
            isOAuthInitiating={oauthState.isInitiating}
            oauthProvider={oauthState.provider}
            onConnect={connectXing}
            onDisconnect={disconnectXing}
            onSync={syncXing}
          />
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
                  <ImportedSkillItem
                    key={skill.id}
                    skill={skill}
                    isSaving={isSaving}
                    onToggleVisibility={toggleSkillVisibility}
                    onDelete={deleteSkill}
                  />
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
