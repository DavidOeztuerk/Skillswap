/**
 * Safari Storage Manager
 *
 * Handles key storage with automatic fallback for Safari Private Mode.
 * Safari Private Mode doesn't support IndexedDB, so we fall back to memory storage.
 *
 * Features:
 * - IndexedDB storage for normal mode
 * - Memory storage fallback for Private Mode
 * - Automatic detection of storage availability
 * - Secure key serialization (JWK format)
 */

import { isPrivateBrowsing } from '../../detection';

// ============================================================================
// Types
// ============================================================================

/** Stored key entry */
interface StoredKeyEntry {
  readonly id: string;
  readonly type: 'ecdh' | 'ecdsa' | 'aes';
  readonly publicKeyJwk?: JsonWebKey;
  readonly privateKeyJwk?: JsonWebKey;
  readonly keyJwk?: JsonWebKey;
  readonly fingerprint?: string;
  readonly createdAt: number;
  readonly expiresAt?: number;
}

/** Storage backend interface */
interface StorageBackend {
  get(id: string): Promise<StoredKeyEntry | null>;
  set(entry: StoredKeyEntry): Promise<void>;
  delete(id: string): Promise<void>;
  clear(): Promise<void>;
  getAllIds(): Promise<string[]>;
}

// ============================================================================
// Memory Storage Backend
// ============================================================================

/**
 * In-Memory storage backend for Safari Private Mode
 * Keys are lost when page is closed
 */
class MemoryStorageBackend implements StorageBackend {
  private readonly store = new Map<string, StoredKeyEntry>();

  get(id: string): Promise<StoredKeyEntry | null> {
    return Promise.resolve(this.store.get(id) ?? null);
  }

  set(entry: StoredKeyEntry): Promise<void> {
    this.store.set(entry.id, entry);
    return Promise.resolve();
  }

  delete(id: string): Promise<void> {
    this.store.delete(id);
    return Promise.resolve();
  }

  clear(): Promise<void> {
    this.store.clear();
    return Promise.resolve();
  }

  getAllIds(): Promise<string[]> {
    return Promise.resolve([...this.store.keys()]);
  }
}

// ============================================================================
// IndexedDB Storage Backend
// ============================================================================

const DB_NAME = 'skillswap_e2ee_keys';
const DB_VERSION = 1;
const STORE_NAME = 'keys';

/**
 * IndexedDB storage backend for persistent key storage
 */
class IndexedDBStorageBackend implements StorageBackend {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  private async init(): Promise<void> {
    if (this.db !== null) return;

    if (this.initPromise !== null) {
      await this.initPromise;
      return;
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.addEventListener('error', () => {
        reject(new Error('Failed to open IndexedDB'));
      });

      request.addEventListener('success', () => {
        this.db = request.result;
        resolve();
      });

      request.addEventListener('upgradeneeded', (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      });
    });

    await this.initPromise;
  }

  async get(id: string): Promise<StoredKeyEntry | null> {
    await this.init();
    const { db } = this;
    if (db === null) return null;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.addEventListener('error', () => {
        reject(new Error(request.error?.message ?? 'IndexedDB get failed'));
      });
      request.addEventListener('success', () => {
        resolve((request.result as StoredKeyEntry | undefined) ?? null);
      });
    });
  }

  async set(entry: StoredKeyEntry): Promise<void> {
    await this.init();
    const { db } = this;
    if (db === null) return;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(entry);

      request.addEventListener('error', () => {
        reject(new Error(request.error?.message ?? 'IndexedDB set failed'));
      });
      request.addEventListener('success', () => {
        resolve();
      });
    });
  }

  async delete(id: string): Promise<void> {
    await this.init();
    const { db } = this;
    if (db === null) return;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.addEventListener('error', () => {
        reject(new Error(request.error?.message ?? 'IndexedDB delete failed'));
      });
      request.addEventListener('success', () => {
        resolve();
      });
    });
  }

  async clear(): Promise<void> {
    await this.init();
    const { db } = this;
    if (db === null) return;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.addEventListener('error', () => {
        reject(new Error(request.error?.message ?? 'IndexedDB clear failed'));
      });
      request.addEventListener('success', () => {
        resolve();
      });
    });
  }

  async getAllIds(): Promise<string[]> {
    await this.init();
    const { db } = this;
    if (db === null) return [];

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAllKeys();

      request.addEventListener('error', () => {
        reject(new Error(request.error?.message ?? 'IndexedDB getAllKeys failed'));
      });
      request.addEventListener('success', () => {
        resolve(request.result as string[]);
      });
    });
  }

  close(): void {
    if (this.db !== null) {
      this.db.close();
      this.db = null;
    }
  }
}

// ============================================================================
// Safari Storage Manager
// ============================================================================

/**
 * Safari Storage Manager - Singleton
 *
 * Automatically selects the appropriate storage backend:
 * - IndexedDB for normal browsing
 * - Memory storage for Safari Private Mode
 */
