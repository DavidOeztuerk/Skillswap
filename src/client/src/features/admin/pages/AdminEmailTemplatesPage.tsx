import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  Email as EmailIcon,
  Edit as EditIcon,
  Visibility as PreviewIcon,
  Send as SendIcon,
  Refresh as RefreshIcon,
  Code as CodeIcon,
  TextFields as TextIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
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
  Paper,
  Button,
  IconButton,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Tooltip,
  Snackbar,
} from '@mui/material';
import { usePermissions } from '../../../core/contexts/permissionContextHook';
import { isPagedResponse, isSuccessResponse } from '../../../shared/types/api/UnifiedResponse';
import { Permissions } from '../../auth/components/permissions.constants';
import emailTemplateService, {
  type EmailTemplateListItem,
  type EmailTemplateDetail,
  type TemplatePreviewResponse,
} from '../services/emailTemplateService';
import type { TabPanelProps } from '../../../shared/types/components/LayoutProps';

const TabPanel = ({ children, value, index }: TabPanelProps): React.ReactNode => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
  </div>
);

const AdminEmailTemplatesPage: React.FC = memo(() => {
  const { hasPermission } = usePermissions();
  const canManageTemplates = hasPermission(Permissions.System.MANAGE_SETTINGS);

  // State
  const [templates, setTemplates] = useState<EmailTemplateListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Dialog State
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplateDetail | null>(null);
  const [editTab, setEditTab] = useState(0);
  const [editSubject, setEditSubject] = useState('');
  const [editHtmlContent, setEditHtmlContent] = useState('');
  const [editTextContent, setEditTextContent] = useState('');
  const [saving, setSaving] = useState(false);

  // Preview Dialog State
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [preview, setPreview] = useState<TemplatePreviewResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewTab, setPreviewTab] = useState(0);

  // Test Send Dialog State
  const [testSendDialogOpen, setTestSendDialogOpen] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Load templates
  const loadTemplates = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await emailTemplateService.getTemplates({ pageSize: 50 });
      if (isPagedResponse(response)) {
        setTemplates(response.data);
      } else {
        setError(response.message ?? 'Fehler beim Laden der Templates');
      }
    } catch {
      setError('Fehler beim Laden der Templates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  // Open Edit Dialog
  const handleEdit = useCallback(async (templateId: string): Promise<void> => {
    try {
      const response = await emailTemplateService.getTemplateById(templateId);
      if (isSuccessResponse(response)) {
        const templateData = response.data;
        setSelectedTemplate(templateData);
        setEditSubject(templateData.subject);
        setEditHtmlContent(templateData.htmlContent);
        setEditTextContent(templateData.textContent);
        setEditTab(0);
        setEditDialogOpen(true);
      }
    } catch {
      setSnackbar({ open: true, message: 'Fehler beim Laden des Templates', severity: 'error' });
    }
  }, []);

  // Save Template
  const handleSave = useCallback(async (): Promise<void> => {
    if (!selectedTemplate) return;
    setSaving(true);
    try {
      const response = await emailTemplateService.updateTemplate({
        templateId: selectedTemplate.id,
        subject: editSubject,
        htmlContent: editHtmlContent,
        textContent: editTextContent,
      });
      if (response.success) {
        setSnackbar({ open: true, message: 'Template gespeichert', severity: 'success' });
        setEditDialogOpen(false);
        void loadTemplates();
      } else {
        setSnackbar({
          open: true,
          message: response.message ?? 'Fehler beim Speichern',
          severity: 'error',
        });
      }
    } catch {
      setSnackbar({ open: true, message: 'Fehler beim Speichern', severity: 'error' });
    } finally {
      setSaving(false);
    }
  }, [selectedTemplate, editSubject, editHtmlContent, editTextContent, loadTemplates]);

  // Preview Template
  const handlePreview = useCallback(async (templateId: string): Promise<void> => {
    setPreviewLoading(true);
    setPreviewDialogOpen(true);
    setPreviewTab(0);
    try {
      const response = await emailTemplateService.previewTemplate({ templateId });
      if (isSuccessResponse(response)) {
        setPreview(response.data);
      }
    } catch {
      setSnackbar({ open: true, message: 'Fehler bei der Vorschau', severity: 'error' });
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  // Open Test Send Dialog
  const handleOpenTestSend = useCallback((template: EmailTemplateListItem): void => {
    setSelectedTemplate(template as unknown as EmailTemplateDetail);
    setTestEmail('');
    setTestSendDialogOpen(true);
  }, []);

  // Send Test Email
  const handleSendTestEmail = useCallback(async (): Promise<void> => {
    if (!selectedTemplate || !testEmail) return;
    setSendingTest(true);
    try {
      const response = await emailTemplateService.sendTestEmail({
        templateId: selectedTemplate.id,
        recipientEmail: testEmail,
      });
      if (isSuccessResponse(response)) {
        const result = response.data;
        if (result.success) {
          setSnackbar({ open: true, message: 'Test-Email gesendet!', severity: 'success' });
          setTestSendDialogOpen(false);
        } else {
          setSnackbar({ open: true, message: result.message, severity: 'error' });
        }
      } else {
        const errorMsg =
          'message' in response && response.message ? response.message : 'Fehler beim Senden';
        setSnackbar({ open: true, message: errorMsg, severity: 'error' });
      }
    } catch {
      setSnackbar({ open: true, message: 'Fehler beim Senden', severity: 'error' });
    } finally {
      setSendingTest(false);
    }
  }, [selectedTemplate, testEmail]);

  // Parse variables schema
  const parseVariables = (schema?: string): string[] => {
    if (!schema) return [];
    try {
      const parsed = JSON.parse(schema) as Record<string, unknown>;
      return Object.keys(parsed);
    } catch {
      return [];
    }
  };

  return (
    <Box p={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <EmailIcon color="primary" fontSize="large" />
          <Typography variant="h4">Email Templates</Typography>
        </Stack>
        <Button
          startIcon={<RefreshIcon />}
          onClick={() => {
            void loadTemplates();
          }}
          disabled={loading}
        >
          Aktualisieren
        </Button>
      </Stack>

      {error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : null}

      <Card>
        <CardContent>
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Betreff</TableCell>
                    <TableCell>Sprache</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Version</TableCell>
                    <TableCell align="right">Aktionen</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id} hover>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography fontWeight={500}>{template.name}</Typography>
                          {template.description ? (
                            <Tooltip title={template.description}>
                              <InfoIcon fontSize="small" color="action" />
                            </Tooltip>
                          ) : null}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                          {template.subject}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={template.language.toUpperCase()} size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={template.isActive ? 'Aktiv' : 'Inaktiv'}
                          color={template.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{template.version}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="Vorschau">
                            <IconButton
                              size="small"
                              onClick={() => {
                                void handlePreview(template.id);
                              }}
                            >
                              <PreviewIcon />
                            </IconButton>
                          </Tooltip>
                          {canManageTemplates ? (
                            <>
                              <Tooltip title="Bearbeiten">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    void handleEdit(template.id);
                                  }}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Test senden">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    handleOpenTestSend(template);
                                  }}
                                >
                                  <SendIcon />
                                </IconButton>
                              </Tooltip>
                            </>
                          ) : null}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                  {templates.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography color="textSecondary">Keine Templates gefunden</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
        }}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Template bearbeiten: {selectedTemplate?.name}</DialogTitle>
        <DialogContent>
          {selectedTemplate ? (
            <Box sx={{ mt: 2 }}>
              <TextField
                label="Betreff"
                value={editSubject}
                onChange={(e) => {
                  setEditSubject(e.target.value);
                }}
                fullWidth
                sx={{ mb: 3 }}
              />

              {selectedTemplate.variablesSchema ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">Verfügbare Variablen:</Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                    {parseVariables(selectedTemplate.variablesSchema).map((v) => (
                      <Chip key={v} label={`{{${v}}}`} size="small" variant="outlined" />
                    ))}
                  </Stack>
                </Alert>
              ) : null}

              <Tabs
                value={editTab}
                onChange={(_, v: number) => {
                  setEditTab(v);
                }}
              >
                <Tab icon={<CodeIcon />} label="HTML" />
                <Tab icon={<TextIcon />} label="Plain Text" />
              </Tabs>

              <TabPanel value={editTab} index={0}>
                <TextField
                  value={editHtmlContent}
                  onChange={(e) => {
                    setEditHtmlContent(e.target.value);
                  }}
                  multiline
                  rows={20}
                  fullWidth
                  sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
                />
              </TabPanel>
              <TabPanel value={editTab} index={1}>
                <TextField
                  value={editTextContent}
                  onChange={(e) => {
                    setEditTextContent(e.target.value);
                  }}
                  multiline
                  rows={20}
                  fullWidth
                  sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
                />
              </TabPanel>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setEditDialogOpen(false);
            }}
          >
            Abbrechen
          </Button>
          <Button
            onClick={() => {
              void handleSave();
            }}
            variant="contained"
            disabled={saving}
          >
            {saving ? <CircularProgress size={20} /> : 'Speichern'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog
        open={previewDialogOpen}
        onClose={() => {
          setPreviewDialogOpen(false);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Template Vorschau</DialogTitle>
        <DialogContent>
          {previewLoading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : null}
          {!previewLoading && preview != null ? (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="textSecondary">
                Betreff:
              </Typography>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {preview.subject}
              </Typography>

              {!preview.isValid && preview.validationErrors.length > 0 ? (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  {preview.validationErrors.join(', ')}
                </Alert>
              ) : null}

              <Tabs
                value={previewTab}
                onChange={(_, v: number) => {
                  setPreviewTab(v);
                }}
              >
                <Tab icon={<CodeIcon />} label="HTML" />
                <Tab icon={<TextIcon />} label="Plain Text" />
              </Tabs>

              <TabPanel value={previewTab} index={0}>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                  {/* eslint-disable-next-line react/no-danger -- intentional for email template preview */}
                  <div dangerouslySetInnerHTML={{ __html: preview.htmlContent }} />
                </Paper>
              </TabPanel>
              <TabPanel value={previewTab} index={1}>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                    {preview.textContent}
                  </Typography>
                </Paper>
              </TabPanel>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setPreviewDialogOpen(false);
            }}
          >
            Schließen
          </Button>
        </DialogActions>
      </Dialog>

      {/* Test Send Dialog */}
      <Dialog
        open={testSendDialogOpen}
        onClose={() => {
          setTestSendDialogOpen(false);
        }}
      >
        <DialogTitle>Test-Email senden</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, minWidth: 400 }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Sende eine Test-Email mit Beispieldaten an die angegebene Adresse.
            </Typography>
            <TextField
              label="Empfänger Email"
              type="email"
              value={testEmail}
              onChange={(e) => {
                setTestEmail(e.target.value);
              }}
              fullWidth
              placeholder="admin@example.com"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setTestSendDialogOpen(false);
            }}
          >
            Abbrechen
          </Button>
          <Button
            onClick={() => {
              void handleSendTestEmail();
            }}
            variant="contained"
            disabled={!testEmail || sendingTest}
            startIcon={sendingTest ? <CircularProgress size={20} /> : <SendIcon />}
          >
            Senden
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => {
          setSnackbar({ ...snackbar, open: false });
        }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => {
            setSnackbar({ ...snackbar, open: false });
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
});

AdminEmailTemplatesPage.displayName = 'AdminEmailTemplatesPage';

export default AdminEmailTemplatesPage;
