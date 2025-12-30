/**
 * useChatE2Ee Hook
 *
 * Manages E2EE key exchange and encryption for chat threads.
 * Uses ECDH for key exchange and AES-GCM for message encryption.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  generateECDHKeyPair,
  importECDHPublicKey,
  deriveSharedKey,
  calculateKeyFingerprint,
  type ECDHKeyPair,
  type KeyFingerprint,
} from '../../../shared/core/crypto';
import {
  chatEncryptionManager,
  type EncryptedMessage,
  type DecryptedMessage,
} from '../../../shared/utils/crypto/e2eeChatEncryption';
import { chatHubService } from '../services/chatHub';

// ============================================================================
// Types
// ============================================================================

/** E2EE payload type for SignalR callbacks */
interface E2EEPayload {
  ThreadId: string;
  SenderId: string;
  PublicKey: string;
  Fingerprint: string;
}

export type ChatE2EEState = 'idle' | 'initiating' | 'waiting' | 'ready' | 'error';

export interface ChatE2EEStatus {
  state: ChatE2EEState;
  isReady: boolean;
  localFingerprint: KeyFingerprint | null;
  peerFingerprint: KeyFingerprint | null;
  error: string | null;
}

export interface UseChatE2EEOptions {
  threadId: string;
  peerId: string;
  autoInitiate?: boolean;
}

