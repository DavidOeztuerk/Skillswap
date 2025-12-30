# WebRTC & E2EE Infrastructure Refactoring - MASTERPLAN

**Erstellt:** 2025-12-23
**Status:** Geplant
**Quellen:** Zwei Claude-Konversationen (Frontend-Architektur + Backend-Sicherheit)

---

## Zusammenfassung

Dieses Dokument kombiniert zwei separate Analyse-Konversationen:
1. **kon1.md** - Frontend-Architektur Bewertung + Backend-Sicherheitskritik (VideoCallHub)
2. **kon2.md** - Detaillierte technische Implementierung für E2EE-Refactoring

**Ziel:** Clean Architecture, Code-Deduplizierung, strikte Typisierung, Safari-Kompatibilität, verbesserte Sicherheit

---

## Kritische Erkenntnisse

### Stärken der aktuellen Implementierung
- Browserübergreifende E2EE-Unterstützung (encodedStreams, rtpTransform, scriptTransform)
- ECDH + ECDSA für Key Exchange mit Signaturverifikation
- Safari-spezifische Fixes (Camera Release, beforeunload)
- Event-basierte Architektur mit StreamManager

### Kritische Sicherheitsprobleme (VideoCallHub)
| Problem | Risiko | Priorität |
|---------|--------|-----------|
| MITM-Angriffsmöglichkeit (Keys über SignalR) | 🔴 Hoch | P0 |
| Keine Out-of-Band-Verifikation | 🔴 Hoch | P1 |
| Single Point of Failure (Hub verwaltet Keys) | 🟠 Mittel | P2 |
| Einfaches Rate-Limiting (Zähler statt Sliding Window) | 🟠 Mittel | P2 |

### Technische Schulden (Frontend)
- Code-Duplizierung: `arrayBufferToBase64` in 6+ Dateien
- E2EE-Detection in 4 Dateien unterschiedlich implementiert
- `any` Types statt `unknown` mit Type Guards
- Safari AES-GCM tagLength Bug nicht konsistent behandelt

---

## PHASE 1: Verzeichnisstruktur & Core Crypto Module

### 1.1 Verzeichnisstruktur erstellen

```
src/
├── shared/
│   ├── core/
│   │   ├── crypto/
│   │   │   ├── encoding.ts           # Base64, Hex, ArrayBuffer Conversions
│   │   │   ├── aes-gcm.ts            # AES-256-GCM Wrapper (Safari-kompatibel!)
│   │   │   ├── ecdh.ts               # ECDH Key Exchange
│   │   │   ├── ecdsa.ts              # ECDSA Signing/Verification
│   │   │   ├── constants.ts          # Crypto Constants
│   │   │   ├── types.ts              # Crypto Type Definitions
│   │   │   └── index.ts              # Re-exports
│   │   │
│   │   ├── errors/
│   │   │   ├── ApiError.ts
│   │   │   ├── NetworkError.ts
│   │   │   ├── E2EEError.ts
│   │   │   ├── WebRTCError.ts
│   │   │   └── index.ts
│   │   │
│   │   └── types/
│   │       ├── branded.ts            # Branded Types (UserId, RoomId, etc.)
│   │       └── index.ts
│   │
│   ├── detection/
│   │   ├── BrowserDetector.ts        # Browser Info Detection
│   │   ├── E2EECapabilities.ts       # E2EE Feature Detection
│   │   ├── MediaCapabilities.ts      # Audio/Video/Codec Detection
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   └── services/
│       ├── e2ee/
│       │   ├── E2EEManager.ts        # Unified E2EE Orchestrator
│       │   ├── KeyExchangeService.ts # SignalR Key Exchange
│       │   ├── InsertableStreamsService.ts
│       │   ├── types.ts
│       │   └── index.ts
│       │
│       └── webrtc/
│           ├── WebRTCConfigBuilder.ts
│           ├── ICEServerProvider.ts
│           └── index.ts
│
├── workers/
│   └── e2ee/
│       ├── shared/
│       │   ├── crypto-operations.ts  # Shared Encrypt/Decrypt Logic
│       │   ├── message-types.ts      # Worker Message Types
│       │   └── index.ts
│       │
│       ├── chrome-e2ee-worker.ts     # Chrome/Edge/Firefox Worker
│       ├── safari-e2ee-worker.ts     # Safari RTCRtpScriptTransform Worker
│       └── worker-types.d.ts         # Global Worker Type Declarations
│
└── features/
    └── videocall/
        ├── components/
        │   └── E2EEStatusIndicator.tsx
        ├── context/
        │   └── StreamContext.tsx
        ├── hooks/
        │   ├── useSignalRHub.ts      # Typisierter SignalR Hook
        │   └── useVideoCallActions.ts
        ├── store/
        │   └── videoCallSlice.ts
        ├── types/
        │   └── E2EEHubTypes.ts       # SignalR Event Types
        └── index.ts
```

