using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.DependencyInjection;

namespace Infrastructure.Security;

/// <summary>
/// Extension methods for configuring authorization
/// </summary>
public static class AuthorizationExtensions
{
    public static IServiceCollection AddSkillSwapAuthorization(this IServiceCollection services)
    {
        services.AddAuthorizationBuilder()
            .AddPolicy(Policies.RequireAdminRole, policy =>
                policy.RequireRole(Roles.Admin, Roles.SuperAdmin))

            .AddPolicy(Policies.RequireModeratorRole, policy =>
                policy.RequireRole(Roles.Moderator, Roles.Admin, Roles.SuperAdmin))

            .AddPolicy(Policies.RequireUserRole, policy =>
                policy.RequireRole(Roles.User, Roles.Moderator, Roles.Admin, Roles.SuperAdmin))

            .AddPolicy(Policies.RequireVerifiedEmail, policy =>
                policy.AddRequirements(new EmailVerifiedRequirement()))

            .AddPolicy(Policies.RequireActiveAccount, policy =>
                policy.AddRequirements(new ActiveAccountRequirement()))

            .AddPolicy(Policies.CanManageUsers, policy =>
                policy.RequireAssertion(context =>
                    context.User.IsInRole(Roles.Admin) ||
                    context.User.IsInRole(Roles.SuperAdmin) ||
                    context.User.HasClaim("permission", Permissions.ManageUserRoles)))

            .AddPolicy(Policies.CanManageSkills, policy =>
                policy.RequireAssertion(context =>
                    context.User.IsInRole(Roles.Admin) ||
                    context.User.IsInRole(Roles.SuperAdmin) ||
                    context.User.HasClaim("permission", Permissions.ManageCategories)))

            .AddPolicy(Policies.CanViewSystemLogs, policy =>
                policy.RequireAssertion(context =>
                    context.User.IsInRole(Roles.Admin) ||
                    context.User.IsInRole(Roles.SuperAdmin) ||
                    context.User.HasClaim("permission", Permissions.ViewSystemLogs)));

        // Register authorization handlers
        services.AddScoped<IAuthorizationHandler, ResourceOwnerHandler>();
        services.AddScoped<IAuthorizationHandler, EmailVerifiedHandler>();
        services.AddScoped<IAuthorizationHandler, ActiveAccountHandler>();

        return services;
    }
}