using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NotificationService.Domain.Entities;
using System.Text.Json;

namespace NotificationService.Infrastructure.Data;

/// <summary>
/// Seeds email templates into the database
/// </summary>
public class EmailTemplateSeeder
{
    private readonly NotificationDbContext _dbContext;
    private readonly ILogger<EmailTemplateSeeder> _logger;

    public EmailTemplateSeeder(NotificationDbContext dbContext, ILogger<EmailTemplateSeeder> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task SeedAsync()
    {
        try
        {
            var templates = GetDefaultTemplates();
            
            foreach (var template in templates)
            {
                var existingTemplate = await _dbContext.EmailTemplates
                    .FirstOrDefaultAsync(t => t.Name == template.Name && t.Language == template.Language);

                if (existingTemplate == null)
                {
                    _dbContext.EmailTemplates.Add(template);
                    _logger.LogInformation("Seeding email template: {TemplateName} ({Language})", 
                        template.Name, template.Language);
                }
                else if (string.Compare(existingTemplate.Version, template.Version, StringComparison.OrdinalIgnoreCase) < 0)
                {
                    // Update if newer version
                    existingTemplate.Subject = template.Subject;
                    existingTemplate.HtmlContent = template.HtmlContent;
                    existingTemplate.TextContent = template.TextContent;
                    existingTemplate.Version = template.Version;
                    existingTemplate.UpdatedAt = DateTime.UtcNow;
                    existingTemplate.Description = template.Description;
                    existingTemplate.VariablesSchema = template.VariablesSchema;
                    
                    _logger.LogInformation("Updating email template: {TemplateName} ({Language}) to version {Version}", 
                        template.Name, template.Language, template.Version);
                }
            }

            await _dbContext.SaveChangesAsync();
            _logger.LogInformation("Email template seeding completed");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error seeding email templates");
            throw;
        }
    }

    private List<EmailTemplate> GetDefaultTemplates()
    {
        var templates = new List<EmailTemplate>();

        // Load HTML templates from files if they exist
        var templatesPath = Path.Combine(Directory.GetCurrentDirectory(), "Templates");
        
        // Email Verification Template
        templates.Add(new EmailTemplate
        {
            Id = Guid.NewGuid().ToString(),
            Name = "email-verification",
            Language = "en",
            Subject = "Verify your SkillSwap email address",
            HtmlContent = File.Exists(Path.Combine(templatesPath, "EmailVerificationTemplate.html"))
                ? File.ReadAllText(Path.Combine(templatesPath, "EmailVerificationTemplate.html"))
                : GetDefaultEmailVerificationHtml(),
            TextContent = @"Hi {{FirstName}},

Please verify your email address by clicking the link below:
{{VerificationUrl}}

This link will expire in 72 hours. After that, you'll need to request a new verification link to access your account.

If you didn't create a SkillSwap account, please ignore this email.

Best regards,
The SkillSwap Team",
            IsActive = true,
            Version = "2.0",
            Description = "Email verification template with 72-hour expiry warning",
            VariablesSchema = JsonSerializer.Serialize(new
            {
                FirstName = "string",
                VerificationUrl = "string",
                ExpiryHours = "number"
            }),
            CreatedAt = DateTime.UtcNow
        });

        // Appointment Confirmation Template
        templates.Add(new EmailTemplate
        {
            Id = Guid.NewGuid().ToString(),
            Name = "appointment-confirmation",
            Language = "en",
            Subject = "Your SkillSwap session is confirmed! 🎉",
            HtmlContent = File.Exists(Path.Combine(templatesPath, "AppointmentConfirmedTemplate.html"))
                ? File.ReadAllText(Path.Combine(templatesPath, "AppointmentConfirmedTemplate.html"))
                : GetDefaultAppointmentConfirmationHtml(),
            TextContent = @"Hi {{RecipientFirstName}},

Great news! Your skill session has been confirmed.

Details:
- Skill: {{SkillName}}
- Partner: {{PartnerName}}
- Date: {{ScheduledDate}}
- Time: {{ScheduledTime}}
- Duration: {{DurationMinutes}} minutes
- Meeting Link: {{MeetingLink}}

Please save this meeting link and join on time.

Best regards,
The SkillSwap Team",
            IsActive = true,
            Version = "2.0",
            Description = "Appointment confirmation with meeting link",
            VariablesSchema = JsonSerializer.Serialize(new
            {
                RecipientFirstName = "string",
                RecipientName = "string",
                PartnerName = "string",
                SkillName = "string",
                ScheduledDate = "string",
                ScheduledTime = "string",
                DurationMinutes = "number",
                MeetingLink = "string"
            }),
            CreatedAt = DateTime.UtcNow
        });

        // Appointment Rescheduled Template
        templates.Add(new EmailTemplate
        {
            Id = Guid.NewGuid().ToString(),
            Name = "appointment-rescheduled",
            Language = "en",
            Subject = "Your SkillSwap session has been rescheduled",
            HtmlContent = File.Exists(Path.Combine(templatesPath, "AppointmentRescheduledTemplate.html"))
                ? File.ReadAllText(Path.Combine(templatesPath, "AppointmentRescheduledTemplate.html"))
                : GetDefaultAppointmentRescheduledHtml(),
            TextContent = @"Hi {{RecipientFirstName}},

Your skill session has been rescheduled by {{RescheduledByName}}.

Previous Schedule:
- Date: {{OldScheduledDate}}
- Time: {{OldScheduledTime}}

New Schedule:
- Date: {{NewScheduledDate}}
- Time: {{NewScheduledTime}}
- Duration: {{NewDurationMinutes}} minutes

Reason: {{Reason}}

Meeting Link remains the same: {{MeetingLink}}

Please update your calendar accordingly.

Best regards,
The SkillSwap Team",
            IsActive = true,
            Version = "2.0",
            Description = "Appointment reschedule notification",
            VariablesSchema = JsonSerializer.Serialize(new
            {
                RecipientFirstName = "string",
                RescheduledByName = "string",
                OldScheduledDate = "string",
                OldScheduledTime = "string",
                NewScheduledDate = "string",
                NewScheduledTime = "string",
                NewDurationMinutes = "number",
                Reason = "string",
                MeetingLink = "string"
            }),
            CreatedAt = DateTime.UtcNow
        });

        // Welcome Email Template
        templates.Add(new EmailTemplate
        {
            Id = Guid.NewGuid().ToString(),
            Name = "welcome",
            Language = "en",
            Subject = "Welcome to SkillSwap! 🎉",
            HtmlContent = @"<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>Welcome to SkillSwap!</h1>
        </div>
        <div class='content'>
            <h2>Hi {{FirstName}}! 👋</h2>
            <p>We're thrilled to have you join our community of learners and skill sharers!</p>
            <p>SkillSwap is where people come together to exchange knowledge and grow together. Here's how to get started:</p>
            <ul>
                <li>Complete your profile to let others know about you</li>
                <li>Browse available skills or offer your own</li>
                <li>Connect with other members and start learning</li>
            </ul>
            <div style='text-align: center; margin: 30px 0;'>
                <a href='{{AppUrl}}/profile' class='button'>Complete Your Profile</a>
                <a href='{{AppUrl}}/skills' class='button'>Browse Skills</a>
            </div>
            <p>If you have any questions, our support team is always here to help!</p>
            <p>Happy learning!<br>The SkillSwap Team</p>
        </div>
    </div>
</body>
</html>",
            TextContent = @"Welcome to SkillSwap!

Hi {{FirstName}}!

We're thrilled to have you join our community of learners and skill sharers!

Get started by:
- Completing your profile
- Browsing available skills
- Connecting with other members

Visit {{AppUrl}} to begin your journey.

Happy learning!
The SkillSwap Team",
            IsActive = true,
            Version = "1.0",
            Description = "Welcome email for new users",
            VariablesSchema = JsonSerializer.Serialize(new
            {
                FirstName = "string",
                AppUrl = "string"
            }),
            CreatedAt = DateTime.UtcNow
        });

        // Password Reset Template
        templates.Add(new EmailTemplate
        {
            Id = Guid.NewGuid().ToString(),
            Name = "password-reset",
            Language = "en",
            Subject = "Reset your SkillSwap password",
            HtmlContent = @"<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .alert { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 30px; background: #dc3545; color: white; text-decoration: none; border-radius: 5px; }
    </style>
</head>
<body>
    <div class='container'>
        <h2>Password Reset Request</h2>
        <p>Hi {{FirstName}},</p>
        <p>We received a request to reset your SkillSwap password. Click the button below to create a new password:</p>
        <div style='text-align: center; margin: 30px 0;'>
            <a href='{{ResetUrl}}' class='button'>Reset Password</a>
        </div>
        <div class='alert'>
            <strong>⚠️ Important:</strong> This link will expire in 1 hour for security reasons.
        </div>
        <p>If you didn't request this password reset, please ignore this email. Your password won't be changed.</p>
        <p>Best regards,<br>The SkillSwap Team</p>
    </div>
</body>
</html>",
            TextContent = @"Password Reset Request

Hi {{FirstName}},

We received a request to reset your SkillSwap password.

Reset your password here: {{ResetUrl}}

This link will expire in 1 hour.

If you didn't request this, please ignore this email.

Best regards,
The SkillSwap Team",
            IsActive = true,
            Version = "1.0",
            Description = "Password reset request email",
            VariablesSchema = JsonSerializer.Serialize(new
            {
                FirstName = "string",
                ResetUrl = "string"
            }),
            CreatedAt = DateTime.UtcNow
        });

        // Appointment Reminder Template
        templates.Add(new EmailTemplate
        {
            Id = Guid.NewGuid().ToString(),
            Name = "appointment-reminder",
            Language = "en",
            Subject = "Reminder: Your SkillSwap session starts in {{TimeUntil}}",
            HtmlContent = GetDefaultAppointmentReminderHtml(),
            TextContent = @"Hi {{RecipientFirstName}},

This is a friendly reminder that your skill session is starting soon!

Session Details:
- Skill: {{SkillName}}
- Partner: {{PartnerName}}
- Date: {{ScheduledDate}}
- Time: {{ScheduledTime}}
- Starts in: {{TimeUntil}}

Meeting Link: {{MeetingLink}}

Make sure to join on time!

Best regards,
The SkillSwap Team",
            IsActive = true,
            Version = "1.0",
            Description = "Appointment reminder notification",
            VariablesSchema = JsonSerializer.Serialize(new
            {
                RecipientFirstName = "string",
                PartnerName = "string",
                SkillName = "string",
                ScheduledDate = "string",
                ScheduledTime = "string",
                TimeUntil = "string",
                MinutesUntil = "number",
                MeetingLink = "string"
            }),
            CreatedAt = DateTime.UtcNow
        });

        templates.Add(new EmailTemplate
        {
            Id = Guid.NewGuid().ToString(),
            Name = "listing-expiring",
            Language = "en",
            Subject = "Your SkillSwap listing expires in {{DaysRemaining}} days",
            HtmlContent = GetDefaultListingExpiringHtml(),
            TextContent = @"Hi {{FirstName}},

Your skill listing is about to expire!

Skill: {{SkillName}}
Expires at: {{ExpiresAt}}

Don't let your listing expire - refresh it now to keep it active and visible to others.

Refresh your listing here: {{RefreshUrl}}

Best regards,
The SkillSwap Team",
            IsActive = true,
            Version = "1.0",
            Description = "Notification when a listing is about to expire",
            VariablesSchema = JsonSerializer.Serialize(new
            {
                FirstName = "string",
                SkillName = "string",
                DaysRemaining = "number",
                ExpiresAt = "string",
                RefreshUrl = "string",
                AppUrl = "string"
            }),
            CreatedAt = DateTime.UtcNow
        });

        templates.Add(new EmailTemplate
        {
            Id = Guid.NewGuid().ToString(),
            Name = "listing-expired",
            Language = "en",
            Subject = "Your SkillSwap listing has expired",
            HtmlContent = GetDefaultListingExpiredHtml(),
            TextContent = @"Hi {{FirstName}},

Your skill listing has expired.

Skill: {{SkillName}}
Expired at: {{ExpiredAt}}

Your skill is no longer visible to other users. Don't worry - you can create a new listing anytime!

Create a new listing here: {{CreateListingUrl}}

Best regards,
The SkillSwap Team",
            IsActive = true,
            Version = "1.0",
            Description = "Notification when a listing has expired",
            VariablesSchema = JsonSerializer.Serialize(new
            {
                FirstName = "string",
                SkillName = "string",
                ExpiredAt = "string",
                CreateListingUrl = "string",
                AppUrl = "string"
            }),
            CreatedAt = DateTime.UtcNow
        });

        return templates;
    }

    private string GetDefaultListingExpiringHtml()
    {
        return @"<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 10px 10px; }
        .countdown { font-size: 24px; color: #ff9800; font-weight: bold; text-align: center; padding: 15px; background: #fff3e0; border-radius: 5px; margin: 20px 0; }
        .button { display: inline-block; padding: 15px 40px; background: #ff9800; color: white; text-decoration: none; border-radius: 5px; font-size: 18px; }
        .details { background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>⏰ Listing Expiring Soon!</h1>
        </div>
        <div class='content'>
            <p>Hi {{FirstName}},</p>

            <div class='countdown'>
                {{DaysRemaining}} days remaining!
            </div>

            <p>Your skill listing is about to expire:</p>

            <div class='details'>
                <p><strong>📚 Skill:</strong> {{SkillName}}</p>
                <p><strong>📅 Expires:</strong> {{ExpiresAt}}</p>
            </div>

            <p>Don't let your listing expire - refresh it now to keep it visible to other users!</p>

            <div style='text-align: center; margin: 30px 0;'>
                <a href='{{RefreshUrl}}' class='button'>Refresh Listing</a>
            </div>

            <p style='text-align: center; color: #666; font-size: 14px;'>
                You can refresh your listing up to 5 times. Each refresh extends it for another 60 days.
            </p>
        </div>
    </div>
</body>
</html>";
    }

    private string GetDefaultListingExpiredHtml()
    {
        return @"<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #607d8b 0%, #455a64 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 15px 40px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; font-size: 18px; }
        .details { background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .info { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>Listing Expired</h1>
        </div>
        <div class='content'>
            <p>Hi {{FirstName}},</p>

            <p>Your skill listing has expired and is no longer visible to other users.</p>

            <div class='details'>
                <p><strong>📚 Skill:</strong> {{SkillName}}</p>
                <p><strong>📅 Expired:</strong> {{ExpiredAt}}</p>
            </div>

            <div class='info'>
                <strong>💡 Good news:</strong> Your skill profile is still saved! You can create a new listing anytime to make it visible again.
            </div>

            <div style='text-align: center; margin: 30px 0;'>
                <a href='{{CreateListingUrl}}' class='button'>Create New Listing</a>
            </div>

            <p style='text-align: center; color: #666; font-size: 14px;'>
                Creating a new listing is quick and easy - just a few clicks!
            </p>
        </div>
    </div>
</body>
</html>";
    }

    private string GetDefaultAppointmentReminderHtml()
    {
        return @"<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 10px 10px; }
        .details { background: #fff3e0; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ff6b6b; }
        .countdown { font-size: 24px; color: #ff6b6b; font-weight: bold; text-align: center; padding: 15px; background: #ffebee; border-radius: 5px; margin: 20px 0; }
        .button { display: inline-block; padding: 15px 40px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; font-size: 18px; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>⏰ Reminder!</h1>
            <p>Your session is starting soon</p>
        </div>
        <div class='content'>
            <p>Hi {{RecipientFirstName}},</p>

            <div class='countdown'>
                Starts in {{TimeUntil}}!
            </div>

            <p>Don't forget about your upcoming skill session:</p>

            <div class='details'>
                <p><strong>📚 Skill:</strong> {{SkillName}}</p>
                <p><strong>👤 Partner:</strong> {{PartnerName}}</p>
                <p><strong>📅 Date:</strong> {{ScheduledDate}}</p>
                <p><strong>⏰ Time:</strong> {{ScheduledTime}}</p>
            </div>

            <div style='text-align: center; margin: 30px 0;'>
                <a href='{{MeetingLink}}' class='button'>Join Now</a>
            </div>

            <p style='text-align: center; color: #666; font-size: 14px;'>
                Make sure you have a stable internet connection and a quiet environment.
            </p>
        </div>
    </div>
</body>
</html>";
    }

    private string GetDefaultEmailVerificationHtml()
    {
        return @"<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #007bff; color: white; padding: 20px; text-align: center; }
        .content { background: white; padding: 30px; border: 1px solid #ddd; }
        .button { display: inline-block; padding: 12px 30px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>Verify Your Email</h1>
        </div>
        <div class='content'>
            <p>Hi {{FirstName}},</p>
            <p>Thanks for signing up for SkillSwap! Please verify your email address to activate your account.</p>
            <div style='text-align: center; margin: 30px 0;'>
                <a href='{{VerificationUrl}}' class='button'>Verify Email Address</a>
            </div>
            <div class='warning'>
                <strong>Important:</strong> This verification link will expire in 72 hours. After that, you'll need to request a new verification link.
            </div>
            <p>If you're having trouble clicking the button, copy and paste this link into your browser:</p>
            <p style='word-break: break-all; color: #007bff;'>{{VerificationUrl}}</p>
        </div>
    </div>
</body>
</html>";
    }

    private string GetDefaultAppointmentConfirmationHtml()
    {
        return @"<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .details { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 30px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>Session Confirmed! 🎉</h1>
        </div>
        <div class='content'>
            <p>Hi {{RecipientFirstName}},</p>
            <p>Great news! Your skill session has been confirmed with {{PartnerName}}.</p>
            <div class='details'>
                <h3>Session Details:</h3>
                <p><strong>📚 Skill:</strong> {{SkillName}}</p>
                <p><strong>👤 Partner:</strong> {{PartnerName}}</p>
                <p><strong>📅 Date:</strong> {{ScheduledDate}}</p>
                <p><strong>⏰ Time:</strong> {{ScheduledTime}}</p>
                <p><strong>⏱️ Duration:</strong> {{DurationMinutes}} minutes</p>
            </div>
            <div style='text-align: center; margin: 30px 0;'>
                <a href='{{MeetingLink}}' class='button'>Join Meeting</a>
            </div>
            <p>Save this meeting link and make sure to join on time!</p>
        </div>
    </div>
</body>
</html>";
    }

    private string GetDefaultAppointmentRescheduledHtml()
    {
        return @"<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ffc107; color: #333; padding: 30px; text-align: center; }
        .old-time { background: #ffebee; padding: 15px; border-radius: 5px; text-decoration: line-through; opacity: 0.7; }
        .new-time { background: #e8f5e9; padding: 15px; border-radius: 5px; font-weight: bold; }
        .reason { background: #f5f5f5; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>Session Rescheduled</h1>
        </div>
        <div class='content'>
            <p>Hi {{RecipientFirstName}},</p>
            <p>Your skill session has been rescheduled by {{RescheduledByName}}.</p>
            
            <div class='old-time'>
                <h4>Previous Schedule:</h4>
                <p>Date: {{OldScheduledDate}}<br>
                Time: {{OldScheduledTime}}</p>
            </div>
            
            <div class='new-time'>
                <h4>New Schedule:</h4>
                <p>Date: {{NewScheduledDate}}<br>
                Time: {{NewScheduledTime}}<br>
                Duration: {{NewDurationMinutes}} minutes</p>
            </div>
            
            <div class='reason'>
                <strong>Reason:</strong> {{Reason}}
            </div>
            
            <p>Your meeting link remains the same: <a href='{{MeetingLink}}'>{{MeetingLink}}</a></p>
            <p>Please update your calendar accordingly.</p>
        </div>
    </div>
</body>
</html>";
    }
}