/**
 * E2EE Hub Types - Typed SignalR Events for E2EE
 *
 * Single source of truth for all E2EE-related SignalR messages.
 * Matches the backend E2EEMessageDto and E2EEMessageType.
 */

import type { HubConnection } from '@microsoft/signalr';

// ============================================================================
// E2EE Message Types (matches backend E2EEMessageType enum)
// ============================================================================

export const E2EEMessageType = {
  KeyOffer: 1,
  KeyAnswer: 2,
  KeyRotation: 3,
  KeyConfirmation: 4,
  KeyRejection: 5,
} as const;

export type E2EEMessageTypeValue = (typeof E2EEMessageType)[keyof typeof E2EEMessageType];

export type E2EEMessageTypeName = keyof typeof E2EEMessageType;

// ============================================================================
// E2EE Message DTOs (matches backend)
// ============================================================================

/**
 * Message sent to the hub for forwarding
 */
export interface E2EEOutboundMessage {
  type: E2EEMessageTypeValue;
  targetUserId: string;
  roomId: string;
  encryptedPayload: string;
  keyFingerprint?: string;
  keyGeneration?: number;
  clientTimestamp?: string;
}

/**
 * Message received from the hub
 */
export interface E2EEInboundMessage {
  fromUserId: string;
  type: string;
  payload: string;
  keyFingerprint?: string;
  keyGeneration?: number;
  timestamp: string;
}

/**
 * Operation result from ForwardE2EEMessage
 */
export interface E2EEOperationResult {
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
}

// ============================================================================
// E2EE Error Codes (matches backend E2EEErrorCodes)
// ============================================================================

export const E2EEErrorCodes = {
  RateLimitExceeded: 'E2EE_RATE_LIMIT',
  InvalidPayload: 'E2EE_INVALID_PAYLOAD',
  InvalidTarget: 'E2EE_INVALID_TARGET',
  InvalidRoom: 'E2EE_INVALID_ROOM',
  MessageTooLarge: 'E2EE_MESSAGE_TOO_LARGE',
  Unauthorized: 'E2EE_UNAUTHORIZED',
  TargetNotFound: 'E2EE_TARGET_NOT_FOUND',
} as const;

export type E2EEErrorCode = (typeof E2EEErrorCodes)[keyof typeof E2EEErrorCodes];

// ============================================================================
// SignalR Hub Method Names
// ============================================================================

export const E2EEHubMethods = {
  ForwardE2EEMessage: 'ForwardE2EEMessage',
} as const;

export const E2EEHubEvents = {
  ReceiveE2EEMessage: 'ReceiveE2EEMessage',
  // Legacy events still needed for receiving (backend sends these)
  ReceiveKeyOffer: 'receivekeyoffer',
  ReceiveKeyAnswer: 'receivekeyanswer',
  ReceiveKeyRotation: 'receivekeyrotation',
} as const;

// ============================================================================
// Typed Hub Connection Extensions
// ============================================================================

/**
 * Type-safe E2EE message sending
 */
export async function sendE2EEMessage(
  connection: HubConnection,
  message: E2EEOutboundMessage
): Promise<E2EEOperationResult> {
  try {
    return await connection.invoke<E2EEOperationResult>(E2EEHubMethods.ForwardE2EEMessage, message);
  } catch (error) {
    console.error('Failed to send E2EE message:', error);
    return {
      success: false,
      errorCode: 'NETWORK_ERROR',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Type-safe E2EE event subscription
 */
export function onE2EEMessage(
  connection: HubConnection,
  callback: (message: E2EEInboundMessage) => void
): void {
  connection.on(E2EEHubEvents.ReceiveE2EEMessage, callback);
}

/**
 * Remove E2EE event subscription
 */
export function offE2EEMessage(
  connection: HubConnection,
  callback?: (message: E2EEInboundMessage) => void
): void {
  if (callback) {
    connection.off(E2EEHubEvents.ReceiveE2EEMessage, callback);
  } else {
    connection.off(E2EEHubEvents.ReceiveE2EEMessage);
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Converts message type value to name
 */
export function getMessageTypeName(type: E2EEMessageTypeValue): E2EEMessageTypeName {
  const entries = Object.entries(E2EEMessageType) as [E2EEMessageTypeName, E2EEMessageTypeValue][];
  const found = entries.find(([, value]) => value === type);
  return found?.[0] ?? 'KeyOffer';
}

/**
 * Checks if an error is a rate limit error
 */
export function isRateLimitError(result: E2EEOperationResult): boolean {
  return result.errorCode === E2EEErrorCodes.RateLimitExceeded;
}

/**
 * Creates an E2EE key offer message
 */
export function createKeyOfferMessage(
  targetUserId: string,
  roomId: string,
  publicKeyBase64: string,
  signature: string,
  fingerprint: string
): E2EEOutboundMessage {
  const payload = JSON.stringify({
    publicKey: publicKeyBase64,
    signature,
    timestamp: Date.now(),
    nonce: crypto.randomUUID(),
  });

  return {
    type: E2EEMessageType.KeyOffer,
    targetUserId,
    roomId,
    encryptedPayload: payload,
    keyFingerprint: fingerprint.slice(0, 16),
    keyGeneration: 1,
    clientTimestamp: new Date().toISOString(),
  };
}

/**
 * Creates an E2EE key answer message
 */
export function createKeyAnswerMessage(
  targetUserId: string,
  roomId: string,
  publicKeyBase64: string,
  signature: string,
  fingerprint: string,
  keyGeneration: number
): E2EEOutboundMessage {
  const payload = JSON.stringify({
    publicKey: publicKeyBase64,
    signature,
    timestamp: Date.now(),
    nonce: crypto.randomUUID(),
  });

  return {
    type: E2EEMessageType.KeyAnswer,
    targetUserId,
    roomId,
    encryptedPayload: payload,
    keyFingerprint: fingerprint.slice(0, 16),
    keyGeneration,
    clientTimestamp: new Date().toISOString(),
  };
}

/**
 * Creates an E2EE key rotation message
 */
export function createKeyRotationMessage(
  targetUserId: string,
  roomId: string,
  newPublicKeyBase64: string,
  signature: string,
  fingerprint: string,
  keyGeneration: number
): E2EEOutboundMessage {
  const payload = JSON.stringify({
    publicKey: newPublicKeyBase64,
    signature,
    timestamp: Date.now(),
    nonce: crypto.randomUUID(),
    generation: keyGeneration,
  });

  return {
    type: E2EEMessageType.KeyRotation,
    targetUserId,
    roomId,
    encryptedPayload: payload,
    keyFingerprint: fingerprint.slice(0, 16),
    keyGeneration,
    clientTimestamp: new Date().toISOString(),
  };
}
