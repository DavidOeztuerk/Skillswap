using System.Text;
using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;
using UserService.Application.Commands;
using UserService.Domain.Repositories;

namespace UserService.Application.Queries.Handlers;

public class ExportUsersQueryHandler(
    IUserRepository context,
    ILogger<ExportUsersQueryHandler> logger)
    : BaseQueryHandler<ExportUsersQuery, ExportResult>(logger)
{
    private readonly IUserRepository _context = context;

    public override async Task<ApiResponse<ExportResult>> Handle(
        ExportUsersQuery request,
        CancellationToken cancellationToken)
    {
        await Task.CompletedTask;

        try
        {
            Logger.LogInformation("Exporting users with filters: Status={Status}, Role={Role}",
                request.Status, request.Role);

            var users = _context.GetUsers(cancellationToken);

            // Apply filters if provided
            if (!string.IsNullOrEmpty(request.Status))
            {
                users = request.Status.ToLower() switch
                {
                    "active" => users.Where(u => !u.IsSuspended),
                    "suspended" => users.Where(u => u.IsSuspended),
                    "verified" => users.Where(u => u.EmailVerified),
                    "unverified" => users.Where(u => !u.EmailVerified),
                    _ => users
                };
            }

            if (!string.IsNullOrEmpty(request.Role))
            {
                users = users.Where(u => u.UserRoles.Any(ur => ur.Role.Name == request.Role));
            }

            var userList = users.ToList();

            // Create CSV content
            var csv = new StringBuilder();
            csv.AppendLine("Id,Username,Email,FirstName,LastName,Status,EmailVerified,CreatedAt,LastLoginAt");

            foreach (var user in userList)
            {
                csv.AppendLine($"{user.Id},{user.UserName},{user.Email},{user.FirstName},{user.LastName}," +
                    $"{(user.IsSuspended ? "Suspended" : "Active")},{user.EmailVerified}," +
                    $"{user.CreatedAt:yyyy-MM-dd HH:mm:ss},{user.LastLoginAt?.ToString("yyyy-MM-dd HH:mm:ss") ?? "Never"}");
            }

            var fileContent = Encoding.UTF8.GetBytes(csv.ToString());
            var fileName = $"users_export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv";

            var result = new ExportResult(fileContent, fileName);

            return Success(result, "Users exported successfully");
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error exporting users");
            return Error("Failed to export users");
        }
    }
}
