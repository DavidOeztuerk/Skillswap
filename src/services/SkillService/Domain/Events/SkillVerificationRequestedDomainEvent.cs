using CQRS.Interfaces;

namespace SkillService.Domain.Events;

// ============================================================================
// SKILL VERIFICATION EVENTS
// ============================================================================

public record SkillVerificationRequestedDomainEvent(
    string SkillId,
    string UserId,
    string RequestReason,
    List<string> SupportingDocuments) : DomainEvent;
