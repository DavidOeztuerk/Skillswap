/**
 * E2EE Chat Encryption Manager
 *
 * Orchestriert ECDSA Signing/Verification und AES-GCM Encryption für Chat-Nachrichten.
 * Nutzt die core/crypto Primitives für alle kryptographischen Operationen.
 */

import {
  // Types
  type ECDSAKeyPair,
  type KeyFingerprint,
  type KeyGeneration,
  // ECDSA Functions
  generateECDSAKeyPair,
  signData,
  verifySignature,
  importECDSAVerificationKey,
  exportECDSAVerificationKey,
  calculateECDSAFingerprint,
  // AES-GCM Functions
  encryptAesGcm,
  decryptAesGcm,
  // Encoding
  arrayBufferToBase64,
  base64ToArrayBuffer,
  stringToArrayBuffer,
  arrayBufferToString,
  extractIvAndData,
  // Constants
  IV_LENGTH,
} from '../../core/crypto';

// ============================================================================
// Types
// ============================================================================

export interface EncryptedMessage {
  encryptedContent: string;
  iv: string;
  signature: string;
  timestamp: number;
  keyGeneration: KeyGeneration;
  senderFingerprint: KeyFingerprint;
}

export interface DecryptedMessage {
  content: string;
  timestamp: number;
  keyGeneration: KeyGeneration;
  senderFingerprint: KeyFingerprint;
  isVerified: boolean;
}

export interface ConversationKeyMaterial {
  encryptionKey: CryptoKey;
  signingKey: CryptoKey;
  verificationKey: CryptoKey;
  peerVerificationKey: CryptoKey | null;
  createdAt: number;
  generation: KeyGeneration;
  localFingerprint: KeyFingerprint;
  peerFingerprint: KeyFingerprint | null;
}

export interface SigningKeyPairResult {
  signingKey: CryptoKey;
  verificationKey: CryptoKey;
  publicKeyBase64: string;
  fingerprint: KeyFingerprint;
}

// ============================================================================
// E2EE Chat Manager
// ============================================================================

/**
 * E2EE Chat Manager - Orchestriert Message Encryption und Signing
 */
export class E2EEChatManager {
  private conversationKeys = new Map<string, ConversationKeyMaterial>();

  /**
   * Generiert ein neues ECDSA Signing Key Pair
   */
  async generateSigningKeyPair(): Promise<SigningKeyPairResult> {
    const keyPair: ECDSAKeyPair = await generateECDSAKeyPair();

    const publicKeyBase64 = await exportECDSAVerificationKey(keyPair.verificationKey);
    const fingerprint = await calculateECDSAFingerprint(keyPair.verificationKey);

    console.debug('🔐 Chat E2EE: Generated new signing key pair');

    return {
      signingKey: keyPair.signingKey,
      verificationKey: keyPair.verificationKey,
      publicKeyBase64,
      fingerprint,
    };
  }

  /**
   * Initialisiert eine Konversation mit Encryption und Signing Keys
   */
  async initializeConversation(
    conversationId: string,
    sharedEncryptionKey: CryptoKey,
    localSigningKey: CryptoKey,
    localVerificationKey: CryptoKey,
    localFingerprint: KeyFingerprint,
    peerVerificationKeyBase64?: string,
    peerFingerprint?: KeyFingerprint
  ): Promise<void> {
    let peerVerificationKey: CryptoKey | null = null;

    if (peerVerificationKeyBase64) {
      peerVerificationKey = await importECDSAVerificationKey(peerVerificationKeyBase64);
    }

    this.conversationKeys.set(conversationId, {
      encryptionKey: sharedEncryptionKey,
      signingKey: localSigningKey,
      verificationKey: localVerificationKey,
      peerVerificationKey,
      createdAt: Date.now(),
      generation: 1 as KeyGeneration,
      localFingerprint,
      peerFingerprint: peerFingerprint ?? null,
    });

    console.debug(`🔐 Chat E2EE: Initialized conversation ${conversationId} (generation 1)`);
  }

  /**
   * Aktualisiert den Peer Verification Key
   */
  async updatePeerVerificationKey(
    conversationId: string,
    peerVerificationKeyBase64: string,
    peerFingerprint: KeyFingerprint
  ): Promise<void> {
    const keyMaterial = this.conversationKeys.get(conversationId);
    if (!keyMaterial) {
      throw new Error(`Conversation ${conversationId} not initialized`);
    }

    keyMaterial.peerVerificationKey = await importECDSAVerificationKey(peerVerificationKeyBase64);
    keyMaterial.peerFingerprint = peerFingerprint;

    console.debug(`🔐 Chat E2EE: Updated peer verification key for ${conversationId}`);
  }

