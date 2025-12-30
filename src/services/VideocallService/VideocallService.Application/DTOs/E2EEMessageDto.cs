namespace VideocallService.Application.DTOs;

/// <summary>
/// E2EE Message Type - Unified types for all E2EE operations
/// </summary>
public enum E2EEMessageType
{
    /// <summary>
    /// Initial key exchange offer (contains ECDH public key)
    /// </summary>
    KeyOffer = 1,

    /// <summary>
    /// Key exchange answer (contains ECDH public key)
    /// </summary>
    KeyAnswer = 2,

    /// <summary>
    /// Key rotation (new key generation during session)
    /// </summary>
    KeyRotation = 3,

    /// <summary>
    /// Key confirmation (acknowledges key exchange completion)
    /// </summary>
    KeyConfirmation = 4,

    /// <summary>
    /// Key rejection (indicates key exchange failure)
    /// </summary>
    KeyRejection = 5
}

/// <summary>
/// DTO for E2EE messages - Single Source of Truth for all E2EE operations
///
/// SECURITY NOTES:
/// - Server NEVER sees decrypted content
/// - Server only validates metadata and routes encrypted payloads
/// - Payload is opaque to the server (encrypted JSON from client)
/// </summary>
public record E2EEMessageDto
{
    /// <summary>
    /// Message type for routing and rate limiting
    /// </summary>
    public required E2EEMessageType Type { get; init; }

    /// <summary>
    /// Target user ID for direct routing
    /// </summary>
    public required string TargetUserId { get; init; }

    /// <summary>
    /// Room ID for group routing fallback
    /// </summary>
    public required string RoomId { get; init; }

    /// <summary>
    /// Encrypted payload (opaque to server)
    /// Contains: publicKey, signature, timestamp, nonce
    /// Server validates size only, not content
    /// </summary>
    public required string EncryptedPayload { get; init; }

    /// <summary>
    /// Key fingerprint for audit logging (NOT the actual key!)
    /// First 16 chars of SHA-256 hash of public key
    /// </summary>
    public string? KeyFingerprint { get; init; }

    /// <summary>
    /// Key generation number for detecting stale keys
    /// </summary>
    public int? KeyGeneration { get; init; }

    /// <summary>
    /// Client timestamp for detecting replay attacks
    /// </summary>
    public DateTime? ClientTimestamp { get; init; }
}

/// <summary>
/// Response DTO for E2EE operations
/// </summary>
public record E2EEOperationResult
{
    public bool Success { get; init; }
    public string? ErrorCode { get; init; }
    public string? ErrorMessage { get; init; }

    public static E2EEOperationResult Ok() => new() { Success = true };

    public static E2EEOperationResult Fail(string errorCode, string message) => new()
    {
        Success = false,
        ErrorCode = errorCode,
        ErrorMessage = message
    };
}

/// <summary>
/// E2EE Error Codes
/// </summary>
public static class E2EEErrorCodes
{
    public const string RateLimitExceeded = "E2EE_RATE_LIMIT";
    public const string InvalidPayload = "E2EE_INVALID_PAYLOAD";
    public const string InvalidTarget = "E2EE_INVALID_TARGET";
    public const string InvalidRoom = "E2EE_INVALID_ROOM";
    public const string MessageTooLarge = "E2EE_MESSAGE_TOO_LARGE";
    public const string Unauthorized = "E2EE_UNAUTHORIZED";
    public const string TargetNotFound = "E2EE_TARGET_NOT_FOUND";
}
