using DotNetEnv;
using Infrastructure.Extensions;
using Microsoft.EntityFrameworkCore;
using PaymentService.Api.Extensions;
using PaymentService.Infrastructure.Data;
using PaymentService.Infrastructure.Extensions;
using PaymentService.Infrastructure.Services;

// Load environment-specific .env file
var envName = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development";
var envFile = $".env.{envName.ToLower()}";
if (File.Exists(envFile))
    Env.Load(envFile);
else if (File.Exists(".env"))
    Env.Load(".env");

var builder = WebApplication.CreateBuilder(args);

var serviceName = "PaymentService";

// Load Stripe configuration from environment variables
// This allows dev/test to use test keys and prod to use live keys
var stripeSecretKey = Environment.GetEnvironmentVariable("STRIPE_SECRET_KEY");
var stripePublishableKey = Environment.GetEnvironmentVariable("STRIPE_PUBLISHABLE_KEY");
var stripeWebhookSecret = Environment.GetEnvironmentVariable("STRIPE_WEBHOOK_SECRET");

if (!string.IsNullOrEmpty(stripeSecretKey))
{
    builder.Configuration["Stripe:SecretKey"] = stripeSecretKey;
}
if (!string.IsNullOrEmpty(stripePublishableKey))
{
    builder.Configuration["Stripe:PublishableKey"] = stripePublishableKey;
}
if (!string.IsNullOrEmpty(stripeWebhookSecret))
{
    builder.Configuration["Stripe:WebhookSecret"] = stripeWebhookSecret;
}

// Validate Stripe configuration - fail fast if not configured
var stripeSettings = builder.Configuration.GetSection(StripeSettings.SectionName).Get<StripeSettings>();
if (string.IsNullOrEmpty(stripeSettings?.SecretKey))
{
    throw new InvalidOperationException(
        "Stripe SecretKey is not configured. " +
        "Set STRIPE_SECRET_KEY environment variable or configure Stripe:SecretKey in appsettings.json. " +
        "Get your test keys from: https://dashboard.stripe.com/test/apikeys");
}

builder.Services.AddInfrastructure(builder.Configuration, builder.Environment, serviceName);

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<PaymentDbContext>();
    var strategy = db.Database.CreateExecutionStrategy();

    await strategy.ExecuteAsync(async () =>
    {
        await db.Database.MigrateAsync();
    });

    app.Logger.LogInformation("Database migration completed successfully");
}

app.UseSharedInfrastructure(app.Environment, serviceName);

app.MapPaymentController();

app.Logger.LogInformation("Starting {ServiceName} with Stripe payment integration", serviceName);

app.Run();

public partial class Program { }
