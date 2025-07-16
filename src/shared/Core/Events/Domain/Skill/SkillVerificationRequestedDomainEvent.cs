using CQRS.Interfaces;

namespace Events.Domain.Skill;

// ============================================================================
// SKILL VERIFICATION EVENTS
// ============================================================================

public record SkillVerificationRequestedDomainEvent(
    string SkillId,
    string UserId,
    string RequestReason,
    List<string> SupportingDocuments) : DomainEvent;