  /**
   * Verschlüsselt und signiert eine Nachricht
   */
  async encryptMessage(conversationId: string, plaintext: string): Promise<EncryptedMessage> {
    const keyMaterial = this.conversationKeys.get(conversationId);
    if (!keyMaterial) {
      throw new Error(`Conversation ${conversationId} not initialized`);
    }

    // Convert plaintext to ArrayBuffer
    const plaintextBuffer = stringToArrayBuffer(plaintext);

    // Encrypt with AES-GCM - returns combined [IV][Ciphertext+AuthTag]
    const encryptedCombined = await encryptAesGcm(keyMaterial.encryptionKey, plaintextBuffer);

    // Extract IV and ciphertext from combined buffer
    const { iv, ciphertext } = extractIvAndData(encryptedCombined, IV_LENGTH);

    // Sign the encrypted data (ciphertext only, not IV) - returns Base64
    const signatureBase64 = await signData(
      keyMaterial.signingKey,
      ciphertext.buffer as ArrayBuffer
    );

    // Encode to Base64
    const encryptedContent = arrayBufferToBase64(ciphertext.buffer as ArrayBuffer);
    const ivBase64 = arrayBufferToBase64(iv.buffer as ArrayBuffer);

    return {
      encryptedContent,
      iv: ivBase64,
      signature: signatureBase64,
      timestamp: Date.now(),
      keyGeneration: keyMaterial.generation,
      senderFingerprint: keyMaterial.localFingerprint,
    };
  }

  /**
   * Verifiziert und entschlüsselt eine Nachricht
   */
  async decryptMessage(
    conversationId: string,
    encryptedMessage: EncryptedMessage
  ): Promise<DecryptedMessage> {
    const keyMaterial = this.conversationKeys.get(conversationId);
    if (!keyMaterial) {
      throw new Error(`Conversation ${conversationId} not initialized`);
    }

    // Decode from Base64
    const encryptedBuffer = base64ToArrayBuffer(encryptedMessage.encryptedContent);
    const iv = base64ToArrayBuffer(encryptedMessage.iv);

    // Verify signature if peer key is available
    let isVerified = false;
    if (keyMaterial.peerVerificationKey) {
      try {
        // verifySignature expects: (key, data, signatureBase64)
        isVerified = await verifySignature(
          keyMaterial.peerVerificationKey,
          encryptedBuffer,
          encryptedMessage.signature
        );

        if (!isVerified) {
          console.warn('⚠️ Chat E2EE: Message signature verification failed!');
        }
      } catch (error) {
        console.error('❌ Chat E2EE: Signature verification error:', error);
        isVerified = false;
      }
    } else {
      console.warn(
        '⚠️ Chat E2EE: Peer verification key not available, skipping signature verification'
      );
    }

    // Combine IV and ciphertext for decryption (decryptAesGcm expects combined format)
    const ivArray = new Uint8Array(iv);
    const encryptedArray = new Uint8Array(encryptedBuffer);
    const combined = new Uint8Array(ivArray.length + encryptedArray.length);
    combined.set(ivArray, 0);
    combined.set(encryptedArray, ivArray.length);

    // Decrypt
    let decryptedBuffer: ArrayBuffer;
    try {
      decryptedBuffer = await decryptAesGcm(keyMaterial.encryptionKey, combined.buffer);
    } catch (error) {
      console.error('❌ Chat E2EE: Decryption failed:', error);
      throw new Error('Failed to decrypt message - invalid key or corrupted data');
    }

    // Convert to string
    const content = arrayBufferToString(decryptedBuffer);

    return {
      content,
      timestamp: encryptedMessage.timestamp,
      keyGeneration: encryptedMessage.keyGeneration,
      senderFingerprint: encryptedMessage.senderFingerprint,
      isVerified,
    };
  }

  /**
   * Rotiert den Encryption Key für eine Konversation
   */
  rotateConversationKey(conversationId: string, newEncryptionKey: CryptoKey): void {
    const keyMaterial = this.conversationKeys.get(conversationId);
    if (!keyMaterial) {
      throw new Error(`Conversation ${conversationId} not initialized`);
    }

    keyMaterial.encryptionKey = newEncryptionKey;
    keyMaterial.generation = (keyMaterial.generation + 1) as KeyGeneration;
    keyMaterial.createdAt = Date.now();

    console.debug(
      `🔄 Chat E2EE: Rotated keys for ${conversationId} (generation ${keyMaterial.generation})`
    );
  }

  /**
   * Gibt das Key Material für eine Konversation zurück
   */
  getConversationKeyMaterial(conversationId: string): ConversationKeyMaterial | null {
    return this.conversationKeys.get(conversationId) ?? null;
  }

  /**
   * Prüft ob eine Konversation initialisiert ist
   */
  isConversationInitialized(conversationId: string): boolean {
    return this.conversationKeys.has(conversationId);
  }

  /**
   * Entfernt eine Konversation
   */
  removeConversation(conversationId: string): void {
    this.conversationKeys.delete(conversationId);
    console.debug(`🧹 Chat E2EE: Removed conversation ${conversationId}`);
  }

  /**
   * Gibt die Generation einer Konversation zurück
   */
  getConversationGeneration(conversationId: string): number {
    const keyMaterial = this.conversationKeys.get(conversationId);
    return keyMaterial?.generation ?? 0;
  }

  /**
   * Gibt alle aktiven Konversations-IDs zurück
   */
  getActiveConversationIds(): string[] {
    return [...this.conversationKeys.keys()];
  }

  /**
   * Cleanup - Gibt alle Ressourcen frei
   */
  cleanup(): void {
    this.conversationKeys.clear();
    console.debug('🧹 Chat E2EE: Cleanup complete');
  }
}

// Singleton Instance für einfache Verwendung
export const chatEncryptionManager = new E2EEChatManager();
