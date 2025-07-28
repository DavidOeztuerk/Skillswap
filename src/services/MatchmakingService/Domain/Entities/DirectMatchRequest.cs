// using System.ComponentModel.DataAnnotations;
// using Infrastructure.Models;

// namespace MatchmakingService.Domain.Entities;

// public class DirectMatchRequest : AuditableEntity
// {
//     [Required]
//     [MaxLength(450)]
//     public string RequesterId { get; set; } = string.Empty;

//     [Required]
//     [MaxLength(450)]
//     public string TargetUserId { get; set; } = string.Empty;

//     [Required]
//     [MaxLength(450)]
//     public string SkillId { get; set; } = string.Empty;

//     [Required]
//     [MaxLength(500)]
//     public string Message { get; set; } = string.Empty;

//     public bool IsLearningMode { get; set; } = false;

//     [MaxLength(50)]
//     public string Status { get; set; } = DirectMatchRequestStatus.Pending;

//     [MaxLength(500)]
//     public string? ResponseMessage { get; set; }

//     public DateTime? RespondedAt { get; set; }
//     public DateTime? ExpiresAt { get; set; }

//     [MaxLength(100)]
//     public string? SkillName { get; set; }

//     [MaxLength(100)]
//     public string? RequesterName { get; set; }

//     [MaxLength(100)]
//     public string? TargetUserName { get; set; }

//     // Helper properties
//     public bool IsPending => Status == DirectMatchRequestStatus.Pending;
//     public bool IsAccepted => Status == DirectMatchRequestStatus.Accepted;
//     public bool IsRejected => Status == DirectMatchRequestStatus.Rejected;
//     public bool IsExpired => Status == DirectMatchRequestStatus.Expired;

//     public void Accept(string? responseMessage = null)
//     {
//         Status = DirectMatchRequestStatus.Accepted;
//         ResponseMessage = responseMessage;
//         RespondedAt = DateTime.UtcNow;
//         UpdatedAt = DateTime.UtcNow;
//     }

//     public void Reject(string? responseMessage = null)
//     {
//         Status = DirectMatchRequestStatus.Rejected;
//         ResponseMessage = responseMessage;
//         RespondedAt = DateTime.UtcNow;
//         UpdatedAt = DateTime.UtcNow;
//     }

//     public void Expire()
//     {
//         Status = DirectMatchRequestStatus.Expired;
//         UpdatedAt = DateTime.UtcNow;
//     }
// }