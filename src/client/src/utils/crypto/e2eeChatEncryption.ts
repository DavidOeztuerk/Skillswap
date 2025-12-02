/**
 * End-to-End Encryption for Chat Messages
 *
 * This module implements E2EE for text messages using:
 * - AES-256-GCM for message encryption
 * - ECDSA (P-256) for message signing/verification
 * - Per-conversation keys (derived from ECDH)
 * - Message authentication & integrity
 *
 * Security Properties:
 * - Confidentiality: Only conversation participants can read messages
 * - Authenticity: Sender identity verified via digital signatures
 * - Integrity: Tampering detected via authentication tags
 * - Forward Secrecy: Optional key rotation for long conversations
 *
 * Message Format:
 * ```
 * {
 *   encryptedContent: string (base64),
 *   iv: string (base64),
 *   signature: string (base64),
 *   timestamp: number,
 *   keyGeneration: number,
 *   senderFingerprint: string
 * }
 * ```
 */

const ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12; // 96 bits
const AUTH_TAG_LENGTH = 128; // 128 bits
const SIGNATURE_ALGORITHM = 'ECDSA';
const SIGNATURE_HASH = 'SHA-256';

/**
 * Encrypted message structure
 */
export interface EncryptedMessage {
  /** Base64-encoded encrypted content */
  encryptedContent: string;
  /** Base64-encoded initialization vector */
  iv: string;
  /** Base64-encoded digital signature (ECDSA) */
  signature: string;
  /** Message timestamp (milliseconds) */
  timestamp: number;
  /** Key generation number (for rotation support) */
  keyGeneration: number;
  /** Sender's public key fingerprint (for verification) */
  senderFingerprint: string;
}

/**
 * Decrypted message structure
 */
export interface DecryptedMessage {
  /** Plaintext message content */
  content: string;
  /** Message timestamp */
  timestamp: number;
  /** Key generation used */
  keyGeneration: number;
  /** Sender's fingerprint */
  senderFingerprint: string;
  /** Signature verification result */
  isVerified: boolean;
}

/**
 * Conversation key material
 */
export interface ConversationKeyMaterial {
  /** AES-GCM encryption key */
  encryptionKey: CryptoKey;
  /** ECDSA signing key (private) */
  signingKey: CryptoKey;
  /** ECDSA verification key (public) */
  verificationKey: CryptoKey;
  /** Remote peer's verification key */
  peerVerificationKey: CryptoKey | null;
  /** Key creation timestamp */
  createdAt: number;
  /** Key generation number */
  generation: number;
  /** Local public key fingerprint */
  localFingerprint: string;
  /** Remote peer's fingerprint */
  peerFingerprint: string | null;
}

/**
 * E2EE Chat Manager
 */
export class E2EEChatManager {
  private conversationKeys = new Map<string, ConversationKeyMaterial>();

  /**
   * Generate signing key pair (ECDSA P-256)
   */
  async generateSigningKeyPair(): Promise<{
    signingKey: CryptoKey;
    verificationKey: CryptoKey;
    publicKeyBase64: string;
    fingerprint: string;
  }> {
    // Generate ECDSA key pair for message signing
    const keyPair = await crypto.subtle.generateKey(
      {
        name: SIGNATURE_ALGORITHM,
        namedCurve: 'P-256',
      },
      true, // extractable (need to export public key)
      ['sign', 'verify']
    );

    // Export public key for sharing
    const publicKeyArrayBuffer = await crypto.subtle.exportKey('raw', keyPair.publicKey);
    const publicKeyBase64 = this.arrayBufferToBase64(publicKeyArrayBuffer);

    // Generate fingerprint
    const fingerprintBuffer = await crypto.subtle.digest('SHA-256', publicKeyArrayBuffer);
    const fingerprint = this.arrayBufferToHex(fingerprintBuffer);

    return {
      signingKey: keyPair.privateKey,
      verificationKey: keyPair.publicKey,
      publicKeyBase64,
      fingerprint,
    };
  }

  /**
   * Initialize conversation with shared encryption key and signing keys
   */
  async initializeConversation(
    conversationId: string,
    sharedEncryptionKey: CryptoKey,
    localSigningKey: CryptoKey,
    localVerificationKey: CryptoKey,
    localFingerprint: string,
    peerVerificationKeyBase64?: string,
    peerFingerprint?: string
  ): Promise<void> {
    // Import peer's verification key if provided
    let peerVerificationKey: CryptoKey | null = null;

    if (peerVerificationKeyBase64) {
      const peerKeyBuffer = this.base64ToArrayBuffer(peerVerificationKeyBase64);
      peerVerificationKey = await crypto.subtle.importKey(
        'raw',
        peerKeyBuffer,
        {
          name: SIGNATURE_ALGORITHM,
          namedCurve: 'P-256',
        },
        false,
        ['verify']
      );
    }

    // Store conversation keys
    this.conversationKeys.set(conversationId, {
      encryptionKey: sharedEncryptionKey,
      signingKey: localSigningKey,
      verificationKey: localVerificationKey,
      peerVerificationKey,
      createdAt: Date.now(),
      generation: 1,
      localFingerprint,
      peerFingerprint: peerFingerprint || null,
    });

    console.log(`🔐 Chat E2EE: Initialized conversation ${conversationId} (generation 1)`);
  }