export class SafariStorageManager {
  private backend: StorageBackend | null = null;
  private isPrivateMode = false;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize the storage manager
   * Automatically detects Private Mode and selects appropriate backend
   */
  async initialize(): Promise<void> {
    if (this.backend) return;

    if (this.initPromise) {
      await this.initPromise;
      return;
    }

    this.initPromise = this.doInitialize();
    await this.initPromise;
  }

  private async doInitialize(): Promise<void> {
    // Check for Private Browsing Mode
    this.isPrivateMode = await isPrivateBrowsing();

    if (this.isPrivateMode) {
      console.warn(
        '[SafariStorageManager] Private browsing detected - using memory storage. Keys will be lost when browser closes.'
      );
      this.backend = new MemoryStorageBackend();
      return;
    }

    // Try IndexedDB first
    try {
      const idbBackend = new IndexedDBStorageBackend();
      // Test if IndexedDB works
      await idbBackend.getAllIds();
      this.backend = idbBackend;
      console.debug('[SafariStorageManager] Using IndexedDB storage');
    } catch (error) {
      console.warn(
        '[SafariStorageManager] IndexedDB failed, falling back to memory storage:',
        error
      );
      this.backend = new MemoryStorageBackend();
    }
  }

  /**
   * Store an ECDH key pair
   */
  async storeECDHKeyPair(
    id: string,
    publicKeyJwk: JsonWebKey,
    privateKeyJwk: JsonWebKey,
    fingerprint: string
  ): Promise<void> {
    await this.initialize();
    if (!this.backend) throw new Error('Storage not initialized');

    await this.backend.set({
      id,
      type: 'ecdh',
      publicKeyJwk,
      privateKeyJwk,
      fingerprint,
      createdAt: Date.now(),
    });
  }

  /**
   * Store an ECDSA key pair
   */
  async storeECDSAKeyPair(
    id: string,
    publicKeyJwk: JsonWebKey,
    privateKeyJwk: JsonWebKey,
    fingerprint: string
  ): Promise<void> {
    await this.initialize();
    if (!this.backend) throw new Error('Storage not initialized');

    await this.backend.set({
      id,
      type: 'ecdsa',
      publicKeyJwk,
      privateKeyJwk,
      fingerprint,
      createdAt: Date.now(),
    });
  }

  /**
   * Store an AES key
   */
  async storeAESKey(id: string, keyJwk: JsonWebKey, expiresAt?: number): Promise<void> {
    await this.initialize();
    if (!this.backend) throw new Error('Storage not initialized');

    await this.backend.set({
      id,
      type: 'aes',
      keyJwk,
      createdAt: Date.now(),
      expiresAt,
    });
  }

  /**
   * Retrieve a stored key entry
   */
  async getKey(id: string): Promise<StoredKeyEntry | null> {
    await this.initialize();
    if (!this.backend) return null;

    const entry = await this.backend.get(id);

    // Check expiration
    if (entry?.expiresAt !== undefined && entry.expiresAt < Date.now()) {
      await this.backend.delete(id);
      return null;
    }

    return entry;
  }

  /**
   * Delete a stored key
   */
  async deleteKey(id: string): Promise<void> {
    await this.initialize();
    if (!this.backend) return;

    await this.backend.delete(id);
  }

  /**
   * Clear all stored keys
   */
  async clearAll(): Promise<void> {
    await this.initialize();
    if (!this.backend) return;

    await this.backend.clear();
  }

  /**
   * Get all stored key IDs
   */
  async getAllKeyIds(): Promise<string[]> {
    await this.initialize();
    if (!this.backend) return [];

    return this.backend.getAllIds();
  }

  /**
   * Clean up expired keys
   */
  async cleanupExpired(): Promise<number> {
    await this.initialize();
    if (!this.backend) return 0;

    const ids = await this.backend.getAllIds();
    let cleaned = 0;

    for (const id of ids) {
      // eslint-disable-next-line no-await-in-loop -- Sequential cleanup is intentional
      const entry = await this.backend.get(id);
      if (entry?.expiresAt !== undefined && entry.expiresAt < Date.now()) {
        // eslint-disable-next-line no-await-in-loop -- Sequential cleanup is intentional
        await this.backend.delete(id);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Check if using memory storage (Private Mode)
   */
  get usingMemoryStorage(): boolean {
    return this.isPrivateMode;
  }

  /**
   * Get storage type description
   */
  getStorageType(): string {
    if (!this.backend) return 'Not initialized';
    if (this.isPrivateMode) return 'Memory (Private Mode)';
    return 'IndexedDB';
  }
}

// ============================================================================
// Singleton Access
// ============================================================================

let storageInstance: SafariStorageManager | null = null;

/**
 * Get the Safari Storage Manager singleton instance
 */
export function getSafariStorage(): SafariStorageManager {
  storageInstance ??= new SafariStorageManager();
  return storageInstance;
}

/**
 * Initialize the Safari Storage Manager
 */
export async function initializeSafariStorage(): Promise<SafariStorageManager> {
  const storage = getSafariStorage();
  await storage.initialize();
  return storage;
}

/**
 * Reset for tests
 */
export function resetSafariStorage(): void {
  storageInstance = null;
}
