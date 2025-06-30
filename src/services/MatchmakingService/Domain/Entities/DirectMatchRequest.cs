using System.ComponentModel.DataAnnotations;
using Infrastructure.Models;

namespace MatchmakingService.Domain.Entities;

// public class DirectMatchRequest : AuditableEntity
// {
// [Required]
// [MaxLength(450)]
// public string RequesterId { get; set; } = string.Empty;

// [Required]
// [MaxLength(450)]
// public string TargetUserId { get; set; } = string.Empty;

// [Required]
// [MaxLength(450)]
// public string SkillId { get; set; } = string.Empty;

// [Required]
// [MaxLength(500)]
// public string Message { get; set; } = string.Empty;

// public bool IsLearningMode { get; set; } = false;

// [MaxLength(50)]
// public string Status { get; set; } = "Pending"; // Pending, Accepted, Rejected, Expired

// [MaxLength(500)]
// public string? ResponseMessage { get; set; }

// public DateTime? RespondedAt { get; set; }
// public DateTime? ExpiresAt { get; set; }

// [MaxLength(100)]
// public string? SkillName { get; set; }

// // Helper properties
// public bool IsPending => Status == "Pending";
// public bool IsAccepted => Status == "Accepted";
// public bool IsRejected => Status == "Rejected";
// public bool IsExpired => Status == "Expired";

// public void Accept(string? responseMessage = null)
// {
//     Status = "Accepted";
//     ResponseMessage = responseMessage;
//     RespondedAt = DateTime.UtcNow;
//     UpdatedAt = DateTime.UtcNow;
// }

// public void Reject(string? responseMessage = null)
// {
//     Status = "Rejected";
//     ResponseMessage = responseMessage;
//     RespondedAt = DateTime.UtcNow;
//     UpdatedAt = DateTime.UtcNow;
// }

// public void Expire()
// {
//     Status = "Expired";
//     UpdatedAt = DateTime.UtcNow;
// }
// }