### 1.2 Core Crypto Constants

**Datei:** `src/shared/core/crypto/constants.ts`

```typescript
/** AES-GCM Algorithmus Name */
export const AES_GCM_ALGORITHM = 'AES-GCM' as const;
export const AES_KEY_LENGTH = 256 as const;
export const IV_LENGTH = 12 as const;
export const AUTH_TAG_LENGTH = 128 as const;
export const MIN_ENCRYPTED_FRAME_SIZE = IV_LENGTH + 16 + 1 as const;
export const ECDH_CURVE = 'P-256' as const;
export const ECDSA_ALGORITHM = 'ECDSA' as const;
export const ECDSA_HASH = 'SHA-256' as const;
export const KEY_ROTATION_INTERVAL_MS = 60_000 as const;
export const KEY_EXCHANGE_TIMEOUT_MS = 15_000 as const;
export const MAX_KEY_EXCHANGE_RETRIES = 5 as const;
export const NONCE_MAX_AGE_MS = 5 * 60 * 1000 as const;
```

### 1.3 Branded Types

**Datei:** `src/shared/core/crypto/types.ts`

```typescript
/** Branded type für Base64 encoded strings */
export type Base64String = string & { readonly __brand: 'Base64' };
export type HexString = string & { readonly __brand: 'Hex' };
export type KeyFingerprint = HexString & { readonly __brand: 'KeyFingerprint' };
export type KeyGeneration = number & { readonly __brand: 'KeyGeneration' };
export type E2EEMethod = 'encodedStreams' | 'rtpTransform' | 'scriptTransform' | 'none';

/** Browser-specific AES-GCM Configuration */
export interface AesGcmConfig {
  /** Whether to include tagLength (Safari doesn't support it!) */
  readonly includeTagLength: boolean;
}
```

---

## PHASE 2: Safari-kompatible AES-GCM Implementierung

### KRITISCH: Safari tagLength Bug

| Aspekt | Chrome/Edge/Firefox | Safari 15.4+ |
|--------|---------------------|--------------|
| API | `createEncodedStreams()` / `RTCRtpSender.transform` | `RTCRtpScriptTransform` |
| Worker Pattern | Message-basiert (`onmessage`) | Event-basiert (`onrtctransform`) |
| AES-GCM tagLength | Explizit `{ tagLength: 128 }` | **NICHT erlaubt! Wirft Error** |
| Key Timing | Flexibel | **KRITISCH** - Key muss VOR Transform im Worker sein |

### 2.1 AES-GCM Wrapper

**Datei:** `src/shared/core/crypto/aes-gcm.ts`

```typescript
function createAesGcmParams(iv: Uint8Array, config: AesGcmConfig): AesGcmParams {
  const params: AesGcmParams = {
    name: AES_GCM_ALGORITHM,
    iv,
  };

  // KRITISCH: Safari wirft Error wenn tagLength angegeben wird!
  if (config.includeTagLength) {
    params.tagLength = AUTH_TAG_LENGTH;
  }

  return params;
}

export const SAFARI_CONFIG: AesGcmConfig = { includeTagLength: false };
export const CHROME_CONFIG: AesGcmConfig = { includeTagLength: true };
```

