using System.ComponentModel.DataAnnotations;
using Infrastructure.Models;

namespace UserService.Domain.Models;

public class BlockedUser : AuditableEntity
{
    [Required]
    public string? UserId { get; set; } = string.Empty;
    
    public string? Reason { get; set; }
    
    public DateTime BlockedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public virtual User User { get; set; } = null!;
}
