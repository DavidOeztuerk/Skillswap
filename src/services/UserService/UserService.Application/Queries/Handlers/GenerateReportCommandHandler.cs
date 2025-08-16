using System.Text;
using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;
using UserService.Domain.Repositories;

namespace UserService.Application.Commands.Handlers;

public class GenerateReportCommandHandler(
    IUserRepository context,
    ILogger<GenerateReportCommandHandler> logger)
    : BaseCommandHandler<GenerateReportCommand, ReportResult>(logger)
{
    private readonly IUserRepository _context = context;

    public override async Task<ApiResponse<ReportResult>> Handle(
        GenerateReportCommand request,
        CancellationToken cancellationToken)
    {
        await Task.CompletedTask;
        
        try
        {
            Logger.LogInformation("Generating report of type: {Type}", request.Type);

            var csv = new StringBuilder();
            
            switch (request.Type?.ToLower())
            {
                case "users":
                    csv = GenerateUsersReport(cancellationToken);
                    break;
                case "skills":
                    csv = GenerateSkillsReport(cancellationToken);
                    break;
                case "system":
                    csv = GenerateSystemReport();
                    break;
                default:
                    return Error($"Unknown report type: {request.Type}");
            }

            var fileContent = Encoding.UTF8.GetBytes(csv.ToString());
            var fileName = $"{request.Type}_report_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv";

            var result = new ReportResult(fileContent, fileName);

            return Success(result, "Report generated successfully");
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error generating report");
            return Error("Failed to generate report");
        }
    }

    private StringBuilder GenerateUsersReport(CancellationToken cancellationToken)
    {
        var csv = new StringBuilder();
        csv.AppendLine("Id,Username,Email,FirstName,LastName,Status,EmailVerified,TwoFactorEnabled,CreatedAt,LastLoginAt");

        var users = _context.GetUsers(cancellationToken).ToList();
        
        foreach (var user in users)
        {
            csv.AppendLine($"{user.Id},{user.UserName},{user.Email},{user.FirstName},{user.LastName}," +
                $"{(user.IsSuspended ? "Suspended" : "Active")},{user.EmailVerified},{user.TwoFactorEnabled}," +
                $"{user.CreatedAt:yyyy-MM-dd HH:mm:ss},{user.LastLoginAt?.ToString("yyyy-MM-dd HH:mm:ss") ?? "Never"}");
        }
        
        return csv;
    }

    private StringBuilder GenerateSkillsReport(CancellationToken cancellationToken)
    {
        var csv = new StringBuilder();
        csv.AppendLine("UserId,Username,SkillCount,FavoriteSkillCount");

        var users = _context.GetUsers(cancellationToken).ToList();
        
        foreach (var user in users)
        {
            var skillCount = user.UserRoles.Count; // Placeholder
            var favoriteCount = user.FavoriteSkillIds?.Count ?? 0;
            
            csv.AppendLine($"{user.Id},{user.UserName},{skillCount},{favoriteCount}");
        }
        
        return csv;
    }

    private StringBuilder GenerateSystemReport()
    {
        var csv = new StringBuilder();
        csv.AppendLine("Metric,Value,Timestamp");
        
        csv.AppendLine($"TotalMemory,{GC.GetTotalMemory(false)},{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}");
        csv.AppendLine($"ProcessorCount,{Environment.ProcessorCount},{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}");
        csv.AppendLine($"MachineName,{Environment.MachineName},{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}");
        csv.AppendLine($"OSVersion,{Environment.OSVersion},{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}");
        
        return csv;
    }
}