---

## PHASE 3: E2EE Worker Implementierung

### 3.1 Worker Message Types

**Datei:** `src/workers/e2ee/shared/message-types.ts`

```typescript
// Inbound Messages (Main Thread -> Worker)
export type WorkerInboundMessage =
  | WorkerInitMessage
  | WorkerUpdateKeyMessage
  | WorkerEncryptMessage
  | WorkerDecryptMessage
  | WorkerCleanupMessage
  | WorkerEnableEncryptionMessage
  | WorkerDisableEncryptionMessage
  | WorkerGetStatsMessage;

// Outbound Messages (Worker -> Main Thread)
export type WorkerOutboundMessage =
  | WorkerReadyMessage
  | WorkerKeyUpdatedMessage
  | WorkerEncryptSuccessMessage
  | WorkerDecryptSuccessMessage
  | WorkerErrorMessage
  | WorkerCleanupCompleteMessage
  | WorkerStatsMessage;
```

### 3.2 Chrome/Firefox Worker

**Datei:** `src/workers/e2ee/chrome-e2ee-worker.ts`
- Message-basierte Frame-Verarbeitung via `postMessage`
- MIT `tagLength` Parameter

### 3.3 Safari Worker

**Datei:** `src/workers/e2ee/safari-e2ee-worker.ts`
- Event-basierte Frame-Verarbeitung via `onrtctransform`
- OHNE `tagLength` Parameter
- Key muss VOR `RTCRtpScriptTransform` gesetzt sein!

```typescript
(
  self as unknown as WorkerGlobalScope & {
    onrtctransform?: (event: RTCTransformEvent) => void;
  }
).onrtctransform = (event: RTCTransformEvent): void => {
  // Stream-basierte Verarbeitung
};
```

---

## PHASE 4: Browser Detection (Single Source of Truth)

### 4.1 E2EE Capabilities Detection

**Datei:** `src/shared/detection/E2EECapabilities.ts`

```typescript
function detectE2EECapabilities(): E2EECapabilities {
  const supportsRtpScriptTransform = typeof RTCRtpScriptTransform !== 'undefined';
  const supportsEncodedStreams = 'createEncodedStreams' in RTCRtpSender.prototype;
  const supportsRtpTransform = 'transform' in RTCRtpSender.prototype;

  let method: E2EEMethod = 'none';

  // 1. Safari mit RTCRtpScriptTransform
  if (isSafari() && supportsRtpScriptTransform) {
    method = 'scriptTransform';
  }
  // 2. Chrome/Edge: encodedStreams BEVORZUGEN
  else if (isChrome() && supportsEncodedStreams) {
    method = 'encodedStreams';
  }
  // 3. Firefox: rtpTransform
  else if (isFirefox() && supportsRtpTransform) {
    method = 'rtpTransform';
  }

  return { supported: method !== 'none', method, ... };
}
```

---

## PHASE 5: Backend VideoCallHub Verbesserungen

### 5.1 Verbesserte Key Exchange Nachrichten

**Backend:** `VideocallService/Application/DTOs/EncryptedMessageDto.cs`

```csharp
public record EncryptedMessageDto
{
    public required string Type { get; init; }  // keyOffer, keyAnswer, keyRotation
    public required string EncryptedData { get; init; }
    public required long Timestamp { get; init; }
    public required string Version { get; init; }
    public required string Nonce { get; init; }  // Für Replay-Schutz
}

public enum E2EEMessageType
{
    KeyOffer,
    KeyAnswer,
    KeyRotation,
    EncryptedMessage
}
```

### 5.2 Sliding Window Rate Limiting

**Backend:** `VideoCallHub.cs`

