import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

// ============================================================================
// Types
// ============================================================================

export interface MediaDevice {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
}

export type DeviceCheckStatus = 'pending' | 'checking' | 'success' | 'error' | 'not-found';

export interface DeviceCheckResult {
  camera: DeviceCheckStatus;
  microphone: DeviceCheckStatus;
  speaker: DeviceCheckStatus;
}

export interface PreCallState {
  // Device Selection
  selectedCamera: string | null;
  selectedMicrophone: string | null;
  selectedSpeaker: string | null;

  // Available Devices
  availableDevices: {
    cameras: MediaDevice[];
    microphones: MediaDevice[];
    speakers: MediaDevice[];
  };

  // Preview State
  previewStreamId: string | null;
  isCameraEnabled: boolean;
  isMicEnabled: boolean;
  audioLevel: number;

  // Device Checks
  deviceCheckStatus: DeviceCheckResult;

  // UI State
  showDeviceSettings: boolean;
  isLoading: boolean;
  error: string | null;

  // Join preferences (saved for the actual call)
  joinWithVideo: boolean;
  joinWithAudio: boolean;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState: PreCallState = {
  // Device Selection
  selectedCamera: null,
  selectedMicrophone: null,
  selectedSpeaker: null,

  // Available Devices
  availableDevices: {
    cameras: [],
    microphones: [],
    speakers: [],
  },

  // Preview State
  previewStreamId: null,
  isCameraEnabled: true,
  isMicEnabled: true,
  audioLevel: 0,

  // Device Checks
  deviceCheckStatus: {
    camera: 'pending',
    microphone: 'pending',
    speaker: 'pending',
  },

  // UI State
  showDeviceSettings: false,
  isLoading: true,
  error: null,

  // Join preferences
  joinWithVideo: true,
  joinWithAudio: true,
};

// ============================================================================
// Slice
// ============================================================================

const preCallSlice = createSlice({
  name: 'preCall',
  initialState,
  reducers: {
    // Device Selection
    setSelectedCamera: (state, action: PayloadAction<string | null>) => {
      state.selectedCamera = action.payload;
    },
    setSelectedMicrophone: (state, action: PayloadAction<string | null>) => {
      state.selectedMicrophone = action.payload;
    },
    setSelectedSpeaker: (state, action: PayloadAction<string | null>) => {
      state.selectedSpeaker = action.payload;
    },

    // Available Devices
    setAvailableDevices: (
      state,
      action: PayloadAction<{
        cameras?: MediaDevice[];
        microphones?: MediaDevice[];
        speakers?: MediaDevice[];
      }>
    ) => {
      const { cameras, microphones, speakers } = action.payload;
      if (cameras !== undefined) {
        state.availableDevices.cameras = cameras;
      }
      if (microphones !== undefined) {
        state.availableDevices.microphones = microphones;
      }
      if (speakers !== undefined) {
        state.availableDevices.speakers = speakers;
      }
    },

    // Preview State
    setPreviewStreamId: (state, action: PayloadAction<string | null>) => {
      state.previewStreamId = action.payload;
    },
    setCameraEnabled: (state, action: PayloadAction<boolean>) => {
      state.isCameraEnabled = action.payload;
    },
    setMicEnabled: (state, action: PayloadAction<boolean>) => {
      state.isMicEnabled = action.payload;
    },
    setAudioLevel: (state, action: PayloadAction<number>) => {
      state.audioLevel = action.payload;
    },
    toggleCamera: (state) => {
      state.isCameraEnabled = !state.isCameraEnabled;
    },
    toggleMic: (state) => {
      state.isMicEnabled = !state.isMicEnabled;
    },

    // Device Check Status
    setDeviceCheckStatus: (state, action: PayloadAction<Partial<DeviceCheckResult>>) => {
      state.deviceCheckStatus = {
        ...state.deviceCheckStatus,
        ...action.payload,
      };
    },
    setCameraCheckStatus: (state, action: PayloadAction<DeviceCheckStatus>) => {
      state.deviceCheckStatus.camera = action.payload;
    },
    setMicrophoneCheckStatus: (state, action: PayloadAction<DeviceCheckStatus>) => {
      state.deviceCheckStatus.microphone = action.payload;
    },
    setSpeakerCheckStatus: (state, action: PayloadAction<DeviceCheckStatus>) => {
      state.deviceCheckStatus.speaker = action.payload;
    },

    // UI State
    setShowDeviceSettings: (state, action: PayloadAction<boolean>) => {
      state.showDeviceSettings = action.payload;
    },
    toggleDeviceSettings: (state) => {
      state.showDeviceSettings = !state.showDeviceSettings;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Join Preferences
    setJoinWithVideo: (state, action: PayloadAction<boolean>) => {
      state.joinWithVideo = action.payload;
    },
    setJoinWithAudio: (state, action: PayloadAction<boolean>) => {
      state.joinWithAudio = action.payload;
    },

    // Bulk update for device enumeration result
    updateDevicesAndSelection: (
      state,
      action: PayloadAction<{
        cameras: MediaDevice[];
        microphones: MediaDevice[];
        speakers: MediaDevice[];
        isSafari?: boolean;
      }>
    ) => {
      const { cameras, microphones, speakers, isSafari } = action.payload;

      // Update available devices
      state.availableDevices.cameras = cameras;
      state.availableDevices.microphones = microphones;
      state.availableDevices.speakers = speakers;

      // Set defaults if not already selected
      if (!state.selectedCamera && cameras.length > 0) {
        state.selectedCamera = cameras[0].deviceId;
      }
      if (!state.selectedMicrophone && microphones.length > 0) {
        state.selectedMicrophone = microphones[0].deviceId;
      }
      if (!state.selectedSpeaker && speakers.length > 0) {
        state.selectedSpeaker = speakers[0].deviceId;
      }

      // Update device check status
      // Safari: audiooutput ist oft nicht verfügbar, aber wir markieren es als success
      const speakerStatus: DeviceCheckStatus =
        speakers.length > 0 ? 'success' : isSafari ? 'success' : 'not-found';

      state.deviceCheckStatus = {
        camera: cameras.length > 0 ? 'success' : 'not-found',
        microphone: microphones.length > 0 ? 'success' : 'not-found',
        speaker: speakerStatus,
      };
    },

    // Reset to initial state
    resetPreCallState: () => initialState,

    // Clear error
    clearError: (state) => {
      state.error = null;
    },
  },
});

// ============================================================================
// Actions Export
// ============================================================================

export const {
  setSelectedCamera,
  setSelectedMicrophone,
  setSelectedSpeaker,
  setAvailableDevices,
  setPreviewStreamId,
  setCameraEnabled,
  setMicEnabled,
  setAudioLevel,
  toggleCamera,
  toggleMic,
  setDeviceCheckStatus,
  setCameraCheckStatus,
  setMicrophoneCheckStatus,
  setSpeakerCheckStatus,
  setShowDeviceSettings,
  toggleDeviceSettings,
  setLoading,
  setError,
  setJoinWithVideo,
  setJoinWithAudio,
  updateDevicesAndSelection,
  resetPreCallState,
  clearError,
} = preCallSlice.actions;

export default preCallSlice.reducer;
