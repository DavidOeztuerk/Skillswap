/**
 * useVideoCallE2EE Hook
 *
 * Manages end-to-end encryption for video/audio streams.
 * Handles key exchange, transform pipelines, and encryption stats.
 */

import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../core/store/store.hooks';
import { getE2EESupport } from '../../../shared/utils/crypto/e2eeBrowserSupport';
import {
  type KeyExchangeEvents,
  E2EEKeyExchangeManager,
} from '../../../shared/utils/crypto/e2eeKeyExchange';
import {
  getE2EECompatibility,
  E2EEManager,
} from '../../../shared/utils/crypto/e2eeVideoEncryption';
import { InsertableStreamsHandler } from '../../../shared/utils/crypto/insertableStreamsHandler';
import {
  selectE2EEStatus,
  selectE2EELocalFingerprint,
  selectE2EERemoteFingerprint,
  selectE2EEKeyGeneration,
  selectE2EEEncryptionStats,
  selectE2EEErrorMessage,
} from '../store/videoCallSelectors';
import {
  setChatE2EEStatus,
  setChatE2EELocalFingerprint,
  setE2EEStatus,
  setE2EEErrorMessage,
  setE2EERemoteFingerprint,
  setE2EEKeyGeneration,
  setE2EELocalFingerprint,
  setE2EEEncryptionStats,
} from '../store/videoCallSlice';
import type { E2EEState } from './types';
import type { VideoCallSharedRefs } from './VideoCallContext';
import type { EncryptionStats } from '../store/videoCallAdapter+State';

// ============================================================================
// Constants
// ============================================================================

const STATS_UPDATE_INTERVAL = 5000;

// ============================================================================
// Types
// ============================================================================

export interface UseVideoCallE2EEReturn extends E2EEState {
  initializeE2EE: () => Promise<void>;
  applyE2EEToMediaTracks: () => void;
  initializeChatE2EE: (
    sharedEncryptionKey: CryptoKey | undefined,
    peerSigningPublicKey?: string,
    peerSigningFingerprint?: string
  ) => Promise<void>;
}

// ============================================================================
// Hook
// ============================================================================

