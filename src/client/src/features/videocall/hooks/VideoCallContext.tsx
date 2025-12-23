/**
 * VideoCall Shared Context
 *
 * Provides shared refs and state between modular video call hooks.
 * This enables clean separation of concerns while maintaining
 * necessary communication between WebRTC, SignalR, E2EE, and media.
 */

import {
  type RefObject,
  type ReactNode,
  type FC,
  createContext,
  useRef,
  useMemo,
  useContext,
  useEffect,
} from 'react';
import { E2EEChatManager } from '../../../shared/utils/crypto/e2eeChatEncryption';
import type { ChatE2EEStatus } from './types';
import type { E2EEKeyExchangeManager } from '../../../shared/utils/crypto/e2eeKeyExchange';
import type { E2EEManager } from '../../../shared/utils/crypto/e2eeVideoEncryption';
import type { InsertableStreamsHandler } from '../../../shared/utils/crypto/insertableStreamsHandler';
import type { VideoCallConfig } from '../types/VideoCallConfig';
import type { HubConnection } from '@microsoft/signalr';

// ============================================================================
// Types
// ============================================================================

interface User {
  id: string;
  firstName?: string;
  lastName?: string;
}

export interface VideoCallSharedRefs {
  // WebRTC
  peerRef: RefObject<RTCPeerConnection | null>;
  signalRConnectionRef: RefObject<HubConnection | null>;
  iceCandidatesBuffer: RefObject<RTCIceCandidateInit[]>;

  // State tracking
  isInitializedRef: RefObject<boolean>;
  isMountedRef: RefObject<boolean>;

  // Timers
  reconnectTimeoutRef: RefObject<ReturnType<typeof setTimeout> | null>;
  heartbeatIntervalRef: RefObject<ReturnType<typeof setInterval> | null>;
  statsIntervalRef: RefObject<ReturnType<typeof setInterval> | null>;

  // State mirrors for callbacks (avoid stale closures)
  roomIdRef: RefObject<string>;
  sessionIdRef: RefObject<string | null>;
  peerIdRef: RefObject<string | null>;
  isConnectedRef: RefObject<boolean>;
  isMicEnabledRef: RefObject<boolean>;
  isVideoEnabledRef: RefObject<boolean>;
  isScreenSharingRef: RefObject<boolean>;
  chatE2EEStatusRef: RefObject<ChatE2EEStatus>;
  userRef: RefObject<User | null>;

  // E2EE
  e2eeManagerRef: RefObject<E2EEManager | null>;
  streamsHandlerRef: RefObject<InsertableStreamsHandler | null>;
  keyExchangeManagerRef: RefObject<E2EEKeyExchangeManager | null>;
  chatManagerRef: RefObject<E2EEChatManager>;
  localSigningKeyRef: RefObject<CryptoKey | null>;
  localVerificationKeyRef: RefObject<CryptoKey | null>;
  configRef: RefObject<VideoCallConfig | null>;
  lastKeyRotationRef: RefObject<string | null>;
  e2eeTransformsAppliedRef: RefObject<boolean>;
  offerSentForPeerRef: RefObject<Set<string>>;
}

export interface VideoCallContextValue {
  refs: VideoCallSharedRefs;
  // Function refs for breaking circular dependencies
  cleanupResourcesRef: RefObject<(isFullCleanup?: boolean) => Promise<void>>;
  setupSignalRRef: RefObject<(config: VideoCallConfig) => Promise<void>>;
  applyE2EEToMediaTracksRef: RefObject<() => void>;
  initializeChatE2EERef: RefObject<
    (
      sharedEncryptionKey: CryptoKey | undefined,
      peerSigningPublicKey?: string,
      peerSigningFingerprint?: string
    ) => Promise<void>
  >;
}

// ============================================================================
// Context
// ============================================================================

const VideoCallContext = createContext<VideoCallContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

interface VideoCallProviderProps {
  children: ReactNode;
}