```csharp
private async Task<bool> CheckEnhancedRateLimitAsync(string userId, string action)
{
    var db = _redis.GetDatabase();
    var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
    var key = $"ratelimit:{userId}:{action}";

    // Alte Einträge entfernen (letzte 60 Sekunden)
    await db.SortedSetRemoveRangeByScoreAsync(key, 0, now - 60);

    // Aktuellen Request hinzufügen
    await db.SortedSetAddAsync(key, now.ToString(), now);

    // Anzahl der Requests in letzter Minute
    var count = await db.SortedSetLengthAsync(key);

    await db.KeyExpireAsync(key, TimeSpan.FromSeconds(120));

    return count <= 10; // 10 requests/minute
}
```

### 5.3 E2EE Audit Log

**Backend:** `VideocallService/Domain/Entities/E2EEAuditLog.cs`

```csharp
public class E2EEAuditLog : BaseEntity
{
    public string RoomId { get; private set; }
    public string UserId { get; private set; }
    public E2EEMessageType MessageType { get; private set; }
    public string TargetUserId { get; private set; }
    public DateTime Timestamp { get; private set; }
    public string? PublicKeyFingerprint { get; private set; }  // Nur Fingerprint, NICHT der Key!
}
```

### 5.4 Refactored VideoCallHub Methods

```csharp
// ALT: Separate Methoden für jeden Key-Typ
public async Task SendKeyOffer(...) { }
public async Task SendKeyAnswer(...) { }
public async Task SendKeyRotation(...) { }

// NEU: Unified ForwardE2EEMessage
public async Task ForwardE2EEMessage(
    string roomId,
    string targetUserId,
    EncryptedMessageDto message)
{
    // 1. Rate Limiting prüfen
    if (!await CheckEnhancedRateLimitAsync(GetUserId(), "e2ee"))
        throw new HubException("Rate limit exceeded");

    // 2. Validiere verschlüsseltes Format
    if (!IsValidEncryptedData(message.EncryptedData))
        throw new HubException("Invalid encrypted data format");

    // 3. Audit Log (NUR Metadaten, nie Key-Inhalt!)
    await _auditService.LogE2EEEvent(roomId, GetUserId(), message.Type, targetUserId);

    // 4. Weiterleiten
    await Clients.Client(targetConnectionId).SendAsync("ReceiveE2EEMessage", message);
}
```

---

## PHASE 6: Frontend SignalR Integration (Typisiert)

### 6.1 Hub Event Types

**Datei:** `src/features/videocall/types/E2EEHubTypes.ts`

```typescript
export interface ServerToClientEvents {
    ReceiveOffer: (fromUserId: string, offer: RTCSessionDescriptionInit) => void;
    ReceiveAnswer: (fromUserId: string, answer: RTCSessionDescriptionInit) => void;
    ReceiveIceCandidate: (fromUserId: string, candidate: RTCIceCandidateInit) => void;
    ReceiveE2EEMessage: (message: EncryptedMessageDto) => void;
    UserJoined: (data: { userId: string; timestamp: string }) => void;
    UserLeft: (data: { userId: string; timestamp: string }) => void;
    CameraToggled: (data: { userId: string; enabled: boolean }) => void;
    MicrophoneToggled: (data: { userId: string; enabled: boolean }) => void;
    ChatMessage: (data: ChatMessagePayload) => void;
    HeartbeatAck: (data: { timestamp: string; acknowledged: boolean }) => void;
}

export interface ClientToServerEvents {
    SendOffer: (roomId: string, targetUserId: string, sdp: string) => Promise<void>;
    SendAnswer: (roomId: string, targetUserId: string, sdp: string) => Promise<void>;
    SendIceCandidate: (roomId: string, targetUserId: string, candidate: string) => Promise<void>;
    ForwardE2EEMessage: (roomId: string, targetUserId: string, message: EncryptedMessageDto) => Promise<void>;
    SendHeartbeat: (roomId: string) => Promise<void>;
    ToggleCamera: (roomId: string, enabled: boolean) => Promise<void>;
    ToggleMicrophone: (roomId: string, enabled: boolean) => Promise<void>;
}
```

### 6.2 Typisierter SignalR Hook

