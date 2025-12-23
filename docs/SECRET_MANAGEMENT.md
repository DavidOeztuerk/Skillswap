# Secret Management for SkillSwap

## ⚠️ SECURITY NOTICE

The previous JWT secret (`4933547c-ef8d-4576-b0ae-a5aa575028bf`) has been **COMPROMISED** and exposed in the repository. 

**DO NOT USE THE OLD SECRET UNDER ANY CIRCUMSTANCES!**

A new secure secret has been generated and configured for local development.

## Local Development Setup

For local development, we use .NET User Secrets to securely store sensitive configuration values.

### Initial Setup

Run the provided script to configure all services:

```bash
bash setup-secrets.sh
```

This script will configure the JWT secret for all services using .NET User Secrets.

### Manual Configuration

If you need to manually set or update the JWT secret:

```bash
# Navigate to each service directory and run:
dotnet user-secrets set "JwtSettings:Secret" "YOUR_NEW_SECRET_HERE"
```

Services that require JWT secret:
- Gateway
- UserService
- SkillService
- AppointmentService
- MatchmakingService
- NotificationService
- VideocallService

## Production/Staging Environment

For production and staging environments, use environment variables:

```bash
# Set the JWT secret as an environment variable
export JwtSettings__Secret="YOUR_SECURE_PRODUCTION_SECRET"
```

Or in Docker Compose:

```yaml
environment:
  - JwtSettings__Secret=${JWT_SECRET}
```

Or in Kubernetes:

```yaml
env:
  - name: JwtSettings__Secret
    valueFrom:
      secretKeyRef:
        name: jwt-secret
        key: secret
```

## Azure Deployment

For Azure deployments, configure the secret in:
- Azure Key Vault (recommended)
- App Service Configuration settings
- Container Apps secrets

Example using Azure CLI:
```bash
az webapp config appsettings set \
  --name <app-name> \
  --resource-group <resource-group> \
  --settings JwtSettings__Secret="<your-secret>"
```

## Security Best Practices

1. **Never commit secrets to source control**
2. **Use different secrets for different environments**
3. **Rotate secrets regularly**
4. **Use strong, randomly generated secrets** (minimum 32 characters)
5. **Store production secrets in secure vaults** (Azure Key Vault, AWS Secrets Manager, etc.)
6. **Limit access to production secrets**
7. **Audit secret access**

## Generating Secure Secrets

To generate a new secure secret:

```bash
# Using uuidgen (macOS/Linux)
uuidgen

# Using openssl
openssl rand -hex 32

# Using .NET
dotnet user-secrets set "JwtSettings:Secret" "$(uuidgen)"
```

## Troubleshooting

If services fail to start with authentication errors:

1. Verify the secret is set correctly:
   ```bash
   cd src/services/[ServiceName]
   dotnet user-secrets list
   ```

2. Check that the service's .csproj file contains UserSecretsId:
   ```xml
   <PropertyGroup>
     <UserSecretsId>service-name-secrets</UserSecretsId>
   </PropertyGroup>
   ```

3. Ensure the environment is set to Development for local testing:
   ```bash
   export ASPNETCORE_ENVIRONMENT=Development
   ```

## Important Notes

- The `appsettings.json` files now contain placeholder values (`REPLACE_WITH_SECURE_SECRET_IN_PRODUCTION`)
- These placeholders will be overridden by User Secrets in development and environment variables in production
- Never update the placeholder values with actual secrets

## References

- [Safe storage of app secrets in development in ASP.NET Core](https://docs.microsoft.com/en-us/aspnet/core/security/app-secrets)
- [Configuration in ASP.NET Core](https://docs.microsoft.com/en-us/aspnet/core/fundamentals/configuration)
- [Azure Key Vault](https://azure.microsoft.com/en-us/services/key-vault/)