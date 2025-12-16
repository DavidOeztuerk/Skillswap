/**
 * VideoLayout Component
 *
 * Provides different layout modes for video call participants:
 * - Grid: Equal-sized tiles for all participants
 * - Spotlight: Active speaker large, others small
 * - ScreenShare: Screen share dominant, participants in sidebar
 * - PictureInPicture: Floating local video over remote
 */
import React, { useMemo, useCallback } from 'react';
import { Box, IconButton, Tooltip, Paper, Typography, useTheme } from '@mui/material';
import {
  GridView as GridIcon,
  Person as SpotlightIcon,
  ScreenShare as ScreenShareIcon,
  PictureInPicture as PipIcon,
} from '@mui/icons-material';

export type LayoutMode = 'grid' | 'spotlight' | 'screenShare' | 'pip';

interface Participant {
  id: string;
  name: string;
  videoStream?: MediaStream;
  audioStream?: MediaStream;
  isLocal?: boolean;
  isSpeaking?: boolean;
  isScreenSharing?: boolean;
}

interface VideoLayoutProps {
  participants: Participant[];
  localStream?: MediaStream;
  screenShareStream?: MediaStream;
  activeLayoutMode: LayoutMode;
  onLayoutChange: (mode: LayoutMode) => void;
  activeSpeakerId?: string;
  showLayoutControls?: boolean;
  children?: (layout: {
    mode: LayoutMode;
    mainParticipant?: Participant;
    sideParticipants: Participant[];
    gridConfig: { columns: number; rows: number };
  }) => React.ReactNode;
}

interface LayoutConfig {
  icon: React.ReactNode;
  label: string;
  description: string;
}

const layoutConfigs: Record<LayoutMode, LayoutConfig> = {
  grid: {
    icon: <GridIcon />,
    label: 'Rasteransicht',
    description: 'Alle Teilnehmer gleich groß',
  },
  spotlight: {
    icon: <SpotlightIcon />,
    label: 'Spotlight',
    description: 'Aktiver Sprecher im Fokus',
  },
  screenShare: {
    icon: <ScreenShareIcon />,
    label: 'Bildschirmfreigabe',
    description: 'Geteilter Bildschirm dominant',
  },
  pip: {
    icon: <PipIcon />,
    label: 'Bild-in-Bild',
    description: 'Schwebendes lokales Video',
  },
};

// Helper component for participant labels
const ParticipantLabel: React.FC<{
  name: string;
  isLocal?: boolean;
  small?: boolean;
}> = ({ name, isLocal, small }) => (
  <Box
    sx={{
      position: 'absolute',
      bottom: small === true ? 4 : 8,
      left: small === true ? 4 : 8,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      borderRadius: 1,
      px: small === true ? 0.5 : 1,
      py: 0.25,
    }}
  >
    <Typography variant={small === true ? 'caption' : 'body2'} color="white">
      {name} {isLocal === true && '(Du)'}
    </Typography>
  </Box>
);

