/**
 * useVideoCallMedia Hook
 *
 * Manages local/remote media streams and device controls.
 * Handles mic, camera, and screen sharing toggles.
 */

import { useCallback, useRef, useEffect } from 'react';
import { useStreams } from '../../../core/contexts/streamContextHooks';
import { getStreamManager } from '../../../core/services/StreamManager';
import { useAppDispatch } from '../../../core/store/store.hooks';
import { toggleMic, toggleVideo, toggleScreenShare } from '../store/videoCallSlice';
import type { VideoCallSharedRefs } from './VideoCallContext';

// ============================================================================
// Types
// ============================================================================

export interface UseVideoCallMediaReturn {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  toggleMicrophone: () => void;
  toggleCamera: () => void;
  toggleScreenSharing: () => Promise<void>;
}

// ============================================================================
// Hook
// ============================================================================

export const useVideoCallMedia = (refs: VideoCallSharedRefs): UseVideoCallMediaReturn => {
  const dispatch = useAppDispatch();
  const streamManager = getStreamManager();
  const { localStream, remoteStream, createLocalStream } = useStreams();

  // Ref to store toggleScreenSharing for use in onended callback
  const toggleScreenSharingRef = useRef<() => Promise<void>>(async () => {});

  /**
   * Toggle microphone on/off
   */
  const toggleMicrophone = useCallback(() => {
    if (!localStream) return;

    const newEnabled = !refs.isMicEnabledRef.current;
    localStream.getAudioTracks().forEach((track: MediaStreamTrack) => {
      track.enabled = newEnabled;
    });
    dispatch(toggleMic());

    // Notify other participants via SignalR
    const connection = refs.signalRConnectionRef.current;
    const roomId = refs.roomIdRef.current;
    if (connection && roomId) {
      void connection.invoke('MediaStateChanged', roomId, 'audio', newEnabled);
    }
  }, [dispatch, localStream, refs]);

  /**
   * Toggle camera on/off
   */
  const toggleCamera = useCallback(() => {
    if (!localStream) return;

    const newEnabled = !refs.isVideoEnabledRef.current;
    localStream.getVideoTracks().forEach((track: MediaStreamTrack) => {
      track.enabled = newEnabled;
    });
    dispatch(toggleVideo());

    // Notify other participants via SignalR
    const connection = refs.signalRConnectionRef.current;
    const roomId = refs.roomIdRef.current;
    if (connection && roomId) {
      void connection.invoke('MediaStateChanged', roomId, 'video', newEnabled);
    }
  }, [dispatch, localStream, refs]);

  /**
   * Toggle screen sharing
   */
  const toggleScreenSharing = useCallback(async () => {
    const pc = refs.peerRef.current;
    if (!pc) return;

    const currentIsScreenSharing = refs.isScreenSharingRef.current;
    const roomId = refs.roomIdRef.current;
    const connection = refs.signalRConnectionRef.current;

    try {
      if (currentIsScreenSharing) {
        // Stop screen sharing - switch back to camera
        // Stop old video tracks first
        localStream?.getVideoTracks().forEach((track: MediaStreamTrack) => {
          track.stop();
        });

        // createLocalStream handles getUserMedia, context state, and Redux dispatch via StreamManager events
        const stream = await createLocalStream({
          video: true,
          audio: true,
        });
        const videoTrack = stream.getVideoTracks()[0];

        const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(videoTrack);
        }

        dispatch(toggleScreenShare());

        if (connection && roomId) {
          void connection.invoke('MediaStateChanged', roomId, 'screen', false);
        }
      } else {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        const screenTrack = screenStream.getVideoTracks()[0];

        // Handle user stopping screen share via browser UI
        // Use ref to avoid accessing toggleScreenSharing before declaration
        screenTrack.addEventListener('ended', () => {
          if (refs.isScreenSharingRef.current) {
            void toggleScreenSharingRef.current();
          }
        });

        const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(screenTrack);
        }

        // Create new stream with screen video + existing audio
        const newStream = new MediaStream([screenTrack, ...(localStream?.getAudioTracks() ?? [])]);

        // Register composite stream directly with StreamManager
        // StreamManager events will update context state and Redux
        streamManager.registerStream(newStream, 'camera');
        dispatch(toggleScreenShare());

        if (connection && roomId) {
          void connection.invoke('MediaStateChanged', roomId, 'screen', true);
        }
      }
    } catch (err) {
      console.error('Error toggling screen share:', err);
    }
  }, [dispatch, localStream, createLocalStream, streamManager, refs]);

  // Keep ref in sync with the callback
  useEffect(() => {
    toggleScreenSharingRef.current = toggleScreenSharing;
  }, [toggleScreenSharing]);

  return {
    localStream,
    remoteStream,
    toggleMicrophone,
    toggleCamera,
    toggleScreenSharing,
  };
};

export default useVideoCallMedia;
