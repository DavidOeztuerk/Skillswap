# 🔐 Security Setup Guide

This document provides step-by-step instructions for configuring security in the Skillswap platform.

---

## 🚨 Critical Security Requirements

### ❌ NEVER Do This:
- ❌ Commit `.env` files to version control
- ❌ Share secrets in Slack, email, or documentation
- ❌ Use the same secrets across Development/Staging/Production
- ❌ Hardcode secrets in `appsettings.json`
- ❌ Use weak or predictable secrets (e.g., "password123")

### ✅ ALWAYS Do This:
- ✅ Use cryptographically secure random secrets (minimum 32 bytes)
- ✅ Rotate secrets regularly (every 90 days recommended)
- ✅ Use different secrets for each environment
- ✅ Store production secrets in a secure vault (Azure Key Vault, AWS Secrets Manager)
- ✅ Use environment variables for secret injection

---

## 📋 Quick Start (Development)

### 1. Generate Secrets

Run the secret generation script:

```bash
# From project root
./scripts/generate-secrets.sh

# Or generate and save directly to .env
./scripts/generate-secrets.sh --output .env
```

This will generate:
- **JWT_SECRET**: 64-byte base64 secret for JWT signing
- **DB_PASSWORD**: 32-byte base64 database password
- **M2M_CLIENT_SECRET**: 32-byte hex secret for machine-to-machine auth
- **SECRET_MANAGER_ENCRYPTION_KEY_BASE64**: 32-byte base64 key for encrypting secrets

### 2. Customize Configuration

Edit `.env` to add service-specific configuration:

```bash
# SMTP settings for email notifications
SMTP_HOST=smtp.gmail.com
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password

# Twilio settings for SMS notifications
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
```

### 3. Load Environment Variables

#### Option A: dotenv (Recommended for Development)

Install dotenv:
```bash
# .NET
dotnet add package DotNetEnv
```

In `Program.cs`:
```csharp
// Load .env file in Development
if (builder.Environment.IsDevelopment())
{
    DotNetEnv.Env.Load();
}
```

#### Option B: Manual Export (macOS/Linux)

```bash
# Load all variables from .env
export $(cat .env | xargs)

# Or source it
source .env
```

#### Option C: IDE Configuration

**Visual Studio**:
- Right-click project → Properties → Debug → Environment Variables
- Add each variable manually

**VS Code**:
- Add to `.vscode/launch.json`:
```json
{
  "configurations": [{
    "env": {
      "JWT_SECRET": "${env:JWT_SECRET}"
    }
  }]
}
```

**Rider**:
- Run → Edit Configurations → Environment Variables
- Load from file: `.env`

---

## 🏗️ How It Works

### Environment Variable Substitution

ASP.NET Core automatically substitutes environment variables in `appsettings.json`:

```json
{
  "JwtSettings": {
    "Secret": "${JWT_SECRET}"
  }
}
```

At runtime, `${JWT_SECRET}` is replaced with the actual environment variable value.

### Configuration Loading Order

ASP.NET Core loads configuration in this order (later sources override earlier):

1. `appsettings.json`
2. `appsettings.{Environment}.json`
3. Environment variables
4. Command-line arguments

---

## 🐳 Docker Setup

### docker-compose.yml

```yaml
services:
  userservice:
    image: skillswap/userservice
    env_file:
      - .env  # Load all variables from .env
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
```

### Docker Secrets (Production)

```yaml
services:
  userservice:
    secrets:
      - jwt_secret
      - db_password
    environment:
      - JWT_SECRET=/run/secrets/jwt_secret
      - DB_PASSWORD=/run/secrets/db_password

secrets:
  jwt_secret:
    external: true
  db_password:
    external: true
```

Create secrets:
```bash
echo "your-jwt-secret" | docker secret create jwt_secret -
echo "your-db-password" | docker secret create db_password -
```

---

## ☸️ Kubernetes Setup

### Create Secrets

```bash
kubectl create secret generic skillswap-secrets \
  --from-literal=JWT_SECRET=$(openssl rand -base64 64) \
  --from-literal=DB_PASSWORD=$(openssl rand -base64 32) \
  --from-literal=M2M_CLIENT_SECRET=$(openssl rand -hex 32) \
  --from-literal=SECRET_MANAGER_KEY=$(openssl rand -base64 32)
```

### Deployment YAML

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: userservice
spec:
  template:
    spec:
      containers:
      - name: userservice
        image: skillswap/userservice:latest
        env:
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: skillswap-secrets
              key: JWT_SECRET
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: skillswap-secrets
              key: DB_PASSWORD
```

---

## ☁️ Azure Setup

### Azure Key Vault

1. **Create Key Vault**:
```bash
az keyvault create \
  --name skillswap-kv-prod \
  --resource-group skillswap-rg \
  --location westeurope
