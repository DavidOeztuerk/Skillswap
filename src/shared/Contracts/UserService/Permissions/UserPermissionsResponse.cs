using System;
using System.Collections.Generic;

namespace Contracts.UserService.Permissions
{
    public class UserPermissionsResponse
    {
        public Guid UserId { get; set; }
        public List<string> Roles { get; set; } = new List<string>();
        public List<PermissionDto> Permissions { get; set; } = new List<PermissionDto>();
        public List<string> PermissionNames { get; set; } = new List<string>();
        public Dictionary<string, List<string>> PermissionsByCategory { get; set; } = new Dictionary<string, List<string>>();
        public DateTime CachedAt { get; set; }
        public int CacheExpirationMinutes { get; set; } = 15;
    }

    public class PermissionDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Resource { get; set; } = string.Empty;
        public bool IsSystemPermission { get; set; }
        public bool IsActive { get; set; }
        public DateTime? ExpiresAt { get; set; }
        public string? ResourceId { get; set; }
        public string Source { get; set; } = string.Empty; // "Direct" or "Role:{RoleName}"
    }

    public class RoleDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int Priority { get; set; }
        public bool IsSystemRole { get; set; }
        public bool IsActive { get; set; }
        public List<string> Permissions { get; set; } = new List<string>();
    }

    public class CheckPermissionRequest
    {
        public Guid UserId { get; set; }
        public string PermissionName { get; set; } = string.Empty;
        public string? ResourceId { get; set; }
    }

    public class CheckMultiplePermissionsRequest
    {
        public Guid UserId { get; set; }
        public List<string> PermissionNames { get; set; } = new List<string>();
        public bool RequireAll { get; set; } = false;
    }

    public class GrantPermissionRequest
    {
        public Guid UserId { get; set; }
        public string PermissionName { get; set; } = string.Empty;
        public Guid? GrantedBy { get; set; }
        public DateTime? ExpiresAt { get; set; }
        public string? ResourceId { get; set; }
        public string? Reason { get; set; }
    }

    public class RevokePermissionRequest
    {
        public Guid UserId { get; set; }
        public string PermissionName { get; set; } = string.Empty;
        public Guid? RevokedBy { get; set; }
        public string? Reason { get; set; }
    }

    public class AssignRoleRequest
    {
        public Guid UserId { get; set; }
        public string RoleName { get; set; } = string.Empty;
        public Guid? AssignedBy { get; set; }
        public string? Reason { get; set; }
    }

    public class RemoveRoleRequest
    {
        public Guid UserId { get; set; }
        public string RoleName { get; set; } = string.Empty;
        public Guid? RemovedBy { get; set; }
        public string? Reason { get; set; }
    }

    public class CreateRoleRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int Priority { get; set; } = 0;
        public Guid? ParentRoleId { get; set; }
        public List<string> InitialPermissions { get; set; } = new List<string>();
    }

    public class UpdateRoleRequest
    {
        public Guid RoleId { get; set; }
        public string? Description { get; set; }
        public int? Priority { get; set; }
        public Guid? ParentRoleId { get; set; }
    }

    public class SyncPermissionsRequest
    {
        public Guid UserId { get; set; }
        public List<string> PermissionNames { get; set; } = new List<string>();
    }

    public class ResourcePermissionRequest
    {
        public Guid UserId { get; set; }
        public string ResourceType { get; set; } = string.Empty;
        public string ResourceId { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public Guid? GrantedBy { get; set; }
        public DateTime? ExpiresAt { get; set; }
    }

    public class PermissionHistoryResponse
    {
        public List<PermissionHistoryEntry> Entries { get; set; } = new List<PermissionHistoryEntry>();
    }

    public class PermissionHistoryEntry
    {
        public Guid Id { get; set; }
        public string PermissionName { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty; // "Granted" or "Revoked"
        public DateTime Timestamp { get; set; }
        public string? PerformedBy { get; set; }
        public string? Reason { get; set; }
        public DateTime? ExpiresAt { get; set; }
        public string? ResourceId { get; set; }
    }
}