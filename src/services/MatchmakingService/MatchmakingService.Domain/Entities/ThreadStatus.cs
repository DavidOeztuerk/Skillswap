namespace MatchmakingService.Domain.Entities;

/// <summary>
/// Status constants for negotiation threads.
/// A thread is a collection of MatchRequests between two users for a skill.
/// </summary>
public static class ThreadStatus
{
    /// <summary>
    /// Thread has active negotiations (pending requests).
    /// </summary>
    public const string Active = "Active";

    /// <summary>
    /// One party accepted a request - agreement reached.
    /// </summary>
    public const string AgreementReached = "AgreementReached";

    /// <summary>
    /// Max requests reached (6) without agreement, or all rejected.
    /// </summary>
    public const string NoAgreement = "NoAgreement";

    /// <summary>
    /// Thread expired due to inactivity.
    /// </summary>
    public const string Expired = "Expired";
}