**Datei:** `src/features/videocall/hooks/useSignalRHub.ts`

```typescript
export const useSignalRHub = (): SignalRHub => {
    const connection = useRef<HubConnection>();

    const connect = useCallback(async (accessToken: string, roomId: string) => {
        connection.current = new HubConnectionBuilder()
            .withUrl(`/videocallhub?roomId=${roomId}`, {
                accessTokenFactory: () => accessToken
            })
            .withAutomaticReconnect({
                nextRetryDelayInMilliseconds: retryContext => {
                    return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
                }
            })
            .configureLogging(LogLevel.Warning)
            .build();

        // Typisierte Event-Handler
        connection.current.on("ReceiveE2EEMessage", handleReceiveE2EEMessage);
        // ...

        await connection.current.start();
    }, []);

    return { connect, sendOffer, forwardE2EEMessage, /* ... */ };
};
```

---

## PHASE 7: Error Handling & Recovery

### 7.1 VideoCallError Klasse

**Datei:** `src/shared/core/errors/WebRTCError.ts`

```typescript
export type WebRTCErrorCode =
  | 'PERMISSION_DENIED'
  | 'DEVICE_NOT_FOUND'
  | 'CONSTRAINT_NOT_SATISFIED'
  | 'ICE_CONNECTION_FAILED'
  | 'SIGNALING_ERROR'
  | 'E2EE_KEY_EXCHANGE_FAILED'
  | 'E2EE_ENCRYPTION_FAILED'
  | 'E2EE_DECRYPTION_FAILED';

export class WebRTCError extends Error {
    constructor(
        message: string,
        public readonly code: WebRTCErrorCode,
        public readonly recoverable: boolean = false,
        public readonly context?: Record<string, unknown>
    ) {
        super(message);
        this.name = 'WebRTCError';
    }
}

export function handleWebRTCError(error: unknown): WebRTCError {
    if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
            return new WebRTCError(
                'Camera/microphone access denied',
                'PERMISSION_DENIED',
                true
            );
        }
        if (error.name === 'NotFoundError') {
            return new WebRTCError(
                'No camera/microphone found',
                'DEVICE_NOT_FOUND',
                false
            );
        }
    }
    return new WebRTCError('Unknown WebRTC error', 'SIGNALING_ERROR', false);
}
```

---

## PHASE 8: UI Components

### 8.1 E2EE Status Indicator

**Datei:** `src/features/videocall/components/E2EEStatusIndicator.tsx`

```typescript
interface E2EEStatusIndicatorProps {
    status: 'negotiating' | 'active' | 'failed' | 'none';
    participantFingerprints?: Map<string, KeyFingerprint>;
    onVerifyClick?: (userId: string) => void;
}

export const E2EEStatusIndicator: React.FC<E2EEStatusIndicatorProps> = ({
    status,
    participantFingerprints,
    onVerifyClick
}) => {
    // Shield Icon mit Status-Farbe
    // Tooltip mit Fingerprints für manuelle Verifikation
    // Click öffnet Verification Modal
};
```

---

## PHASE 9: Zukünftige Verbesserungen (Optional)

### 9.1 Out-of-Band Key Verification

```typescript
class KeyVerificationService {
    async generateVerificationQR(): Promise<string> {
        const payload = {
            publicKey: await this.exportPublicKey(),
            roomId: this.roomId,
            nonce: crypto.randomBytes(16),
            signature: await this.signWithIdentityKey()
        };
        return QRCode.toDataURL(JSON.stringify(payload));
    }

    async verifyViaShortCode(remoteQRData: string): Promise<boolean> {
        // 12-stelliger Code: "123-456-789"
        // User vergleicht mit anderem Client
    }
}
```

### 9.2 Double Ratchet Protocol (Signal-Protokoll)

- X3DH für initialen Schlüsselaustausch
- Double Ratchet für Forward Secrecy pro Nachricht
- Post-Compromise Security

### 9.3 MLS (Messaging Layer Security) für Gruppen

