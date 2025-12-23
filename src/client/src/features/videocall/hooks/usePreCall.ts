// ============================================================================
// Types
// ============================================================================

import { useRef, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../core/store/store.hooks';
import browserInfo, {
  getDevicesWithLabels,
  stopStreamSafely,
} from '../../../shared/utils/browserDetection';
import {
  selectDeviceCheckStatus,
  selectDeviceStatusSummary,
  selectSelectedCamera,
  selectSelectedMicrophone,
  selectSelectedSpeaker,
  selectAvailableCameras,
  selectAvailableMicrophones,
  selectAvailableSpeakers,
  selectIsCameraEnabled,
  selectIsMicEnabled,
  selectAudioLevel,
  selectShowDeviceSettings,
  selectIsLoading,
  selectError,
  selectJoinWithVideo,
  selectJoinWithAudio,
  selectCanJoinCall,
  selectHasDeviceError,
} from '../store/preCallSelectors';
import {
  updateDevicesAndSelection,
  setAudioLevel,
  setPreviewStreamId,
  setDeviceCheckStatus,
  setCameraEnabled,
  toggleDeviceSettings,
  setSelectedCamera,
  setSelectedMicrophone,
  setSelectedSpeaker,
  resetPreCallState,
  setJoinWithVideo,
  setJoinWithAudio,
  toggleCamera as toggleCameraAction,
  toggleMic as toggleMicAction,
} from '../store/preCallSlice';
import { setError, setLoading, clearError, setMicEnabled } from '../store/videoCallSlice';

interface DeviceInfo {
  deviceId: string;
  label: string;
  kind: string;
}

interface JoinPreferences {
  joinWithVideo: boolean;
  joinWithAudio: boolean;
  selectedCamera: string | null;
  selectedMicrophone: string | null;
  selectedSpeaker: string | null;
}

interface UsePreCallReturn {
  // State
  selectedCamera: string | null;
  selectedMicrophone: string | null;
  selectedSpeaker: string | null;
  cameras: DeviceInfo[];
  microphones: DeviceInfo[];
  speakers: DeviceInfo[];
  isCameraEnabled: boolean;
  isMicEnabled: boolean;
  audioLevel: number;
  deviceCheckStatus: ReturnType<typeof selectDeviceCheckStatus>;
  showDeviceSettings: boolean;
  isLoading: boolean;
  error: string | null;
  joinWithVideo: boolean;
  joinWithAudio: boolean;
  canJoinCall: boolean;
  hasDeviceError: boolean;
  deviceStatusSummary: ReturnType<typeof selectDeviceStatusSummary>;
  // Actions
  startPreview: () => Promise<void>;
  toggleCamera: () => void;
  toggleMic: () => void;
  toggleSettings: () => void;
  selectCamera: (deviceId: string) => void;
  selectMicrophone: (deviceId: string) => void;
  selectSpeaker: (deviceId: string) => void;
  setJoinWithVideo: (value: boolean) => void;
  setJoinWithAudio: (value: boolean) => void;
  prepareForJoin: () => Promise<JoinPreferences>;
  cleanup: () => void;
  clearError: () => void;
  // Refs
  setVideoPreviewRef: (element: HTMLVideoElement | null) => void;
  getPreviewStream: () => MediaStream | null;
}

// ============================================================================
// Hook
// ============================================================================

export const usePreCall = (): UsePreCallReturn => {
  const dispatch = useAppDispatch();

  // Selectors
  const selectedCamera = useAppSelector(selectSelectedCamera);
  const selectedMicrophone = useAppSelector(selectSelectedMicrophone);
  const selectedSpeaker = useAppSelector(selectSelectedSpeaker);
  const cameras = useAppSelector(selectAvailableCameras);
  const microphones = useAppSelector(selectAvailableMicrophones);
  const speakers = useAppSelector(selectAvailableSpeakers);
  const isCameraEnabled = useAppSelector(selectIsCameraEnabled);
  const isMicEnabled = useAppSelector(selectIsMicEnabled);
  const audioLevel = useAppSelector(selectAudioLevel);
  const deviceCheckStatus = useAppSelector(selectDeviceCheckStatus);
  const showDeviceSettings = useAppSelector(selectShowDeviceSettings);
  const isLoading = useAppSelector(selectIsLoading);
  const error = useAppSelector(selectError);
  const joinWithVideo = useAppSelector(selectJoinWithVideo);
  const joinWithAudio = useAppSelector(selectJoinWithAudio);
  const canJoinCall = useAppSelector(selectCanJoinCall);
  const hasDeviceError = useAppSelector(selectHasDeviceError);
  const deviceStatusSummary = useAppSelector(selectDeviceStatusSummary);

  // Refs for cleanup and non-serializable objects
  const previewStreamRef = useRef<MediaStream | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // ========================================================================
  // Device Enumeration
  // ========================================================================

  const enumerateDevices = useCallback(
    async (existingStream?: MediaStream | null) => {
      try {
        const devices = await getDevicesWithLabels(existingStream);

        if (browserInfo.isSafari) {
          console.debug('🍎 Safari: Device enumeration with labels completed');
        }

        const videoInputs = devices
          .filter((d) => d.kind === 'videoinput')
          .map((d) => ({
            deviceId: d.deviceId,
            label: d.label || `Camera ${d.deviceId.slice(0, 8)}`,
            kind: d.kind,
          }));

        const audioInputs = devices
          .filter((d) => d.kind === 'audioinput')
          .map((d) => ({
            deviceId: d.deviceId,
            label: d.label || `Microphone ${d.deviceId.slice(0, 8)}`,
            kind: d.kind,
          }));

        const audioOutputs = devices
          .filter((d) => d.kind === 'audiooutput')
          .map((d) => ({
            deviceId: d.deviceId,
            label: d.label || `Speaker ${d.deviceId.slice(0, 8)}`,
            kind: d.kind,
          }));

        // Safari-spezifische Meldung
        if (browserInfo.isSafari && audioOutputs.length === 0) {
          console.debug('🍎 Safari: Using default speaker (audiooutput enumeration not supported)');
        }

        dispatch(
          updateDevicesAndSelection({
            cameras: videoInputs,
            microphones: audioInputs,
            speakers: audioOutputs,
            isSafari: browserInfo.isSafari,
          })
        );
      } catch (err) {
        console.error('Error enumerating devices:', err);
        dispatch(
          setError('Fehler beim Laden der Geräte. Bitte überprüfen Sie die Berechtigungen.')
        );
      }
    },
    [dispatch]
  );

  // ========================================================================
  // Audio Level Monitor
  // ========================================================================

  const setupAudioLevelMonitor = useCallback(
    (stream: MediaStream) => {
      try {
        // Cleanup existing
        if (audioContextRef.current) {
          void audioContextRef.current.close();
        }
        if (animationFrameRef.current !== null) {
          cancelAnimationFrame(animationFrameRef.current);
        }

        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);

        analyser.fftSize = 256;
        source.connect(analyser);

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateLevel = (): void => {
          if (analyserRef.current) {
            analyserRef.current.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
            dispatch(setAudioLevel(Math.min(100, (average / 128) * 100)));
          }
          animationFrameRef.current = requestAnimationFrame(updateLevel);
        };

        updateLevel();
      } catch (err) {
        console.error('Error setting up audio level monitor:', err);
      }
    },
    [dispatch]
  );

  // ========================================================================
  // Media Stream Management
  // ========================================================================

  const startPreview = useCallback(async () => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());

      // Stop existing stream
      if (previewStreamRef.current) {
        previewStreamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      }

      const constraints: MediaStreamConstraints = {
        video: isCameraEnabled
          ? { deviceId: selectedCamera ? { exact: selectedCamera } : undefined }
          : false,
        audio: isMicEnabled
          ? { deviceId: selectedMicrophone ? { exact: selectedMicrophone } : undefined }
          : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      // Capture ref to avoid race condition warning
      const streamRef = previewStreamRef;
      streamRef.current = stream;
      dispatch(setPreviewStreamId(stream.id));

      // Attach to video element if ref is set
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }

      // Setup audio level monitoring
      if (isMicEnabled && stream.getAudioTracks().length > 0) {
        setupAudioLevelMonitor(stream);
      }

      // Enumerate devices with existing stream
      await enumerateDevices(stream);
      dispatch(setLoading(false));
    } catch (err) {
      console.error('Error starting preview:', err);
      dispatch(
        setError('Zugriff auf Kamera/Mikrofon verweigert. Bitte erteilen Sie die Berechtigung.')
      );
      dispatch(
        setDeviceCheckStatus({
          camera: 'error',
          microphone: 'error',
        })
      );
      dispatch(setLoading(false));
    }
  }, [
    dispatch,
    isCameraEnabled,
    isMicEnabled,
    selectedCamera,
    selectedMicrophone,
    enumerateDevices,
    setupAudioLevelMonitor,
  ]);

  // ========================================================================
  // Toggle Controls
  // ========================================================================

  const toggleCamera = useCallback(() => {
    if (previewStreamRef.current === null) {
      dispatch(toggleCameraAction());
    } else {
      const videoTrack = previewStreamRef.current.getVideoTracks()[0];
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- track can be undefined at runtime
      if (videoTrack !== undefined) {
        videoTrack.enabled = !videoTrack.enabled;
        dispatch(setCameraEnabled(videoTrack.enabled));
      }
    }
  }, [dispatch]);

  const toggleMic = useCallback(() => {
    if (previewStreamRef.current === null) {
      dispatch(toggleMicAction());
    } else {
      const audioTrack = previewStreamRef.current.getAudioTracks()[0];
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- track can be undefined at runtime
      if (audioTrack !== undefined) {
        audioTrack.enabled = !audioTrack.enabled;
        dispatch(setMicEnabled(audioTrack.enabled));
      }
    }
  }, [dispatch]);

  const toggleSettings = useCallback(() => {
    dispatch(toggleDeviceSettings());
  }, [dispatch]);

  // ========================================================================
  // Device Selection
  // ========================================================================

  const selectCamera = useCallback(
    (deviceId: string) => {
      dispatch(setSelectedCamera(deviceId));
    },
    [dispatch]
  );

  const selectMicrophone = useCallback(
    (deviceId: string) => {
      dispatch(setSelectedMicrophone(deviceId));
    },
    [dispatch]
  );

  const selectSpeaker = useCallback(
    (deviceId: string) => {
      dispatch(setSelectedSpeaker(deviceId));
    },
    [dispatch]
  );

  // ========================================================================
  // Join Call Preparation
  // ========================================================================

  const prepareForJoin = useCallback(async () => {
    // Stop preview stream safely before joining
    if (previewStreamRef.current && videoPreviewRef.current) {
      await stopStreamSafely(previewStreamRef.current, videoPreviewRef.current);
    } else if (previewStreamRef.current) {
      previewStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
    }

    // Return the join preferences
    return {
      joinWithVideo,
      joinWithAudio,
      selectedCamera,
      selectedMicrophone,
      selectedSpeaker,
    };
  }, [joinWithVideo, joinWithAudio, selectedCamera, selectedMicrophone, selectedSpeaker]);

  // ========================================================================
  // Cleanup
  // ========================================================================

  const cleanup = useCallback(() => {
    // Stop stream
    if (previewStreamRef.current) {
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = null;
      }
      previewStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      previewStreamRef.current = null;
    }

    // Stop audio context
    if (audioContextRef.current) {
      void audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Cancel animation frame
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Reset Redux state
    dispatch(resetPreCallState());
  }, [dispatch]);

  // ========================================================================
  // Video Preview Ref Setter
  // ========================================================================

  const setVideoPreviewRef = useCallback((element: HTMLVideoElement | null) => {
    videoPreviewRef.current = element;
    if (element && previewStreamRef.current) {
      element.srcObject = previewStreamRef.current;
    }
  }, []);

  // ========================================================================
  // Get current preview stream (for video element)
  // ========================================================================

  const getPreviewStream = useCallback(() => previewStreamRef.current, []);

  // ========================================================================
  // Return Hook Values
  // ========================================================================

  return {
    // State
    selectedCamera,
    selectedMicrophone,
    selectedSpeaker,
    cameras,
    microphones,
    speakers,
    isCameraEnabled,
    isMicEnabled,
    audioLevel,
    deviceCheckStatus,
    showDeviceSettings,
    isLoading,
    error,
    joinWithVideo,
    joinWithAudio,
    canJoinCall,
    hasDeviceError,
    deviceStatusSummary,

    // Actions
    startPreview,
    toggleCamera,
    toggleMic,
    toggleSettings,
    selectCamera,
    selectMicrophone,
    selectSpeaker,
    setJoinWithVideo: (value: boolean) => {
      dispatch(setJoinWithVideo(value));
    },
    setJoinWithAudio: (value: boolean) => {
      dispatch(setJoinWithAudio(value));
    },
    prepareForJoin,
    cleanup,
    clearError: () => {
      dispatch(clearError());
    },

    // Refs
    setVideoPreviewRef,
    getPreviewStream,
  };
};

export default usePreCall;
