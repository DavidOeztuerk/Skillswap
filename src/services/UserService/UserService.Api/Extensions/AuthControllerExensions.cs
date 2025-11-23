using System.Security.Claims;
using Contracts.User.Requests;
using Contracts.User.Responses;
using Contracts.User.Responses.Auth;
using CQRS.Extensions;
using CQRS.Models;
using Infrastructure.Extensions;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using UserService.Application.Commands;
using UserService.Application.Queries;

namespace UserService.Api.Extensions;

public static class AuthControllerExensions
{
    public static RouteGroupBuilder MapAuthController(this IEndpointRouteBuilder builder)
    {
        RouteGroupBuilder auth = builder.MapGroup("/users/auth");

        auth.MapPost("/register", HandleRegisterUser)
            .WithName("RegisterUser")
            .WithSummary("Register a new user")
            .WithDescription("Creates a new user account with email verification")
            .WithTags("Authentication")
            .Produces<ApiResponse<RegisterResponse>>(201)
            .Produces(400)
            .Produces(409);

        auth.MapPost("/login", HandleLoginUser)
            .WithName("LoginUser")
            .WithSummary("Authenticate user")
            .WithDescription("Authenticates user credentials and returns JWT tokens")
            .WithTags("Authentication")
            .Produces<ApiResponse<LoginResponse>>(200)
            .Produces(401)
            .Produces(403);

        auth.MapPost("/refresh-token", HandleRefreshToken)
            .WithName("RefreshToken")
            .WithSummary("Refresh access token")
            .WithDescription("Refreshes an expired access token using a valid refresh token")
            .WithTags("Authentication")
            .AllowAnonymous()
            .Produces<RefreshTokenResponse>(200)
            .Produces(400)
            .Produces(401);

        auth.MapPost("/verify-email", HandleVerifyEmail)
            .WithName("VerifyEmail")
            .WithSummary("Verify email address")
            .WithDescription("Verifies user's email address using verification token")
            .WithTags("Authentication")
            .Produces<VerifyEmailResponse>(200)
            .Produces(400)
            .Produces(404);

        auth.MapPost("/resend-verification", HandleResendVerification)
            .WithName("ResendVerification")
            .WithSummary("Resend email verification")
            .WithDescription("Resends email verification token")
            .WithTags("Authentication")
            .Produces<ResendVerificationResponse>(200)
            .Produces(400)
            .Produces(429);

        auth.MapPost("/request-password-reset", HandleRequestPasswordReset)
            .WithName("RequestPasswordReset")
            .WithSummary("Request password reset")
            .WithDescription("Sends password reset email to user")
            .WithTags("Password Management")
            .Produces<RequestPasswordResetResponse>(200)
            .Produces(429);

        auth.MapPost("/reset-password", HandleResetPassword)
            .WithName("ResetPassword")
            .WithSummary("Reset password")
            .WithDescription("Resets user password using reset token")
            .WithTags("Password Management")
            .Produces<ResetPasswordResponse>(200)
            .Produces(400)
            .Produces(404);

        auth.MapPost("/change-password", HandleChangePassword)
            .WithName("ChangePassword")
            .WithSummary("Change password")
            .WithDescription("Changes user password (requires authentication)")
            .WithTags("Password Management")
            .RequireAuthorization()
            .Produces<ChangePasswordResponse>(200)
            .Produces(400)
            .Produces(401);

        auth.MapPost("/logout", HandleLogout)
            .WithName("Logout")
            .WithSummary("Logout user")
            .WithDescription("Revokes all refresh tokens and access token for the user")
            .WithTags("Authentication")
            .RequireAuthorization()
            .Produces<ApiResponse<LogoutResponse>>(200)
            .Produces(401);

        auth.MapPost("/service-token", HandleGenerateServiceToken)
            .WithName("GenerateServiceToken")
            .WithSummary("Generate service token")
            .WithDescription("Generates access token for service-to-service communication")
            .WithTags("Service Authentication")
            .AllowAnonymous()
            .Produces<ApiResponse<ServiceTokenResponse>>(200)
            .Produces(401);

        auth.MapPost("/verify-phone/request", HandleRequestPhoneVerification)
            .WithName("RequestPhoneVerification")
            .WithSummary("Request phone verification")
            .WithDescription("Sends SMS verification code to user's phone")
            .WithTags("Phone Verification")
            .RequireAuthorization()
            .Produces<ApiResponse<string>>(200)
            .Produces(400)
            .Produces(429);

        auth.MapPost("/verify-phone/confirm", HandleConfirmPhoneVerification)
            .WithName("ConfirmPhoneVerification")
            .WithSummary("Confirm phone verification")
            .WithDescription("Confirms phone number with verification code")
            .WithTags("Phone Verification")
            .RequireAuthorization()
            .Produces<ApiResponse<bool>>(200)
            .Produces(400)
            .Produces(401);

        auth.MapGet("/email/verification/status", HandleGetEmailVerificationStatus)
            .WithName("GetEmailVerificationStatus")
            .WithSummary("Get email verification status")
            .WithDescription("Gets the current email verification status including cooldown information")
            .WithTags("Email Verification")
            .RequireAuthorization()
            .Produces<ApiResponse<EmailVerificationStatusResponse>>(200)
            .Produces(401);


        static async Task<IResult> HandleRegisterUser(IMediator mediator, [FromBody] RegisterUserRequest request)
        {
            var command = new RegisterUserCommand(request.Email, request.Password, request.FirstName, request.LastName, request.UserName);
            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleLoginUser(IMediator mediator, [FromBody] LoginRequest request)
        {
            var command = new LoginUserCommand(
                request.Email,
                request.Password,
                request.TwoFactorCode,
                request.DeviceId,
                request.DeviceInfo);

            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleRefreshToken(IMediator mediator, HttpRequest http, [FromBody] RefreshTokenRequest request)
        {
            var accessToken = http.Headers.Authorization.ToString().Replace("Bearer ", string.Empty);
            var command = new RefreshTokenCommand(accessToken, request.RefreshToken) { UserId = null };
            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleVerifyEmail(IMediator mediator, [FromBody] VerifyEmailRequest request)
        {
            var command = new VerifyEmailCommand(request.Email, request.VerificationToken);
            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleResendVerification(IMediator mediator, [FromBody] ResendVerificationRequest request)
        {
            var command = new ResendVerificationCommand(request.Email);
            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleRequestPasswordReset(IMediator mediator, [FromBody] RequestPasswordResetRequest request)
        {
            var command = new RequestPasswordResetCommand(request.Email);
            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleResetPassword(IMediator mediator, [FromBody] ResetPasswordRequest request)
        {
            var command = new ResetPasswordCommand(request.Email, request.Token, request.NewPassword);
            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleChangePassword(IMediator mediator, ClaimsPrincipal user, [FromBody] ChangePasswordRequest request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new ChangePasswordCommand(request.CurrentPassword, request.NewPassword) { UserId = userId };
            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleRequestPhoneVerification(IMediator mediator, ClaimsPrincipal user, [FromBody] RequestPhoneVerificationRequest request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new RequestPhoneVerificationCommand(request.PhoneNumber) { UserId = userId };
            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleConfirmPhoneVerification(IMediator mediator, ClaimsPrincipal user, [FromBody] ConfirmPhoneVerificationRequest request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new ConfirmPhoneVerificationCommand(request.VerificationCode) { UserId = userId };
            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleGetEmailVerificationStatus(IMediator mediator, ClaimsPrincipal user)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var query = new GetEmailVerificationStatusQuery(userId);
            return await mediator.SendQuery(query);
        }

        static async Task<IResult> HandleLogout(IMediator mediator, ClaimsPrincipal user, HttpRequest http)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var accessToken = http.Headers.Authorization.ToString().Replace("Bearer ", string.Empty);
            var command = new LogoutUserCommand(accessToken) { UserId = userId };
            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleGenerateServiceToken(IMediator mediator, [FromBody] GenerateServiceTokenRequest request)
        {
            var command = new GenerateServiceTokenCommand(request.ServiceName, request.ServicePassword);
            return await mediator.SendCommand(command);
        }

        return auth;
    }
}