- IETF Standard für Gruppen-E2EE
- Baum-basierte Key-Derivation
- Effiziente Gruppenupdates

---

## Migrations-Checkliste

### Zu löschende/refaktorierte Dateien

- [ ] `cryptoHelpers.ts` → `@/shared/core/crypto`
- [ ] `e2eeBrowserSupport.ts` → `@/shared/detection`
- [ ] `e2eeVideoEncryption.ts` → `@/shared/services/e2ee`
- [ ] `e2eeChatEncryption.ts` → `@/shared/services/e2ee`
- [ ] Duplicate `arrayBufferToBase64` Funktionen (6+ Dateien)
- [ ] Duplicate E2EE Detection Code (4 Dateien)

### Import-Änderungen

```typescript
// ALT (dupliziert)
function arrayBufferToBase64(buffer: ArrayBuffer): string { ... }

// NEU
import { arrayBufferToBase64 } from '@/shared/core/crypto';
```

```typescript
// ALT (inkonsistent)
function detectE2EEMethod() { ... }

// NEU - Single Source of Truth
import { getE2EEMethod, requiresSafariWorker } from '@/shared/detection';
```

---

## Test-Matrix

| Browser | E2EE Method | Worker | Status |
|---------|-------------|--------|--------|
| Chrome 100+ | encodedStreams | chrome-e2ee-worker | ⬜ Testen |
| Edge 100+ | encodedStreams | chrome-e2ee-worker | ⬜ Testen |
| Firefox 100+ | rtpTransform | chrome-e2ee-worker | ⬜ Testen |
| Safari 15.4+ | scriptTransform | safari-e2ee-worker | ⬜ Testen |
| Safari iOS 15.4+ | scriptTransform | safari-e2ee-worker | ⬜ Testen |

### Cross-Browser Tests

- [ ] Chrome ↔ Chrome E2EE
- [ ] Chrome ↔ Firefox E2EE
- [ ] Chrome ↔ Safari E2EE
- [ ] Firefox ↔ Safari E2EE
- [ ] Key Rotation während Call
- [ ] Reconnection mit E2EE
- [ ] 3+ Teilnehmer E2EE

---

## Implementierungs-Reihenfolge

### Sprint 1: Foundation
1. ⬜ Verzeichnisstruktur erstellen
2. ⬜ Core Crypto Module (constants, types, encoding)
3. ⬜ AES-GCM mit Safari-Kompatibilität
4. ⬜ ECDH & ECDSA Module

### Sprint 2: Workers
5. ⬜ Worker Message Types
6. ⬜ Chrome/Firefox Worker
7. ⬜ Safari Worker (RTCRtpScriptTransform)
8. ⬜ Browser Detection (Single Source of Truth)

### Sprint 3: Backend
9. ⬜ EncryptedMessageDto + E2EEMessageType
10. ⬜ VideoCallHub: ForwardE2EEMessage refactoring
11. ⬜ Sliding Window Rate Limiting
12. ⬜ E2EEAuditLog Entity + DbContext

### Sprint 4: Frontend Integration
13. ⬜ E2EEHubTypes.ts
14. ⬜ useSignalRHub Hook (typisiert)
15. ⬜ Error Handling (WebRTCError)
16. ⬜ E2EEStatusIndicator.tsx

### Sprint 5: Testing & Migration
17. ⬜ Unit Tests für Crypto Module
18. ⬜ Cross-Browser E2EE Tests
19. ⬜ Alte Dateien löschen/refaktorieren
20. ⬜ Documentation Update

---

## Qualitätsanforderungen

- ✅ TypeScript strict mode
- ✅ Niemals `any` - immer `unknown` mit Type Guards
- ✅ Alle öffentlichen Funktionen mit JSDoc
- ✅ Alle Interfaces exportiert
- ✅ Safari AES-GCM tagLength Bug behandelt
- ✅ Safari Worker Key-First Pattern
- ✅ Branded Types für Base64, Hex, Fingerprints
