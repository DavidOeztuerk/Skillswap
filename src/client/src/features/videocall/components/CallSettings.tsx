import { useState } from 'react';
import {
  Camera as CameraIcon,
  Mic as MicIcon,
  Speaker as SpeakerIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormLabel,
  Select,
  MenuItem,
  Switch,
  Typography,
  Box,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import type { TabPanelProps } from '../../../shared/types/components/LayoutProps';

interface CallSettingsProps {
  open: boolean;
  onClose: () => void;
  settings: {
    videoDevice: string;
    audioDevice: string;
    outputDevice: string;
    videoQuality: string;
    audioQuality: string;
    echoCancellation: boolean;
    noiseSuppression: boolean;
    autoGainControl: boolean;
    notifications: boolean;
    recordingEnabled: boolean;
  };
  onSettingsChange: (settings: unknown) => void;
  availableDevices: {
    videoDevices: MediaDeviceInfo[];
    audioDevices: MediaDeviceInfo[];
    outputDevices: MediaDeviceInfo[];
  };
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const CallSettings: React.FC<CallSettingsProps> = ({
  open,
  onClose,
  settings,
  onSettingsChange,
  availableDevices,
}) => {
  const [tabValue, setTabValue] = useState(0);

  const handleSettingChange = (key: string, value: unknown): void => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number): void => {
    setTabValue(newValue);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Anruf-Einstellungen</DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
          <Tab icon={<CameraIcon />} label="Video & Audio" />
          <Tab icon={<SettingsIcon />} label="Erweitert" />
          <Tab icon={<NotificationsIcon />} label="Benachrichtigungen" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {/* Video Settings */}
          <Typography variant="h6" gutterBottom>
            Video-Einstellungen
          </Typography>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <FormLabel>Kamera</FormLabel>
            <Select
              value={settings.videoDevice}
              onChange={(e) => {
                handleSettingChange('videoDevice', e.target.value);
              }}
            >
              {availableDevices.videoDevices.map((device) => (
                <MenuItem key={device.deviceId} value={device.deviceId}>
                  {device.label || `Kamera ${device.deviceId.slice(0, 8)}...`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 3 }}>
            <FormLabel>Video-Qualität</FormLabel>
            <Select
              value={settings.videoQuality}
              onChange={(e) => {
                handleSettingChange('videoQuality', e.target.value);
              }}
            >
              <MenuItem value="low">Niedrig (360p)</MenuItem>
              <MenuItem value="medium">Mittel (720p)</MenuItem>
              <MenuItem value="high">Hoch (1080p)</MenuItem>
            </Select>
          </FormControl>

          <Divider sx={{ my: 2 }} />

          {/* Audio Settings */}
          <Typography variant="h6" gutterBottom>
            Audio-Einstellungen
          </Typography>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <FormLabel>Mikrofon</FormLabel>
            <Select
              value={settings.audioDevice}
              onChange={(e) => {
                handleSettingChange('audioDevice', e.target.value);
              }}
            >
              {availableDevices.audioDevices.map((device) => (
                <MenuItem key={device.deviceId} value={device.deviceId}>
                  {device.label || `Mikrofon ${device.deviceId.slice(0, 8)}...`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <FormLabel>Lautsprecher</FormLabel>
            <Select
              value={settings.outputDevice}
              onChange={(e) => {
                handleSettingChange('outputDevice', e.target.value);
              }}
            >
              {availableDevices.outputDevices.map((device) => (
                <MenuItem key={device.deviceId} value={device.deviceId}>
                  {device.label || `Lautsprecher ${device.deviceId.slice(0, 8)}...`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <FormLabel>Audio-Qualität</FormLabel>
            <Select
              value={settings.audioQuality}
              onChange={(e) => {
                handleSettingChange('audioQuality', e.target.value);
              }}
            >
              <MenuItem value="low">Niedrig</MenuItem>
              <MenuItem value="medium">Mittel</MenuItem>
              <MenuItem value="high">Hoch</MenuItem>
            </Select>
          </FormControl>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Erweiterte Audio-Einstellungen
          </Typography>

          <List>
            <ListItem
              secondaryAction={
                <Switch
                  checked={settings.echoCancellation}
                  onChange={(e) => {
                    handleSettingChange('echoCancellation', e.target.checked);
                  }}
                />
              }
            >
              <ListItemIcon>
                <MicIcon />
              </ListItemIcon>
              <ListItemText
                primary="Echo-Unterdrückung"
                secondary="Reduziert Echo während des Anrufs"
              />
            </ListItem>

            <ListItem
              secondaryAction={
                <Switch
                  checked={settings.noiseSuppression}
                  onChange={(e) => {
                    handleSettingChange('noiseSuppression', e.target.checked);
                  }}
                />
              }
            >
              <ListItemIcon>
                <MicIcon />
              </ListItemIcon>
              <ListItemText
                primary="Rauschunterdrückung"
                secondary="Filtert Hintergrundgeräusche"
              />
            </ListItem>

            <ListItem
              secondaryAction={
                <Switch
                  checked={settings.autoGainControl}
                  onChange={(e) => {
                    handleSettingChange('autoGainControl', e.target.checked);
                  }}
                />
              }
            >
              <ListItemIcon>
                <SpeakerIcon />
              </ListItemIcon>
              <ListItemText
                primary="Automatische Verstärkung"
                secondary="Passt die Mikrofonlautstärke automatisch an"
              />
            </ListItem>

            <Divider />

            <ListItem
              secondaryAction={
                <Switch
                  checked={settings.recordingEnabled}
                  onChange={(e) => {
                    handleSettingChange('recordingEnabled', e.target.checked);
                  }}
                />
              }
            >
              <ListItemIcon>
                <SecurityIcon />
              </ListItemIcon>
              <ListItemText
                primary="Aufnahme aktiviert"
                secondary="Erlaubt das Aufzeichnen von Anrufen"
              />
            </ListItem>
          </List>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Benachrichtigungseinstellungen
          </Typography>

          <List>
            <ListItem
              secondaryAction={
                <Switch
                  checked={settings.notifications}
                  onChange={(e) => {
                    handleSettingChange('notifications', e.target.checked);
                  }}
                />
              }
            >
              <ListItemIcon>
                <NotificationsIcon />
              </ListItemIcon>
              <ListItemText
                primary="Benachrichtigungen aktiviert"
                secondary="Zeigt Benachrichtigungen für Anrufe und Nachrichten"
              />
            </ListItem>
          </List>
        </TabPanel>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Schließen</Button>
        <Button variant="contained" onClick={onClose}>
          Einstellungen speichern
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export { CallSettings };