```

2. **Add Secrets**:
```bash
az keyvault secret set \
  --vault-name skillswap-kv-prod \
  --name JWT-SECRET \
  --value $(openssl rand -base64 64)
```

3. **Configure App Service**:
```bash
az webapp config appsettings set \
  --name skillswap-userservice \
  --resource-group skillswap-rg \
  --settings @keyvault(https://skillswap-kv-prod.vault.azure.net/secrets/JWT-SECRET)
```

### Azure App Configuration

For advanced scenarios with feature flags and configuration management:

```bash
# Create App Configuration store
az appconfig create \
  --name skillswap-appconfig \
  --resource-group skillswap-rg \
  --location westeurope

# Add configuration
az appconfig kv set \
  --name skillswap-appconfig \
  --key JwtSettings:Secret \
  --value $(openssl rand -base64 64) \
  --yes
```

---

## 🔄 Secret Rotation

### Recommended Rotation Schedule

| Secret Type | Rotation Frequency | Priority |
|-------------|-------------------|----------|
| JWT_SECRET | Every 90 days | HIGH |
| DB_PASSWORD | Every 180 days | HIGH |
| M2M_CLIENT_SECRET | Every 90 days | MEDIUM |
| API Keys (Twilio, etc.) | Every 365 days | LOW |

### Rotation Process

1. **Generate new secret**:
   ```bash
   NEW_JWT_SECRET=$(openssl rand -base64 64)
   ```

2. **Update in vault** (Azure Key Vault, K8s, etc.)

3. **Deploy with zero-downtime**:
   - Blue-Green deployment
   - Rolling update
   - Keep old secret valid during transition

4. **Verify all services are using new secret**

5. **Invalidate old secret after 24-hour grace period**

---

## 🧪 Testing Secret Configuration

### Verify Secrets Are Loaded

Add to `Program.cs` (Development only):

```csharp
#if DEBUG
var jwtSecret = builder.Configuration["JwtSettings:Secret"];
if (string.IsNullOrEmpty(jwtSecret) || jwtSecret.StartsWith("REPLACE"))
{
    throw new InvalidOperationException(
        "JWT_SECRET environment variable not set! Run: ./scripts/generate-secrets.sh");
}
Console.WriteLine($"✅ JWT Secret loaded: {jwtSecret.Substring(0, 10)}...");
#endif
```

### Integration Test

```csharp
[Fact]
public void JwtSecret_ShouldBeConfigured()
{
    var secret = _configuration["JwtSettings:Secret"];

    Assert.NotNull(secret);
    Assert.NotEmpty(secret);
    Assert.DoesNotContain("REPLACE", secret);
    Assert.True(secret.Length >= 32, "Secret too short!");
}
```

---

## 📊 Secret Strength Guidelines

### JWT_SECRET
- **Minimum**: 256 bits (32 bytes)
- **Recommended**: 512 bits (64 bytes)
- **Format**: Base64-encoded random bytes
- **Entropy**: ~387 bits (for 64 bytes base64)

### DB_PASSWORD
- **Minimum**: 256 bits (32 bytes)
- **Recommended**: 256 bits (32 bytes)
- **Characters**: Alphanumeric + special characters
- **Entropy**: ~171 bits (for 32 bytes base64)

### M2M_CLIENT_SECRET
- **Minimum**: 256 bits (32 bytes)
- **Recommended**: 256 bits (32 bytes)
- **Format**: Hexadecimal
- **Entropy**: 128 bits (for 32 bytes hex)

---

## 🔍 Troubleshooting

### Issue: "Unauthorized 401" errors

**Cause**: JWT secret mismatch between services

**Solution**: Ensure **all services** use the **same JWT_SECRET**

```bash
# Verify all services have same secret
grep JWT_SECRET .env
```

### Issue: "Connection string is invalid"

**Cause**: DB_PASSWORD not loaded

**Solution**:
1. Verify `.env` file exists
2. Check environment variable is set: `echo $DB_PASSWORD`
3. Restart service after setting environment variables

### Issue: "Secret must be at least 32 characters"

**Cause**: Weak or empty JWT secret

**Solution**: Regenerate secrets:
```bash
./scripts/generate-secrets.sh
```

---

## 📚 Additional Resources

- [ASP.NET Core Configuration](https://docs.microsoft.com/en-us/aspnet/core/fundamentals/configuration/)
- [Azure Key Vault](https://docs.microsoft.com/en-us/azure/key-vault/)
- [Kubernetes Secrets](https://kubernetes.io/docs/concepts/configuration/secret/)
- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

---

## 🆘 Emergency Contact

If secrets are compromised:

1. **Immediately rotate all secrets**
2. **Invalidate all active JWTs** (force re-login)
3. **Review audit logs** for unauthorized access
4. **Notify security team**
5. **Document incident** for post-mortem

---

**Last Updated**: 2025-01-09
**Maintainer**: DevOps Team