const VideoLayout: React.FC<VideoLayoutProps> = ({
  participants,
  screenShareStream,
  activeLayoutMode,
  onLayoutChange,
  activeSpeakerId,
  showLayoutControls = true,
  children,
}) => {
  const theme = useTheme();

  // Calculate grid configuration based on participant count
  const gridConfig = useMemo(() => {
    const count = participants.length;
    if (count <= 1) return { columns: 1, rows: 1 };
    if (count === 2) return { columns: 2, rows: 1 };
    if (count <= 4) return { columns: 2, rows: 2 };
    if (count <= 6) return { columns: 3, rows: 2 };
    if (count <= 9) return { columns: 3, rows: 3 };
    return { columns: 4, rows: Math.ceil(count / 4) };
  }, [participants.length]);

  // Determine main and side participants based on layout mode
  const { mainParticipant, sideParticipants } = useMemo(() => {
    const screenSharer = participants.find((p) => p.isScreenSharing === true);
    const activeSpeaker = participants.find((p) => p.id === activeSpeakerId);
    const localParticipant = participants.find((p) => p.isLocal === true);
    const remoteParticipants = participants.filter((p) => p.isLocal !== true);

    switch (activeLayoutMode) {
      case 'spotlight': {
        // Active speaker is main, others are side
        const speaker =
          activeSpeaker ??
          (remoteParticipants.length > 0 ? remoteParticipants[0] : localParticipant);
        return {
          mainParticipant: speaker,
          sideParticipants:
            speaker !== undefined ? participants.filter((p) => p.id !== speaker.id) : participants,
        };
      }

      case 'screenShare': {
        // Screen sharer is main, others are side
        return {
          mainParticipant: screenSharer ?? remoteParticipants[0],
          sideParticipants: participants.filter((p) => p.id !== screenSharer?.id),
        };
      }

      case 'pip': {
        // Remote is main, local is floating
        return {
          mainParticipant: remoteParticipants[0],
          sideParticipants: localParticipant !== undefined ? [localParticipant] : [],
        };
      }

      case 'grid':
      default: {
        // All participants equal
        return {
          mainParticipant: undefined,
          sideParticipants: participants,
        };
      }
    }
  }, [participants, activeLayoutMode, activeSpeakerId]);

  // Auto-switch to screenShare mode when screen sharing starts
  React.useEffect(() => {
    const hasScreenShare = screenShareStream !== undefined;
    if (hasScreenShare && activeLayoutMode !== 'screenShare') {
      onLayoutChange('screenShare');
    } else if (!hasScreenShare && activeLayoutMode === 'screenShare') {
      onLayoutChange('grid');
    }
  }, [screenShareStream, activeLayoutMode, onLayoutChange]);

  // Render layout controls
  const renderLayoutControls = useCallback(
    () => (
      <Paper
        elevation={4}
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          display: 'flex',
          gap: 0.5,
          p: 0.5,
          borderRadius: 2,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
        }}
      >
        {(Object.entries(layoutConfigs) as [LayoutMode, LayoutConfig][]).map(([mode, config]) => (
          <Tooltip key={mode} title={config.description} arrow placement="bottom">
            <span>
              <IconButton
                size="small"
                onClick={() => {
                  onLayoutChange(mode);
                }}
                disabled={mode === 'screenShare' && screenShareStream === undefined}
                sx={{
                  color: activeLayoutMode === mode ? theme.palette.primary.main : 'white',
                  backgroundColor:
                    activeLayoutMode === mode ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  },
                  '&.Mui-disabled': {
                    color: 'rgba(255, 255, 255, 0.3)',
                  },
                }}
              >
                {config.icon}
              </IconButton>
            </span>
          </Tooltip>
        ))}
      </Paper>
    ),
    [activeLayoutMode, onLayoutChange, screenShareStream, theme.palette.primary.main]
  );

  // Render grid layout
  const renderGridLayout = useCallback(
    () => (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: `repeat(${String(gridConfig.columns)}, 1fr)`,
          gridTemplateRows: `repeat(${String(gridConfig.rows)}, 1fr)`,
          gap: 1,
          width: '100%',
          height: '100%',
          p: 1,
        }}
      >
        {participants.map((participant) => (
          <Box
            key={participant.id}
            sx={{
              position: 'relative',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              borderRadius: 2,
              overflow: 'hidden',
              border:
                participant.isSpeaking === true
                  ? `2px solid ${theme.palette.primary.main}`
                  : '2px solid transparent',
              transition: 'border-color 0.2s ease',
            }}
          >
            <ParticipantLabel name={participant.name} isLocal={participant.isLocal} />
          </Box>
        ))}
      </Box>
    ),
    [participants, gridConfig.columns, gridConfig.rows, theme.palette.primary.main]
  );

  // Render spotlight layout
  const renderSpotlightLayout = useCallback(
    () => (
      <Box sx={{ display: 'flex', width: '100%', height: '100%', gap: 1, p: 1 }}>
        {/* Main video */}
        <Box
          sx={{
            flex: 1,
            position: 'relative',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          {mainParticipant && (
            <ParticipantLabel name={mainParticipant.name} isLocal={mainParticipant.isLocal} />
          )}
        </Box>

        {/* Side participants */}
        {sideParticipants.length > 0 && (
          <Box
            sx={{
              width: 200,
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            {sideParticipants.slice(0, 4).map((participant) => (
              <Box
                key={participant.id}
                sx={{
                  flex: 1,
                  position: 'relative',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: 1,
                  overflow: 'hidden',
                  border:
                    participant.isSpeaking === true
                      ? `2px solid ${theme.palette.primary.main}`
                      : '2px solid transparent',
                }}
              >
                <ParticipantLabel name={participant.name} isLocal={participant.isLocal} small />
              </Box>
            ))}
          </Box>
        )}
      </Box>
    ),
    [mainParticipant, sideParticipants, theme.palette.primary.main]
  );

  // Render PiP layout
  const renderPipLayout = useCallback(
    () => (
      <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
        {/* Main (remote) video */}
        <Box
          sx={{
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            borderRadius: 2,
          }}
        >
          {mainParticipant && <ParticipantLabel name={mainParticipant.name} />}
        </Box>

        {/* Floating local video */}
        {sideParticipants.length > 0 && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 100,
              right: 16,
              width: 200,
              height: 150,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              borderRadius: 2,
              overflow: 'hidden',
              boxShadow: theme.shadows[8],
              cursor: 'move',
              '&:hover': {
                boxShadow: theme.shadows[12],
              },
            }}
          >
            <ParticipantLabel name={sideParticipants[0].name} isLocal small />
          </Box>
        )}
      </Box>
    ),
    [mainParticipant, sideParticipants, theme]
  );

  // Render screen share layout
  const renderScreenShareLayout = useCallback(
    () => (
      <Box sx={{ display: 'flex', width: '100%', height: '100%', gap: 1, p: 1 }}>
        {/* Screen share */}
        <Box
          sx={{
            flex: 1,
            position: 'relative',
            backgroundColor: '#000',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography color="white" variant="body2">
            Bildschirmfreigabe
          </Typography>
        </Box>

        {/* Participants sidebar */}
        <Box
          sx={{
            width: 180,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
          }}
        >
          {participants.slice(0, 6).map((participant) => (
            <Box
              key={participant.id}
              sx={{
                height: 100,
                position: 'relative',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                borderRadius: 1,
                overflow: 'hidden',
              }}
            >
              <ParticipantLabel name={participant.name} isLocal={participant.isLocal} small />
            </Box>
          ))}
        </Box>
      </Box>
    ),
    [participants]
  );

  // If children render prop is provided, use it
  if (children) {
    return (
      <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
        {showLayoutControls && renderLayoutControls()}
        {children({
          mode: activeLayoutMode,
          mainParticipant,
          sideParticipants,
          gridConfig,
        })}
      </Box>
    );
  }

  // Default rendering based on layout mode
  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      {showLayoutControls && renderLayoutControls()}
      {activeLayoutMode === 'grid' && renderGridLayout()}
      {activeLayoutMode === 'spotlight' && renderSpotlightLayout()}
      {activeLayoutMode === 'pip' && renderPipLayout()}
      {activeLayoutMode === 'screenShare' && renderScreenShareLayout()}
    </Box>
  );
};

export default VideoLayout;
