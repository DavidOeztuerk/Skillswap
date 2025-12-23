/**
 * Client-side encryption utilities - KORRIGIERTE VERSION
 */

const ENCRYPTION_ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits für GCM
const AUTH_TAG_LENGTH = 128;
const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16;

// Session Storage Keys
const SESSION_SALT_ID = 'crypto_session_salt';

/**
 * Mit explizitem ArrayBuffer cast für TypeScript strict mode
 */
async function deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  // Importiere Passwort als Key Material
  const keyMaterial = await crypto.subtle.importKey('raw', passwordBuffer, 'PBKDF2', false, [
    'deriveKey',
  ]);

  const saltBuffer = new Uint8Array(salt).buffer;

  // Derive AES Key mit PBKDF2
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ENCRYPTION_ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Verwendet Browser Fingerprint + Session Storage für Konsistenz
 */
async function getOrCreateSessionKey(): Promise<CryptoKey> {
  let saltBase64 = sessionStorage.getItem(SESSION_SALT_ID);
  let salt: Uint8Array;

  if (saltBase64) {
    salt = new Uint8Array(base64ToArrayBuffer(saltBase64));
  } else {
    // Generiere neues Salt
    salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    saltBase64 = arrayBufferToBase64(salt.buffer as ArrayBuffer);
    sessionStorage.setItem(SESSION_SALT_ID, saltBase64);
  }

  // Generiere Session-spezifisches "Passwort" aus stabilen Browser-Eigenschaften
  const fingerprint = await generateBrowserFingerprint();

  return deriveKeyFromPassword(fingerprint, salt);
}

/**
 * Sichere Browser Fingerprint Generation
 */
async function generateBrowserFingerprint(): Promise<string> {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width.toString(),
    screen.height.toString(),
    screen.colorDepth.toString(),
    new Date().getTimezoneOffset().toString(),
    navigator.hardwareConcurrency,
    // Hinzufügen von mehr Entropie
    performance.timeOrigin.toString(),
  ];

  const fingerprintString = components.join('|');

  // Hash für konsistente Länge
  const encoder = new TextEncoder();
  const data = encoder.encode(fingerprintString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  return arrayBufferToHex(hashBuffer);
}

/**
 * AES-256-GCM Verschlüsselung
 */
export async function encryptData(data: string): Promise<string> {
  if (!data) return '';

  try {
    const key = await getOrCreateSessionKey();
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    // Generiere zufälliges IV
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

    // Verschlüssele mit AES-GCM
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: ENCRYPTION_ALGORITHM,
        iv,
        tagLength: AUTH_TAG_LENGTH,
      },
      key,
      dataBuffer
    );

    // Kombiniere IV + Ciphertext
    const combined = new Uint8Array(IV_LENGTH + encryptedBuffer.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedBuffer), IV_LENGTH);

    // Version Prefix für zukünftige Kompatibilität
    return `v2:${arrayBufferToBase64(combined.buffer)}`;
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * AES-256-GCM Entschlüsselung
 */
export async function decryptData(encryptedData: string): Promise<string | null> {
  if (!encryptedData) return null;

  try {
    // Check version prefix
    if (encryptedData.startsWith('v2:')) {
      // Neue sichere Verschlüsselung
      const base64Data = encryptedData.slice(3);
      const combined = new Uint8Array(base64ToArrayBuffer(base64Data));

      // Extrahiere IV
      const iv = combined.slice(0, IV_LENGTH);
      const ciphertext = combined.slice(IV_LENGTH);

      const key = await getOrCreateSessionKey();

      // Entschlüssele
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: ENCRYPTION_ALGORITHM,
          iv,
          tagLength: AUTH_TAG_LENGTH,
        },
        key,
        ciphertext
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    }

    // Legacy fallback für alte XOR-verschlüsselte Daten
    // WARNUNG: Dies sollte nur für Migration verwendet werden!

    console.warn('⚠️ Attempting to decrypt legacy XOR data - consider re-encrypting');
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    return decryptLegacyData(encryptedData);
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
}

/**
 * Legacy XOR Decryption für Migration (nur lesen, nicht schreiben!)
 * @deprecated Nur für Migration alter Daten
 */
function decryptLegacyData(encryptedData: string): string | null {
  try {
    const decoded = atob(encryptedData);
    const parts = decoded.split('|');

    if (parts.length !== 2) {
      return encryptedData; // Assume unencrypted
    }

    const [checksum, encrypted] = parts;
    if (checksum !== encrypted.length.toString(36)) {
      return null;
    }

    // Legacy XOR
    const key = getLegacyKey();
    let result = '';
    for (let i = 0; i < encrypted.length; i++) {
      result += String.fromCharCode(encrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  } catch {
    return null;
  }
}

function getLegacyKey(): string {
  const fingerprint = [
    navigator.userAgent,
    `${screen.width}x${screen.height}`,
    navigator.language,
    new Date().getTimezoneOffset().toString(),
  ].join('|');

  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash &= hash;
  }

  return Math.abs(hash).toString(36).padStart(8, '0');
}

/**
 * Convert base64 special chars to URL-safe variants
 */
function toUrlSafeChar(char: string): string {
  if (char === '+') return '-';
  if (char === '/') return '_';
  return '';
}

/**
 * Generiert kryptographisch sicheren Random Token
 */
export function generateSecureToken(length = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  // eslint-disable-next-line unicorn/prefer-string-replace-all
  return arrayBufferToBase64(array.buffer).replace(/[+/=]/g, toUrlSafeChar);
}

/**
 * Sichere Hash-Funktion mit SHA-256
 */
export async function hashData(data: string): Promise<string> {
  if (!data) return '';

  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);

  return arrayBufferToHex(hashBuffer);
}

/**
 * HMAC für Message Authentication
 */
export async function createHMAC(data: string, keyString: string): Promise<string> {
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(keyString),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));

  return arrayBufferToHex(signature);
}

/**
 * Verifiziere HMAC
 */
export async function verifyHMAC(
  data: string,
  signature: string,
  keyString: string
): Promise<boolean> {
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(keyString),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const signatureBuffer = hexToArrayBuffer(signature);

  return crypto.subtle.verify('HMAC', key, signatureBuffer, encoder.encode(data));
}

/**
 * Sanitizes data to prevent XSS
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';

  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

/**
 * Validates if a string contains potentially dangerous content
 */
export function containsDangerousContent(input: string): boolean {
  if (!input) return false;

  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /data:.*base64/i,
    /vbscript:/i,
    /<svg.*onload/i,
    /<img.*onerror/i,
  ];

  return dangerousPatterns.some((pattern) => pattern.test(input));
}

/**
 * Constant-time comparison für Timing-Attack Prevention
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

// === Utility Functions ===

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function arrayBufferToHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function hexToArrayBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = Number.parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes.buffer;
}
