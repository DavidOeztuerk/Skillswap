namespace MatchmakingService.Domain.Enums;

/// <summary>
/// Status of a Match (Phase 8 - converted from string constants)
/// </summary>
public enum MatchStatus
{
    /// <summary>
    /// Match is pending acceptance
    /// </summary>
    Pending,

    /// <summary>
    /// Match was accepted by both parties
    /// </summary>
    Accepted,

    /// <summary>
    /// Match was rejected by one party
    /// </summary>
    Rejected,

    /// <summary>
    /// Match expired without response
    /// </summary>
    Expired,

    /// <summary>
    /// Match sessions have been completed
    /// </summary>
    Completed,

    /// <summary>
    /// Match was dissolved (ended early)
    /// </summary>
    Dissolved
}

/// <summary>
/// Status of a MatchRequest (Phase 8 - converted from string constants)
/// </summary>
public enum MatchRequestStatus
{
    /// <summary>
    /// Request is pending response
    /// </summary>
    Pending,

    /// <summary>
    /// Request was accepted
    /// </summary>
    Accepted,

    /// <summary>
    /// Request was rejected
    /// </summary>
    Rejected,

    /// <summary>
    /// A counter offer was made
    /// </summary>
    CounterOffered,

    /// <summary>
    /// Request expired without response
    /// </summary>
    Expired
}

/// <summary>
/// Status of a Connection between users (Phase 8)
/// </summary>
public enum ConnectionStatus
{
    /// <summary>
    /// Connection request pending
    /// </summary>
    Pending,

    /// <summary>
    /// Connection is active
    /// </summary>
    Active,

    /// <summary>
    /// Connection is paused (temporary)
    /// </summary>
    Paused,

    /// <summary>
    /// Connection completed successfully
    /// </summary>
    Completed,

    /// <summary>
    /// Connection was dissolved/ended
    /// </summary>
    Dissolved
}