export interface UseChatE2EEReturn {
  status: ChatE2EEStatus;
  isReady: boolean;
  localFingerprint: KeyFingerprint | null;
  peerFingerprint: KeyFingerprint | null;
  initiateKeyExchange: () => Promise<void>;
  encryptMessage: (plaintext: string) => Promise<EncryptedMessage>;
  decryptMessage: (encrypted: EncryptedMessage) => Promise<DecryptedMessage>;
  cleanup: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const KEY_EXCHANGE_TIMEOUT_MS = 10000;

// ============================================================================
// Hook Implementation
// ============================================================================

export function useChatE2Ee(options: UseChatE2EEOptions): UseChatE2EEReturn {
  const { threadId, peerId, autoInitiate = true } = options;

  // State
  const [state, setState] = useState<ChatE2EEState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [localFingerprint, setLocalFingerprint] = useState<KeyFingerprint | null>(null);
  const [peerFingerprint, setPeerFingerprint] = useState<KeyFingerprint | null>(null);

  // Refs for key material (not in state to avoid re-renders)
  const keyPairRef = useRef<ECDHKeyPair | null>(null);
  const sharedKeyRef = useRef<CryptoKey | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitiatedRef = useRef(false);
  const isMountedRef = useRef(true);

  // Ref for state to avoid stale closures in event handlers
  const stateRef = useRef<ChatE2EEState>(state);

  // Sync ref with state
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // ==========================================================================
  // Key Exchange Handlers
  // ==========================================================================

  const handleKeyOffer = useCallback(
    async (data: {
      ThreadId: string;
      SenderId: string;
      PublicKey: string;
      Fingerprint: string;
    }) => {
      if (data.ThreadId !== threadId || data.SenderId !== peerId) return;
      if (!isMountedRef.current) return;

      console.debug(`🔐 [ChatE2EE] Received key offer from ${data.SenderId}`);

      try {
        // Generate our key pair if not already done - use nullish coalescing
        const keyPair = keyPairRef.current ?? (await generateECDHKeyPair());
        if (!keyPairRef.current) {
          keyPairRef.current = keyPair;
          setLocalFingerprint(keyPair.fingerprint);
        }

        // Import peer's public key
        const peerPublicKey = await importECDHPublicKey(data.PublicKey);
        const peerFp = await calculateKeyFingerprint(peerPublicKey);
        setPeerFingerprint(peerFp);

        // Derive shared key
        sharedKeyRef.current = await deriveSharedKey(keyPair.privateKey, peerPublicKey);

        // Initialize encryption manager
        await chatEncryptionManager.initializeConversation(
          threadId,
          sharedKeyRef.current,
          keyPair.privateKey,
          keyPair.publicKey,
          keyPair.fingerprint,
          data.PublicKey,
          peerFp
        );

        // Send our key answer
        if (chatHubService.isConnected()) {
          await chatHubService.sendKeyAnswer(
            threadId,
            keyPair.publicKeyBase64 as string,
            keyPair.fingerprint as string
          );
          // Notify peer that E2EE is ready
          await chatHubService.sendE2EEReady(threadId, keyPair.fingerprint as string);
        }

        setState('ready');
        console.debug('🔐 [ChatE2EE] Key exchange complete (responder)');
      } catch (err) {
        console.error('❌ [ChatE2EE] Error handling key offer:', err);
        setError('Key exchange failed');
        setState('error');
      }
    },
    [threadId, peerId]
  );

  const handleKeyAnswer = useCallback(
    async (data: {
      ThreadId: string;
      SenderId: string;
      PublicKey: string;
      Fingerprint: string;
    }) => {
      if (data.ThreadId !== threadId || data.SenderId !== peerId) return;
      if (!isMountedRef.current) return;
      // Use ref to avoid stale closure - state changes don't require re-registering handlers
      if (stateRef.current !== 'waiting') return;

      console.debug(`🔐 [ChatE2EE] Received key answer from ${data.SenderId}`);

      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      try {
        if (!keyPairRef.current) {
          throw new Error('No local key pair');
        }

        // Import peer's public key
        const peerPublicKey = await importECDHPublicKey(data.PublicKey);
        const peerFp = await calculateKeyFingerprint(peerPublicKey);
        setPeerFingerprint(peerFp);

        // Derive shared key
        sharedKeyRef.current = await deriveSharedKey(keyPairRef.current.privateKey, peerPublicKey);

        // Initialize encryption manager
        await chatEncryptionManager.initializeConversation(
          threadId,
          sharedKeyRef.current,
          keyPairRef.current.privateKey,
          keyPairRef.current.publicKey,
          keyPairRef.current.fingerprint,
          data.PublicKey,
          peerFp
        );

        // Notify peer that E2EE is ready
        if (chatHubService.isConnected()) {
          await chatHubService.sendE2EEReady(threadId, keyPairRef.current.fingerprint as string);
        }

        setState('ready');
        console.debug('🔐 [ChatE2EE] Key exchange complete (initiator)');
      } catch (err) {
        console.error('❌ [ChatE2EE] Error handling key answer:', err);
        setError('Key exchange failed');
        setState('error');
      }
    },
    [threadId, peerId] // Removed state - using stateRef instead to avoid stale closures
  );

  const handleE2EEError = useCallback((message: string) => {
    console.error('❌ [ChatE2EE] Server error:', message);
    setError(message);
    setState('error');
  }, []);

  // ==========================================================================
  // Key Exchange Initiation
  // ==========================================================================

  const initiateKeyExchange = useCallback(async (): Promise<void> => {
    // Use ref to avoid stale closure
    if (stateRef.current === 'ready' || stateRef.current === 'waiting') {
      console.debug('🔐 [ChatE2EE] Key exchange already in progress or complete');
      return;
    }

    console.debug(`🔐 [ChatE2EE] Initiating key exchange for thread ${threadId}`);
    setState('initiating');

    try {
      // Generate ECDH key pair
      const generatedKeyPair = await generateECDHKeyPair();
      keyPairRef.current = generatedKeyPair;
      setLocalFingerprint(generatedKeyPair.fingerprint);

      // Send key offer via SignalR
      if (!chatHubService.isConnected()) {
        throw new Error('Chat hub not connected');
      }

      await chatHubService.sendKeyOffer(
        threadId,
        generatedKeyPair.publicKeyBase64,
        generatedKeyPair.fingerprint
      );

      setState('waiting');

      // Set timeout for key exchange - will log warning if still waiting
      timeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          console.warn('⚠️ [ChatE2EE] Key exchange timeout - messages will be sent unencrypted');
        }
      }, KEY_EXCHANGE_TIMEOUT_MS);
    } catch (err) {
      console.error('❌ [ChatE2EE] Error initiating key exchange:', err);
      setError('Failed to initiate key exchange');
      setState('error');
    }
  }, [threadId]); // Removed state - using stateRef instead

  // ==========================================================================
  // Encryption / Decryption
  // ==========================================================================

  const encryptMessage = useCallback(
    async (plaintext: string): Promise<EncryptedMessage> => {
      if (!chatEncryptionManager.isConversationInitialized(threadId)) {
        throw new Error('E2EE not initialized for this conversation');
      }
      return chatEncryptionManager.encryptMessage(threadId, plaintext);
    },
    [threadId]
  );

  const decryptMessage = useCallback(
    async (encrypted: EncryptedMessage): Promise<DecryptedMessage> => {
      if (!chatEncryptionManager.isConversationInitialized(threadId)) {
        throw new Error('E2EE not initialized for this conversation');
      }
      return chatEncryptionManager.decryptMessage(threadId, encrypted);
    },
    [threadId]
  );

  // ==========================================================================
  // Cleanup
  // ==========================================================================

  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    chatEncryptionManager.removeConversation(threadId);
    keyPairRef.current = null;
    sharedKeyRef.current = null;
    setState('idle');
    setError(null);
    setLocalFingerprint(null);
    setPeerFingerprint(null);
  }, [threadId]);

  // ==========================================================================
  // Setup SignalR Event Handlers
  // ==========================================================================

  useEffect(() => {
    isMountedRef.current = true;

    // Register handlers with chatHubService (wrap async handlers)
    chatHubService.setCallbacks({
      onE2EEKeyOffer: (data: E2EEPayload) => {
        handleKeyOffer(data).catch(() => {});
      },
      onE2EEKeyAnswer: (data: E2EEPayload) => {
        handleKeyAnswer(data).catch(() => {});
      },
      onE2EEReady: (data: { ThreadId: string; SenderId: string; Fingerprint: string }) => {
        if (data.ThreadId === threadId && data.SenderId === peerId) {
          console.debug(`🔐 [ChatE2EE] Peer confirmed E2EE ready: ${data.Fingerprint}`);
        }
      },
      onE2EEError: handleE2EEError,
    });

    // Auto-initiate if enabled and hub is connected
    if (autoInitiate && !isInitiatedRef.current && chatHubService.isConnected()) {
      isInitiatedRef.current = true;
      void initiateKeyExchange();
    }

    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [
    autoInitiate,
    handleKeyOffer,
    handleKeyAnswer,
    handleE2EEError,
    initiateKeyExchange,
    threadId,
    peerId,
  ]);

  // ==========================================================================
  // Return
  // ==========================================================================

  const status: ChatE2EEStatus = {
    state,
    isReady: state === 'ready',
    localFingerprint,
    peerFingerprint,
    error,
  };

  return {
    status,
    isReady: state === 'ready',
    localFingerprint,
    peerFingerprint,
    initiateKeyExchange,
    encryptMessage,
    decryptMessage,
    cleanup,
  };
}

export default useChatE2Ee;