export const VideoCallProvider: FC<VideoCallProviderProps> = ({ children }) => {
  // WebRTC refs
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const signalRConnectionRef = useRef<HubConnection | null>(null);
  const iceCandidatesBuffer = useRef<RTCIceCandidateInit[]>([]);

  // State tracking refs
  const isInitializedRef = useRef(false);
  const isMountedRef = useRef(true);

  // Timer refs
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const statsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // State mirror refs
  const roomIdRef = useRef('');
  const sessionIdRef = useRef<string | null>(null);
  const peerIdRef = useRef<string | null>(null);
  const isConnectedRef = useRef(false);
  const isMicEnabledRef = useRef(true);
  const isVideoEnabledRef = useRef(true);
  const isScreenSharingRef = useRef(false);
  const chatE2EEStatusRef = useRef<ChatE2EEStatus>('disabled');
  const userRef = useRef<User | null>(null);

  // E2EE refs
  const e2eeManagerRef = useRef<E2EEManager | null>(null);
  const streamsHandlerRef = useRef<InsertableStreamsHandler | null>(null);
  const keyExchangeManagerRef = useRef<E2EEKeyExchangeManager | null>(null);
  const chatManagerRef = useRef<E2EEChatManager>(new E2EEChatManager());
  const localSigningKeyRef = useRef<CryptoKey | null>(null);
  const localVerificationKeyRef = useRef<CryptoKey | null>(null);
  const configRef = useRef<VideoCallConfig | null>(null);
  const lastKeyRotationRef = useRef<string | null>(null);
  const e2eeTransformsAppliedRef = useRef(false);
  const offerSentForPeerRef = useRef<Set<string>>(new Set());

  // Function refs for breaking circular dependencies
  const cleanupResourcesRef = useRef<(isFullCleanup?: boolean) => Promise<void>>(async () => {});
  const setupSignalRRef = useRef<(config: VideoCallConfig) => Promise<void>>(async () => {});
  const applyE2EEToMediaTracksRef = useRef<() => void>(() => {});
  const initializeChatE2EERef = useRef<
    (
      sharedEncryptionKey: CryptoKey | undefined,
      peerSigningPublicKey?: string,
      peerSigningFingerprint?: string
    ) => Promise<void>
  >(async () => {});

  const refs = useMemo<VideoCallSharedRefs>(
    () => ({
      peerRef,
      signalRConnectionRef,
      iceCandidatesBuffer,
      isInitializedRef,
      isMountedRef,
      reconnectTimeoutRef,
      heartbeatIntervalRef,
      statsIntervalRef,
      roomIdRef,
      sessionIdRef,
      peerIdRef,
      isConnectedRef,
      isMicEnabledRef,
      isVideoEnabledRef,
      isScreenSharingRef,
      chatE2EEStatusRef,
      userRef,
      e2eeManagerRef,
      streamsHandlerRef,
      keyExchangeManagerRef,
      chatManagerRef,
      localSigningKeyRef,
      localVerificationKeyRef,
      configRef,
      lastKeyRotationRef,
      e2eeTransformsAppliedRef,
      offerSentForPeerRef,
    }),
    []
  );

  const value = useMemo<VideoCallContextValue>(
    () => ({
      refs,
      cleanupResourcesRef,
      setupSignalRRef,
      applyE2EEToMediaTracksRef,
      initializeChatE2EERef,
    }),
    [refs]
  );

  return <VideoCallContext.Provider value={value}>{children}</VideoCallContext.Provider>;
};

// ============================================================================
// Hook
// ============================================================================

// eslint-disable-next-line react-refresh/only-export-components
export const useVideoCallContext = (): VideoCallContextValue => {
  const context = useContext(VideoCallContext);
  if (!context) {
    throw new Error('useVideoCallContext must be used within a VideoCallProvider');
  }
  return context;
};

// ============================================================================
// Ref Sync Hook
// ============================================================================

/**
 * Hook to sync Redux state to refs for use in callbacks.
 * This is intentional - refs are mutable by design and we need to
 * sync state to refs to avoid stale closures in event handlers.
 */
/* eslint-disable react-hooks/immutability */
// eslint-disable-next-line react-refresh/only-export-components
export const useRefSync = (
  refs: VideoCallSharedRefs,
  state: {
    roomId: string;
    sessionId: string | null;
    peerId: string | null;
    isConnected: boolean;
    isMicEnabled: boolean;
    isVideoEnabled: boolean;
    isScreenSharing: boolean;
    chatE2EEStatus: ChatE2EEStatus;
    user: User | null;
  }
): void => {
  // Sync each state value to its ref
  useEffect(() => {
    refs.roomIdRef.current = state.roomId;
  }, [refs, state.roomId]);
  useEffect(() => {
    refs.sessionIdRef.current = state.sessionId;
  }, [refs, state.sessionId]);
  useEffect(() => {
    refs.peerIdRef.current = state.peerId;
  }, [refs, state.peerId]);
  useEffect(() => {
    refs.isConnectedRef.current = state.isConnected;
  }, [refs, state.isConnected]);
  useEffect(() => {
    refs.isMicEnabledRef.current = state.isMicEnabled;
  }, [refs, state.isMicEnabled]);
  useEffect(() => {
    refs.isVideoEnabledRef.current = state.isVideoEnabled;
  }, [refs, state.isVideoEnabled]);
  useEffect(() => {
    refs.isScreenSharingRef.current = state.isScreenSharing;
  }, [refs, state.isScreenSharing]);
  useEffect(() => {
    refs.chatE2EEStatusRef.current = state.chatE2EEStatus;
  }, [refs, state.chatE2EEStatus]);
  useEffect(() => {
    refs.userRef.current = state.user;
  }, [refs, state.user]);
};

export default VideoCallContext;
