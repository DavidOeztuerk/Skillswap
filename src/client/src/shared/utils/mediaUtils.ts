/**
 * Media Utilities
 *
 * Cross-browser compatible utilities for media device handling.
 * Uses the shared detection module for browser detection.
 */

import { getBrowserInfo, isSafari } from '../detection';

// ============================================================================
// Types
// ============================================================================

export interface DeviceInfo {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
}

// ============================================================================
// Device Enumeration
// ============================================================================

/**
 * Get devices with labels (Safari-compatible)
 * Safari returns empty labels until getUserMedia() has been called
 *
 * @param existingStream - Optional existing stream (avoids double getUserMedia)
 */
export async function getDevicesWithLabels(
  existingStream?: MediaStream | null
): Promise<MediaDeviceInfo[]> {
  const browserInfo = getBrowserInfo();

  // Safari requires a stream before labels are available
  if (isSafari() && !existingStream) {
    try {
      console.debug('🍎 Safari: Requesting temporary stream for device enumeration...');
      const tempStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      tempStream.getTracks().forEach((track) => {
        track.stop();
      });
      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });
      console.debug('🍎 Safari: Temporary stream stopped');
    } catch (error) {
      console.warn('⚠️ Could not get temp stream for device enumeration:', error);
    }
  }

  const devices = await navigator.mediaDevices.enumerateDevices();

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    const counts = {
      videoinput: devices.filter((d) => d.kind === 'videoinput').length,
      audioinput: devices.filter((d) => d.kind === 'audioinput').length,
      audiooutput: devices.filter((d) => d.kind === 'audiooutput').length,
    };
    console.debug('📱 Device enumeration:', {
      browser: browserInfo.name,
      counts,
      hasLabels: devices.every((d) => Boolean(d.label) || d.deviceId === 'default'),
    });
  }

  return devices;
}

// ============================================================================
// Stream Utilities
// ============================================================================

/**
 * Safari-compatible stream stop
 * Safari has known issues with camera release (memory leak)
 *
 * CRITICAL for Safari: Tracks must be removed from the stream BEFORE calling stop()
 * This is required for Safari to properly release the camera (turn off LED indicator)
 */
export async function stopStreamSafely(
  stream: MediaStream,
  videoElement?: HTMLVideoElement | null
): Promise<void> {
  const tracks = stream.getTracks();

  if (isSafari()) {
    // Safari: Special cleanup sequence for proper camera release
    console.debug(`🍎 Safari: Stopping stream with ${tracks.length} tracks`);

    // Step 1: Clear video element srcObject FIRST
    if (videoElement != null) {
      videoElement.srcObject = null;
    }

    // Step 2: Remove tracks from stream BEFORE stopping (CRITICAL for Safari!)
    tracks.forEach((track) => {
      try {
        stream.removeTrack(track);
        console.debug(`🍎 Safari: Removed ${track.kind} track from stream`);
      } catch (e) {
        console.warn(`Safari removeTrack failed for ${track.id}:`, e);
      }
    });

    // Step 3: Short delay to allow Safari to process the removal
    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });

    // Step 4: Stop tracks and disable them
    tracks.forEach((track) => {
      track.stop();
      track.enabled = false;
    });

    console.debug('🍎 Safari: Stream cleanup complete');
  } else {
    // Chrome/Firefox: Standard cleanup
    if (videoElement != null) {
      videoElement.srcObject = null;
    }
    tracks.forEach((track) => {
      track.stop();
    });
  }
}

/**
 * Safari-compatible track stop
 *
 * NOTE: When stopping individual tracks on Safari, it's better to use
 * stopStreamSafely() if you have access to the parent stream, as Safari
 * requires removeTrack() before stop() for proper camera release.
 */
export async function stopTrackSafely(
  track: MediaStreamTrack,
  stream?: MediaStream | null,
  videoElement?: HTMLVideoElement | null
): Promise<void> {
  if (isSafari()) {
    // Safari: Remove from stream first if available
    if (videoElement != null) {
      videoElement.srcObject = null;
    }

    if (stream != null) {
      try {
        stream.removeTrack(track);
        console.debug(`🍎 Safari: Removed ${track.kind} track before stopping`);
      } catch (e) {
        console.warn(`Safari removeTrack failed for ${track.id}:`, e);
      }

      await new Promise((resolve) => {
        setTimeout(resolve, 50);
      });
    }
  }

  track.stop();
  track.enabled = false;
}

// ============================================================================
// Video Utilities
// ============================================================================

/**
 * Safari-compatible autoplay handler
 * Safari blocks autoplay more strictly - this function handles that
 */
export async function playVideoSafely(videoElement: HTMLVideoElement): Promise<boolean> {
  try {
    await videoElement.play();
    return true;
  } catch (error) {
    // Safari/iOS: Autoplay blocked, wait for user gesture
    if (isSafari()) {
      console.debug('🍎 Safari/iOS: play() blocked, waiting for user interaction');

      return new Promise<boolean>((resolve) => {
        const playOnInteraction = (): void => {
          videoElement
            .play()
            .then(() => {
              resolve(true);
            })
            .catch(() => {
              resolve(false);
            });
          document.removeEventListener('click', playOnInteraction);
          document.removeEventListener('touchstart', playOnInteraction);
        };

        document.addEventListener('click', playOnInteraction, { once: true });
        document.addEventListener('touchstart', playOnInteraction, { once: true });

        // Timeout after 30 seconds
        setTimeout(() => {
          document.removeEventListener('click', playOnInteraction);
          document.removeEventListener('touchstart', playOnInteraction);
          resolve(false);
        }, 30000);
      });
    }

    console.error('❌ Video play failed:', error);
    return false;
  }
}

// ============================================================================
// Constraint Helpers
// ============================================================================

/**
 * Get optimal video constraints for this browser
 */
export function getOptimalVideoConstraints(): MediaTrackConstraints {
  // Safari: Simplified constraints for better compatibility
  if (isSafari()) {
    return {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 24, max: 30 },
      facingMode: 'user',
    };
  }

  // Chrome/Firefox: Detailed constraints
  return {
    width: { min: 320, ideal: 1280, max: 1920 },
    height: { min: 240, ideal: 720, max: 1080 },
    frameRate: { ideal: 30, max: 60 },
    facingMode: 'user',
  };
}

/**
 * Get optimal audio constraints for this browser
 */
export function getOptimalAudioConstraints(): MediaTrackConstraints {
  // Safari: Less aggressive audio processing
  if (isSafari()) {
    return {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: false, // Safari has issues with autoGainControl
    };
  }

  // Chrome/Firefox: Full audio processing
  return {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  };
}
