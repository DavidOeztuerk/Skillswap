import { createSelector } from '@reduxjs/toolkit';
import type { PreCallState, DeviceCheckStatus } from './preCallSlice';
import type { RootState } from '../../../core/store/store';

// ============================================================================
// Base Selectors
// ============================================================================

const selectPreCallState = (state: RootState): PreCallState => state.preCall;

// ============================================================================
// Device Selection Selectors
// ============================================================================

export const selectSelectedCamera = createSelector(
  [selectPreCallState],
  (preCall) => preCall.selectedCamera
);

export const selectSelectedMicrophone = createSelector(
  [selectPreCallState],
  (preCall) => preCall.selectedMicrophone
);

export const selectSelectedSpeaker = createSelector(
  [selectPreCallState],
  (preCall) => preCall.selectedSpeaker
);

export const selectSelectedDevices = createSelector([selectPreCallState], (preCall) => ({
  camera: preCall.selectedCamera,
  microphone: preCall.selectedMicrophone,
  speaker: preCall.selectedSpeaker,
}));

// ============================================================================
// Available Devices Selectors
// ============================================================================

export const selectAvailableCameras = createSelector(
  [selectPreCallState],
  (preCall) => preCall.availableDevices.cameras
);

export const selectAvailableMicrophones = createSelector(
  [selectPreCallState],
  (preCall) => preCall.availableDevices.microphones
);

export const selectAvailableSpeakers = createSelector(
  [selectPreCallState],
  (preCall) => preCall.availableDevices.speakers
);

export const selectAvailableDevices = createSelector(
  [selectPreCallState],
  (preCall) => preCall.availableDevices
);

export const selectHasDevices = createSelector([selectPreCallState], (preCall) => ({
  hasCamera: preCall.availableDevices.cameras.length > 0,
  hasMicrophone: preCall.availableDevices.microphones.length > 0,
  hasSpeaker: preCall.availableDevices.speakers.length > 0,
}));

// ============================================================================
// Preview State Selectors
// ============================================================================

export const selectPreviewStreamId = createSelector(
  [selectPreCallState],
  (preCall) => preCall.previewStreamId
);

export const selectIsCameraEnabled = createSelector(
  [selectPreCallState],
  (preCall) => preCall.isCameraEnabled
);

export const selectIsMicEnabled = createSelector(
  [selectPreCallState],
  (preCall) => preCall.isMicEnabled
);

export const selectAudioLevel = createSelector(
  [selectPreCallState],
  (preCall) => preCall.audioLevel
);

export const selectMediaState = createSelector([selectPreCallState], (preCall) => ({
  isCameraEnabled: preCall.isCameraEnabled,
  isMicEnabled: preCall.isMicEnabled,
  audioLevel: preCall.audioLevel,
}));

// ============================================================================
// Device Check Status Selectors
// ============================================================================

export const selectDeviceCheckStatus = createSelector(
  [selectPreCallState],
  (preCall) => preCall.deviceCheckStatus
);

export const selectCameraCheckStatus = createSelector(
  [selectPreCallState],
  (preCall) => preCall.deviceCheckStatus.camera
);

export const selectMicrophoneCheckStatus = createSelector(
  [selectPreCallState],
  (preCall) => preCall.deviceCheckStatus.microphone
);

export const selectSpeakerCheckStatus = createSelector(
  [selectPreCallState],
  (preCall) => preCall.deviceCheckStatus.speaker
);

export const selectAllDevicesReady = createSelector([selectPreCallState], (preCall) => {
  const { camera, microphone } = preCall.deviceCheckStatus;
  // At least one device must be working to join
  return camera === 'success' || microphone === 'success';
});

export const selectHasDeviceError = createSelector([selectPreCallState], (preCall) => {
  const { camera, microphone } = preCall.deviceCheckStatus;
  // Both devices have errors = cannot join
  return camera === 'error' && microphone === 'error';
});

// ============================================================================
// UI State Selectors
// ============================================================================

export const selectShowDeviceSettings = createSelector(
  [selectPreCallState],
  (preCall) => preCall.showDeviceSettings
);

export const selectIsLoading = createSelector([selectPreCallState], (preCall) => preCall.isLoading);

export const selectError = createSelector([selectPreCallState], (preCall) => preCall.error);

export const selectPreCallUIState = createSelector([selectPreCallState], (preCall) => ({
  showDeviceSettings: preCall.showDeviceSettings,
  isLoading: preCall.isLoading,
  error: preCall.error,
}));

// ============================================================================
// Join Preferences Selectors
// ============================================================================

export const selectJoinWithVideo = createSelector(
  [selectPreCallState],
  (preCall) => preCall.joinWithVideo
);

export const selectJoinWithAudio = createSelector(
  [selectPreCallState],
  (preCall) => preCall.joinWithAudio
);

export const selectJoinPreferences = createSelector([selectPreCallState], (preCall) => ({
  joinWithVideo: preCall.joinWithVideo,
  joinWithAudio: preCall.joinWithAudio,
}));

// ============================================================================
// Composite Selectors
// ============================================================================

export const selectCanJoinCall = createSelector([selectPreCallState], (preCall) => {
  const { camera, microphone } = preCall.deviceCheckStatus;
  const { isLoading } = preCall;

  // Cannot join if loading
  if (isLoading) return false;

  // Can join if at least one device is working
  return camera === 'success' || microphone === 'success';
});

export const selectDeviceStatusSummary = createSelector([selectPreCallState], (preCall) => {
  const { camera, microphone, speaker } = preCall.deviceCheckStatus;
  const { cameras, microphones, speakers } = preCall.availableDevices;

  const getStatusText = (status: DeviceCheckStatus, count: number): string => {
    switch (status) {
      case 'success':
        return 'Verfügbar';
      case 'error':
        return 'Fehler';
      case 'not-found':
        return count === 0 ? 'Nicht gefunden' : 'Nicht verfügbar';
      case 'checking':
        return 'Wird geprüft...';
      case 'pending':
      default:
        return 'Ausstehend';
    }
  };

  return {
    camera: {
      status: camera,
      text: getStatusText(camera, cameras.length),
      count: cameras.length,
    },
    microphone: {
      status: microphone,
      text: getStatusText(microphone, microphones.length),
      count: microphones.length,
    },
    speaker: {
      status: speaker,
      text: getStatusText(speaker, speakers.length),
      count: speakers.length,
    },
  };
});

// ============================================================================
// Full PreCall State Selector (for debugging)
// ============================================================================

export const selectFullPreCallState = createSelector([selectPreCallState], (preCall) => preCall);
