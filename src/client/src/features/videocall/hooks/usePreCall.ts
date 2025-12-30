// ============================================================================
// Types
// ============================================================================

import { useRef, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../core/store/store.hooks';
import { isSafari } from '../../../shared/detection';
import { getDevicesWithLabels, stopStreamSafely } from '../../../shared/utils/mediaUtils';
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
  setMicEnabled,
  toggleDeviceSettings,
  setSelectedCamera,
  setSelectedMicrophone,
  setSelectedSpeaker,
  resetPreCallState,
  setJoinWithVideo,
  setJoinWithAudio,
  toggleCamera as toggleCameraAction,
  toggleMic as toggleMicAction,
  setLoading,
  setError,
  clearError,
} from '../store/preCallSlice';

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
  const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null); // CRITICAL: Track source for Safari cleanup!
  const animationFrameRef = useRef<number | null>(null);

  // Track ALL streams created for Safari cleanup (handles React StrictMode double-mount)
  const allCreatedStreamsRef = useRef<Set<MediaStream>>(new Set());

  // ========================================================================
  // Device Enumeration
  // ========================================================================

  const enumerateDevices = useCallback(
    async (existingStream?: MediaStream | null) => {
      try {
        const devices = await getDevicesWithLabels(existingStream);

        if (isSafari()) {
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

        // Safari-specific message
        if (isSafari() && audioOutputs.length === 0) {
          console.debug('🍎 Safari: Using default speaker (audiooutput enumeration not supported)');
        }

        dispatch(
          updateDevicesAndSelection({
            cameras: videoInputs,
            microphones: audioInputs,
            speakers: audioOutputs,
            isSafari: isSafari(),
          })
        );
      } catch (err) {
        console.error('Error enumerating devices:', err);
        dispatch(setError('Error loading devices. Please check permissions.'));
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
        // Cleanup existing audio resources FIRST
        // CRITICAL for Safari: Must disconnect source BEFORE closing context!
        if (audioSourceRef.current) {
          try {
            audioSourceRef.current.disconnect();
            console.debug('🍎 Safari: Disconnected previous audio source');
          } catch {
            // Ignore disconnect errors
          }
          audioSourceRef.current = null;
        }
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

        // CRITICAL: Store source reference for Safari cleanup!
        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        audioSourceRef.current = source;

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

      // Stop existing stream with Safari-specific cleanup
      if (previewStreamRef.current) {
        const oldStream = previewStreamRef.current;
        if (isSafari()) {
          // Safari: Remove tracks before stopping
          oldStream.getTracks().forEach((track) => {
            try {
              oldStream.removeTrack(track);
              track.stop();
              track.enabled = false;
            } catch {
              // Ignore errors
            }
          });
        } else {
          oldStream.getTracks().forEach((track) => {
            track.stop();
          });
        }
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

      // Track all created streams for Safari cleanup (handles React StrictMode)
      allCreatedStreamsRef.current.add(stream);
      console.debug(
        `🍎 Safari: Tracking stream ${stream.id} (total: ${allCreatedStreamsRef.current.size})`
      );

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
      dispatch(setError('Camera/microphone access denied. Please grant permission.'));
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
    console.debug('🧹 PreCall cleanup starting...');

    // =========================================================================
    // STEP 1: Cancel animation frame FIRST (stops the audio level monitor loop)
    // =========================================================================
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // =========================================================================
    // STEP 2: CRITICAL for Safari - Disconnect audio source BEFORE anything else!
    // The MediaStreamSource holds a reference to the audio track.
    // If we don't disconnect it first, Safari won't release the camera indicator!
    // =========================================================================
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.disconnect();
        console.debug('🍎 Safari: Disconnected audio source (releases track reference)');
      } catch {
        // Ignore disconnect errors
      }
      audioSourceRef.current = null;
    }

    // =========================================================================
    // STEP 3: Close audio context (releases audio resources)
    // =========================================================================
    if (audioContextRef.current) {
      void audioContextRef.current.close();
      audioContextRef.current = null;
      console.debug('🍎 Safari: Closed audio context');
    }

    // =========================================================================
    // STEP 4: Clear video element srcObject
    // =========================================================================
    const videoElement = videoPreviewRef.current;
    if (videoElement) {
      videoElement.srcObject = null;
    }

    // =========================================================================
    // STEP 5: CRITICAL - Clean up ALL streams ever created (handles React StrictMode!)
    // React StrictMode mounts/unmounts twice, creating orphaned streams.
    // We must stop ALL of them, not just the current one!
    // =========================================================================
    const allStreams = allCreatedStreamsRef.current;
    console.debug(`🍎 Safari: Cleaning up ${allStreams.size} tracked streams`);

    if (isSafari()) {
      // Collect ALL tracks from ALL streams
      const allTracks: MediaStreamTrack[] = [];
      allStreams.forEach((stream) => {
        const tracks = stream.getTracks();
        tracks.forEach((track) => {
          allTracks.push(track);
          try {
            stream.removeTrack(track);
            console.debug(`🍎 Safari: Removed ${track.kind} track from stream ${stream.id}`);
          } catch {
            // Ignore errors
          }
        });
      });

      // Stop all tracks IMMEDIATELY (no setTimeout - that causes race conditions!)
      // The 50ms delay was causing issues with React StrictMode double-mount
      allTracks.forEach((track) => {
        try {
          track.stop();
          track.enabled = false;
          console.debug(`🍎 Safari: Stopped ${track.kind} track (readyState: ${track.readyState})`);
        } catch {
          // Track might already be stopped
        }
      });

      console.debug('🍎 Safari: PreCall cleanup complete - camera should be OFF now');
    } else {
      // Chrome/Firefox: Standard cleanup
      allStreams.forEach((stream) => {
        stream.getTracks().forEach((track) => {
          track.stop();
        });
      });
      console.debug('✅ Chrome/Firefox: PreCall cleanup complete');
    }

    // Clear the set and refs
    allStreams.clear();
    previewStreamRef.current = null;

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