export const useVideoCallE2EE = (
  refs: VideoCallSharedRefs,
  initializeChatE2EERef: React.RefObject<
    (
      sharedEncryptionKey: CryptoKey | undefined,
      peerSigningPublicKey?: string,
      peerSigningFingerprint?: string
    ) => Promise<void>
  >,
  applyE2EEToMediaTracksRef: React.RefObject<() => void>
): UseVideoCallE2EEReturn => {
  const dispatch = useAppDispatch();

  // Selectors
  const e2eeStatus = useAppSelector(selectE2EEStatus);
  const localKeyFingerprint = useAppSelector(selectE2EELocalFingerprint);
  const remotePeerFingerprint = useAppSelector(selectE2EERemoteFingerprint);
  const keyGeneration = useAppSelector(selectE2EEKeyGeneration);
  const encryptionStats = useAppSelector(selectE2EEEncryptionStats);
  const e2eeErrorMessage = useAppSelector(selectE2EEErrorMessage);

  const compatibility = getE2EECompatibility();

  /**
   * Apply E2EE transform pipelines to media tracks
   */
  const applyE2EEToMediaTracks = useCallback(() => {
    const pc = refs.peerRef.current;
    const streamsHandler = refs.streamsHandlerRef.current;

    if (!pc || !streamsHandler) return;

    // Check if transforms already applied
    if (refs.e2eeTransformsAppliedRef.current) {
      console.debug('🔒 E2EE: Transforms already applied, skipping');
      return;
    }

    console.debug('🔒 E2EE: Applying transform pipelines to media tracks...');

    // Apply encryption to senders
    pc.getSenders().forEach((sender) => {
      if (sender.track !== null) {
        const kind = sender.track.kind as 'video' | 'audio';
        try {
          streamsHandler.applyEncryptionToSender(sender, kind);
          console.debug(`✅ E2EE: Encryption pipeline applied to ${kind} sender`);
        } catch (e) {
          console.error(`E2EE: Failed to apply to ${kind} sender:`, e);
        }
      }
    });

    // Apply decryption to receivers
    pc.getReceivers().forEach((receiver) => {
      const kind = receiver.track.kind as 'video' | 'audio';
      try {
        streamsHandler.applyDecryptionToReceiver(receiver, kind);
        console.debug(`✅ E2EE: Decryption pipeline applied to ${kind} receiver`);
      } catch (e) {
        console.error(`E2EE: Failed to apply to ${kind} receiver:`, e);
      }
    });

    refs.e2eeTransformsAppliedRef.current = true;
    console.debug('✅ E2EE: All transform pipelines applied');
  }, [refs]);

  /**
   * Initialize chat E2EE with shared key
   */
  const initializeChatE2EE = useCallback(
    async (
      sharedEncryptionKey: CryptoKey | undefined,
      peerSigningPublicKey?: string,
      peerSigningFingerprint?: string
    ) => {
      const roomId = refs.roomIdRef.current;
      if (!sharedEncryptionKey || !roomId) return;

      try {
        dispatch(setChatE2EEStatus('initializing'));

        const signingKeys = await refs.chatManagerRef.current.generateSigningKeyPair();
        // Capture refs to avoid race condition warning
        const localSigningRef = refs.localSigningKeyRef;
        const localVerificationRef = refs.localVerificationKeyRef;
        localSigningRef.current = signingKeys.signingKey;
        localVerificationRef.current = signingKeys.verificationKey;
        dispatch(setChatE2EELocalFingerprint(signingKeys.fingerprint));

        await refs.chatManagerRef.current.initializeConversation(
          roomId,
          sharedEncryptionKey,
          signingKeys.signingKey,
          signingKeys.verificationKey,
          signingKeys.fingerprint,
          peerSigningPublicKey,
          peerSigningFingerprint
        );

        dispatch(setChatE2EEStatus('active'));
        console.debug('✅ Chat E2EE: Initialized with peer verification key');
      } catch (err) {
        console.error('Chat E2EE: Initialization error:', err);
        dispatch(setChatE2EEStatus('error'));
      }
    },
    [dispatch, refs]
  );

  /**
   * Initialize E2EE for video call
   */
  const initializeE2EE = useCallback(async () => {
    const roomId = refs.roomIdRef.current;
    const user = refs.userRef.current;
    const config = refs.configRef.current;
    const pc = refs.peerRef.current;
    const signalR = refs.signalRConnectionRef.current;

    // Compute peer ID based on current user's role
    const peerId =
      config?.initiatorUserId === user?.id ? config?.participantUserId : config?.initiatorUserId;

    if (!pc || !signalR || !roomId || !peerId) {
      console.warn('E2EE: Missing dependencies');
      return;
    }

    // Check E2EE support
    const e2eeSupport = getE2EESupport();
    if (!e2eeSupport.supported) {
      dispatch(setE2EEStatus('unsupported'));
      dispatch(setE2EEErrorMessage(e2eeSupport.userMessage));
      return;
    }

    try {
      dispatch(setE2EEStatus('initializing'));

      // Initialize E2EE managers
      refs.e2eeManagerRef.current ??= new E2EEManager();
      refs.streamsHandlerRef.current ??= new InsertableStreamsHandler(refs.e2eeManagerRef.current);

      await refs.streamsHandlerRef.current.initializeWorkers();

      // Key exchange events
      const keyExchangeEvents: KeyExchangeEvents = {
        onKeyExchangeComplete: (
          fingerprint,
          generation,
          peerSigningPublicKey,
          peerSigningFingerprint
        ) => {
          void (async () => {
            dispatch(setE2EERemoteFingerprint(fingerprint));
            dispatch(setE2EEKeyGeneration(generation));

            const keyMaterial = refs.e2eeManagerRef.current?.getCurrentKeyMaterial();
            if (!keyMaterial || !refs.streamsHandlerRef.current) return;

            const isSafari = refs.streamsHandlerRef.current.getE2EEMethod() === 'scriptTransform';

            if (isSafari) {
              await refs.streamsHandlerRef.current.updateWorkerKeys(keyMaterial);
              applyE2EEToMediaTracks();
              await new Promise<void>((r) => {
                setTimeout(r, 100);
              });
            } else {
              applyE2EEToMediaTracks();
              await refs.streamsHandlerRef.current.updateWorkerKeys(keyMaterial);
            }

            await new Promise<void>((r) => {
              setTimeout(r, 200);
            });
            refs.streamsHandlerRef.current.enableEncryption();
            await new Promise<void>((r) => {
              setTimeout(r, 100);
            });

            void initializeChatE2EE(
              keyMaterial.encryptionKey,
              peerSigningPublicKey,
              peerSigningFingerprint
            );
            dispatch(setE2EEStatus('active'));
          })();
        },

        onKeyRotation: (generation) => {
          void (async () => {
            dispatch(setE2EEKeyGeneration(generation));
            refs.lastKeyRotationRef.current = new Date().toISOString();

            const keyMaterial = refs.e2eeManagerRef.current?.getCurrentKeyMaterial();
            if (keyMaterial && refs.streamsHandlerRef.current) {
              await refs.streamsHandlerRef.current.updateWorkerKeys(keyMaterial);
            }
            dispatch(setE2EEStatus('active'));
          })();
        },

        onKeyExchangeError: (err) => {
          dispatch(setE2EEStatus('error'));
          dispatch(setE2EEErrorMessage(err));
        },

        onVerificationRequired:
          e2eeSupport.method === 'scriptTransform'
            ? undefined
            : () => {
                console.debug('🔐 E2EE: Verification required');
              },
      };

      refs.keyExchangeManagerRef.current = new E2EEKeyExchangeManager(
        refs.e2eeManagerRef.current,
        keyExchangeEvents
      );

      dispatch(setE2EEStatus('key-exchange'));
      const isInitiator = config?.initiatorUserId === user?.id;

      await refs.keyExchangeManagerRef.current.initialize(
        signalR,
        roomId,
        peerId,
        isInitiator,
        user?.id
      );

      const localFp = refs.keyExchangeManagerRef.current.getLocalFingerprint();
      dispatch(setE2EELocalFingerprint(localFp));

      // Start key rotation (initiator only)
      if (isInitiator) {
        refs.e2eeManagerRef.current.startKeyRotation(() => {
          dispatch(setE2EEStatus('key-rotation'));
          void refs.keyExchangeManagerRef.current?.rotateKeys();
        });
      }

      // Stats interval
      refs.statsIntervalRef.current = setInterval(() => {
        if (refs.streamsHandlerRef.current && refs.isMountedRef.current) {
          const frameStats = refs.streamsHandlerRef.current.getStats();
          const stats: EncryptionStats = {
            totalFrames: frameStats.totalFrames,
            encryptedFrames: frameStats.encryptedFrames,
            decryptedFrames: frameStats.decryptedFrames,
            encryptionErrors: frameStats.encryptionErrors,
            decryptionErrors: frameStats.decryptionErrors,
            averageEncryptionTime: frameStats.averageEncryptionTime,
            averageDecryptionTime: frameStats.averageDecryptionTime,
            droppedFrames: 0,
            lastKeyRotation: refs.lastKeyRotationRef.current,
          };
          dispatch(setE2EEEncryptionStats(stats));
        }
      }, STATS_UPDATE_INTERVAL);
    } catch (err) {
      console.error('E2EE: Initialization error:', err);
      dispatch(setE2EEStatus('error'));
      dispatch(setE2EEErrorMessage(String(err)));
    }
  }, [dispatch, refs, applyE2EEToMediaTracks, initializeChatE2EE]);

  // Sync function refs
  useEffect(() => {
    initializeChatE2EERef.current = initializeChatE2EE;
  }, [initializeChatE2EE, initializeChatE2EERef]);

  useEffect(() => {
    applyE2EEToMediaTracksRef.current = applyE2EEToMediaTracks;
  }, [applyE2EEToMediaTracks, applyE2EEToMediaTracksRef]);

  /**
   * Rotate encryption keys
   */
  const rotateKeys = useCallback(async () => {
    if (refs.keyExchangeManagerRef.current) {
      dispatch(setE2EEStatus('key-rotation'));
      await refs.keyExchangeManagerRef.current.rotateKeys();
    }
  }, [dispatch, refs]);

  return {
    status: e2eeStatus,
    isActive: e2eeStatus === 'active',
    localKeyFingerprint,
    remotePeerFingerprint,
    formattedLocalFingerprint: localKeyFingerprint
      ? E2EEKeyExchangeManager.formatFingerprintForDisplay(localKeyFingerprint)
      : null,
    formattedRemoteFingerprint: remotePeerFingerprint
      ? E2EEKeyExchangeManager.formatFingerprintForDisplay(remotePeerFingerprint)
      : null,
    keyGeneration,
    encryptionStats,
    compatibility,
    errorMessage: e2eeErrorMessage,
    rotateKeys,
    initializeE2EE,
    applyE2EEToMediaTracks,
    initializeChatE2EE,
  };
};

export default useVideoCallE2EE;