  /**
   * Update peer's verification key (when received)
   */
  async updatePeerVerificationKey(
    conversationId: string,
    peerVerificationKeyBase64: string,
    peerFingerprint: string
  ): Promise<void> {
    const keyMaterial = this.conversationKeys.get(conversationId);
    if (!keyMaterial) {
      throw new Error(`Conversation ${conversationId} not initialized`);
    }

    const peerKeyBuffer = this.base64ToArrayBuffer(peerVerificationKeyBase64);
    const peerVerificationKey = await crypto.subtle.importKey(
      'raw',
      peerKeyBuffer,
      {
        name: SIGNATURE_ALGORITHM,
        namedCurve: 'P-256',
      },
      false,
      ['verify']
    );

    keyMaterial.peerVerificationKey = peerVerificationKey;
    keyMaterial.peerFingerprint = peerFingerprint;

    console.log(`🔐 Chat E2EE: Updated peer verification key for ${conversationId}`);
  }

  /**
   * Encrypt and sign a message
   */
  async encryptMessage(conversationId: string, plaintext: string): Promise<EncryptedMessage> {
    const keyMaterial = this.conversationKeys.get(conversationId);
    if (!keyMaterial) {
      throw new Error(`Conversation ${conversationId} not initialized`);
    }

    // Convert plaintext to ArrayBuffer
    const encoder = new TextEncoder();
    const plaintextBuffer = encoder.encode(plaintext);

    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

    // Encrypt message
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv,
        tagLength: AUTH_TAG_LENGTH,
      },
      keyMaterial.encryptionKey,
      plaintextBuffer
    );

    // Sign the encrypted content (provides authenticity)
    const signature = await crypto.subtle.sign(
      {
        name: SIGNATURE_ALGORITHM,
        hash: SIGNATURE_HASH,
      },
      keyMaterial.signingKey,
      encryptedBuffer
    );

    // Convert to base64 for transmission
    const encryptedContent = this.arrayBufferToBase64(encryptedBuffer);
    const ivBase64 = this.arrayBufferToBase64(iv.buffer);
    const signatureBase64 = this.arrayBufferToBase64(signature);

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
   * Decrypt and verify a message
   */
  async decryptMessage(conversationId: string, encryptedMessage: EncryptedMessage): Promise<DecryptedMessage> {
    const keyMaterial = this.conversationKeys.get(conversationId);
    if (!keyMaterial) {
      throw new Error(`Conversation ${conversationId} not initialized`);
    }

    // Convert from base64
    const encryptedBuffer = this.base64ToArrayBuffer(encryptedMessage.encryptedContent);
    const iv = this.base64ToArrayBuffer(encryptedMessage.iv);
    const signature = this.base64ToArrayBuffer(encryptedMessage.signature);

    // Verify signature (if peer's verification key is available)
    let isVerified = false;
    if (keyMaterial.peerVerificationKey) {
      try {
        isVerified = await crypto.subtle.verify(
          {
            name: SIGNATURE_ALGORITHM,
            hash: SIGNATURE_HASH,
          },
          keyMaterial.peerVerificationKey,
          signature,
          encryptedBuffer
        );

        if (!isVerified) {
          console.warn('⚠️ Chat E2EE: Message signature verification failed!');
        }
      } catch (error) {
        console.error('❌ Chat E2EE: Signature verification error:', error);
        isVerified = false;
      }
    } else {
      console.warn('⚠️ Chat E2EE: Peer verification key not available, skipping signature verification');
    }

    // Decrypt message
    let decryptedBuffer: ArrayBuffer;
    try {
      decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: ALGORITHM,
          iv,
          tagLength: AUTH_TAG_LENGTH,
        },
        keyMaterial.encryptionKey,
        encryptedBuffer
      );
    } catch (error) {
      console.error('❌ Chat E2EE: Decryption failed:', error);
      throw new Error('Failed to decrypt message - invalid key or corrupted data');
    }

    // Convert to plaintext
    const decoder = new TextDecoder();
    const content = decoder.decode(decryptedBuffer);

    return {
      content,
      timestamp: encryptedMessage.timestamp,
      keyGeneration: encryptedMessage.keyGeneration,
      senderFingerprint: encryptedMessage.senderFingerprint,
      isVerified,
    };
  }

  /**
   * Rotate conversation keys (for long conversations)
   */
  async rotateConversationKey(
    conversationId: string,
    newEncryptionKey: CryptoKey
  ): Promise<void> {
    const keyMaterial = this.conversationKeys.get(conversationId);
    if (!keyMaterial) {
      throw new Error(`Conversation ${conversationId} not initialized`);
    }

    keyMaterial.encryptionKey = newEncryptionKey;
    keyMaterial.generation++;
    keyMaterial.createdAt = Date.now();

    console.log(`🔄 Chat E2EE: Rotated keys for ${conversationId} (generation ${keyMaterial.generation})`);
  }

  /**
   * Get conversation key material
   */
  getConversationKeyMaterial(conversationId: string): ConversationKeyMaterial | null {
    return this.conversationKeys.get(conversationId) || null;
  }

  /**
   * Check if conversation is initialized
   */
  isConversationInitialized(conversationId: string): boolean {
    return this.conversationKeys.has(conversationId);
  }

  /**
   * Remove conversation keys (cleanup)
   */
  removeConversation(conversationId: string): void {
    this.conversationKeys.delete(conversationId);
    console.log(`🧹 Chat E2EE: Removed conversation ${conversationId}`);
  }

  /**
   * Cleanup all conversations
   */
  cleanup(): void {
    this.conversationKeys.clear();
    console.log('🧹 Chat E2EE: Cleanup complete');
  }

  // --- Utility Methods ---

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private arrayBufferToHex(buffer: ArrayBuffer): string {
    return Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
}

/**
 * Singleton instance for global access
 */
export const chatEncryptionManager = new E2EEChatManager();
