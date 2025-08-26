# 📚 Skillswap Azure Deployment - Vollständige Dokumentation

## 📋 Inhaltsverzeichnis
1. [Überblick](#überblick)
2. [Architektur-Entscheidungen](#architektur-entscheidungen)
3. [Voraussetzungen](#voraussetzungen)
4. [Azure Setup Schritt-für-Schritt](#azure-setup-schritt-für-schritt)
5. [Infrastruktur-Komponenten](#infrastruktur-komponenten)
6. [Deployment-Prozess](#deployment-prozess)
7. [CI/CD mit GitHub Actions](#cicd-mit-github-actions)
8. [Kosten-Übersicht](#kosten-übersicht)
9. [Monitoring & Debugging](#monitoring--debugging)
10. [Häufige Probleme & Lösungen](#häufige-probleme--lösungen)

---

## 🎯 Überblick

### Was wir aufbauen:
- **Staging-Umgebung** in Azure Cloud für die Skillswap-Plattform
- **Microservices-Architektur** mit 7 Backend-Services + Frontend
- **Automatisches Deployment** via GitHub Actions
- **Managed Services** für Datenbank, Cache und Message Queue

### Warum Azure?
- ✅ Perfekt für .NET/C# Entwicklung
- ✅ $200 Free Credits + 12 Monate kostenlose Services
- ✅ Azure Container Apps (einfacher als Kubernetes)
- ✅ Integrierte DevOps-Tools
- ✅ Gute Dokumentation für .NET Entwickler

---

## 🏗️ Architektur-Entscheidungen

### 1. **Container-Orchestrierung**
| Option | Gewählt | Grund |
|--------|---------|-------|
| Azure Kubernetes Service (AKS) | ❌ | Zu komplex und teuer für MVP |
| **Azure Container Apps** | ✅ | Serverless, automatisches Scaling, günstiger |
| Azure Container Instances | ❌ | Kein Service Discovery |

### 2. **Infrastructure as Code (IaC)**
| Option | Gewählt | Grund |
|--------|---------|-------|
| Terraform | ❌ | Extra Tool, State-Management komplex |
| **Bicep** | ✅ | Azure-native, einfacher, kein State-File |
| ARM Templates | ❌ | Zu verbose, schwer lesbar |

### 3. **Datenbank**
| Option | Gewählt | Grund |
|--------|---------|-------|
| Azure SQL | ❌ | Teurer für multiple Datenbanken |
| **PostgreSQL Flexible Server** | ✅ | Kompatibel mit bestehendem Code, günstiger |
| Cosmos DB | ❌ | Overkill für MVP, teuer |

### 4. **Message Queue**
| Option | Gewählt | Grund |
|--------|---------|-------|
| RabbitMQ in Container | ❌ | Extra Management-Overhead |
| **Azure Service Bus** | ✅ | Managed Service, zuverlässig, günstig |
| Event Hubs | ❌ | Für Streaming, nicht für Commands/Events |

---

## ⚙️ Voraussetzungen

### 1. **Lokale Tools installieren**
```bash
# Azure CLI installieren
brew install azure-cli

# Bicep CLI (kommt mit Azure CLI)
az bicep install

# Docker (für lokale Image-Builds, optional)
# Falls Colima läuft:
colima start

# Git
brew install git
```

### 2. **Azure Account**
1. Gehe zu [Azure Portal](https://portal.azure.com)
2. Erstelle kostenlosen Account (Kreditkarte nötig, wird nicht belastet)
3. Erhalte $200 Credit für 30 Tage + 12 Monate Free Tier

### 3. **GitHub Repository**
- Repository muss öffentlich oder mit GitHub Actions aktiviert sein
- Secrets für Azure-Authentifizierung werden benötigt

---

## 🚀 Azure Setup Schritt-für-Schritt

### Schritt 1: Azure CLI Login
```bash
# In Azure einloggen
az login

# Subscription auswählen (falls mehrere vorhanden)
az account list --output table
az account set --subscription "DEINE-SUBSCRIPTION-ID"

# Aktuelle Subscription prüfen
az account show --output table
```

### Schritt 2: Resource Group erstellen
```bash
# Resource Group ist Container für alle Azure-Ressourcen
az group create \
    --name skillswap-rg \
    --location westeurope

# Verfügbare Locations anzeigen:
# az account list-locations --output table
```

### Schritt 3: Service Principal für GitHub Actions
```bash
# Service Principal erstellen (für CI/CD)
az ad sp create-for-rbac \
    --name "skillswap-github-actions" \
    --role contributor \
    --scopes /subscriptions/DEINE-SUBSCRIPTION-ID/resourceGroups/skillswap-rg \
    --sdk-auth

# Output kopieren - das ist dein AZURE_CREDENTIALS Secret für GitHub!
# {
#   "clientId": "xxx",
#   "clientSecret": "xxx",
#   "subscriptionId": "xxx",
#   "tenantId": "xxx",
#   ...
# }
```

### Schritt 4: GitHub Secret hinzufügen
1. Gehe zu GitHub Repository → Settings → Secrets → Actions
2. Klicke "New repository secret"
3. Name: `AZURE_CREDENTIALS`
4. Value: JSON Output von oben einfügen
5. "Add secret" klicken

### Schritt 5: Infrastructure deployen
```bash
# In Projekt-Root wechseln
cd /Users/doho/Projects/Skillswap

# Deployment-Script ausführen
chmod +x azure-deploy/deploy-azure.sh
./azure-deploy/deploy-azure.sh

# Oder manuell mit Bicep:
az deployment group create \
    --resource-group skillswap-rg \
    --template-file azure-deploy/bicep/main.bicep \
    --parameters environmentName=staging
```

---

## 🔧 Infrastruktur-Komponenten

### Deployed Services

| Service | Typ | Zweck | Kosten/Monat |
|---------|-----|-------|--------------|
| **Container Registry** | Basic | Docker Images speichern | $5 |
| **PostgreSQL** | Flexible Server B1ms | Datenbank für alle Services | $12 |
| **Redis Cache** | Basic C0 | Session Cache, Temp Data | $15 |
| **Service Bus** | Basic | Message Queue (statt RabbitMQ) | $10 |
| **Container Apps Environment** | - | Hosting für alle Services | - |
| **Log Analytics** | Pay-per-GB | Logging & Monitoring | $2 |
| **Container Apps (8x)** | Consumption | Microservices + Frontend | ~$15 |

### Container Apps Details

1. **Gateway** (Port 8080)
   - Öffentlich erreichbar
   - Routing zu internen Services
   - CORS handling

2. **UserService** (Port 5001)
   - Intern erreichbar
   - JWT Authentication
   - User Management

3. **SkillService** (Port 5002)
   - Skill CRUD Operations
   - Kategorie-Management

4. **MatchmakingService** (Port 5003)
   - Matching-Algorithmus
   - Verbindungs-Management

5. **AppointmentService** (Port 5004)
   - Termin-Verwaltung
   - Kalender-Integration

6. **NotificationService** (Port 5005)
   - Email/Push Notifications
   - Event-basierte Benachrichtigungen

7. **VideocallService** (Port 5006)
   - WebRTC Signaling
   - Call-Management

8. **Frontend** (Port 3000)
   - React SPA
   - Öffentlich erreichbar

---

## 📦 Deployment-Prozess

### Option 1: Automatisch via GitHub Actions

1. **Code pushen zu main branch:**
```bash
git add .
git commit -m "feat: deploy to azure"
git push origin main
```

2. **GitHub Actions triggered automatisch:**
   - Baut alle Docker Images
   - Pushed zu Azure Container Registry
   - Updated Container Apps

3. **Deployment überwachen:**
   - GitHub: Actions Tab → Workflow anschauen
   - Azure Portal: Container Apps → Revision Management

### Option 2: Manuelles Deployment

```bash
# 1. Docker Images bauen und pushen
ACR_NAME=skillswapstaginacr

# Login zu Azure Container Registry
az acr login --name $ACR_NAME

# Einzelnen Service bauen und pushen
az acr build \
    --registry $ACR_NAME \
    --image gateway:latest \
    --file src/services/Gateway/Dockerfile .

# 2. Container App updaten
az containerapp update \
    --name gateway \
    --resource-group skillswap-rg \
    --image $ACR_NAME.azurecr.io/gateway:latest

# 3. Status prüfen
az containerapp show \
    --name gateway \
    --resource-group skillswap-rg \
    --query "properties.provisioningState"
```

---

## 🔄 CI/CD mit GitHub Actions

### Workflow-Datei: `.github/workflows/azure-deploy.yml`

Der Workflow macht folgendes:

1. **Trigger:** Bei Push auf `main` branch
2. **Build:** Alle Services werden als Docker Images gebaut
3. **Push:** Images werden zu Azure Container Registry gepusht
4. **Deploy:** Container Apps werden mit neuen Images aktualisiert

### Workflow manuell triggern:
1. GitHub → Actions Tab
2. "Deploy to Azure" workflow wählen
3. "Run workflow" → "Run workflow" klicken

### Deployment-Status prüfen:
```bash
# Alle Container Apps auflisten
az containerapp list \
    --resource-group skillswap-rg \
    --output table

# Spezifische App-Details
az containerapp show \
    --name gateway \
    --resource-group skillswap-rg \
    --query "{Status:properties.provisioningState, URL:properties.configuration.ingress.fqdn}"

# Logs anschauen
az containerapp logs show \
    --name gateway \
    --resource-group skillswap-rg \
    --follow
```

---

## 💰 Kosten-Übersicht

### Free Tier (Erste 12 Monate)
- **$200 Credit** für 30 Tage (alles abgedeckt)
- **Kostenlos für 12 Monate:**
  - 750 Stunden B1S VM
  - 5 GB Blob Storage  
  - 250 GB SQL Database Storage
  - 1 Million Requests

### Nach Free Tier - Geschätzte Kosten

| Umgebung | Services | Kosten/Monat |
|----------|----------|--------------|
| **Development** | Nur wenn aktiv (scale to zero) | ~$10-15 |
| **Staging** | Immer an, minimale Resources | ~$30-40 |
| **Production** | Höhere Specs, Redundanz | ~$100-150 |

### Kosten-Optimierung Tipps:
1. **Scale to Zero:** Container Apps skalieren auf 0 wenn nicht genutzt
2. **Dev/Test Subscription:** 50% Rabatt auf viele Services
3. **Reserved Instances:** 1-3 Jahre Commitment = bis zu 72% günstiger
4. **Budget Alerts:** Setze Alerts bei z.B. $25, $50
5. **Auto-Shutdown:** Nicht-kritische Services nachts ausschalten

### Budget Alert einrichten:
```bash
az consumption budget create \
    --amount 50 \
    --budget-name SkillswapMonthlyBudget \
    --category Cost \
    --time-grain Monthly \
    --start-date 2024-01-01 \
    --end-date 2024-12-31 \
    --resource-group skillswap-rg
```

---

## 📊 Monitoring & Debugging

### Azure Portal Dashboard
1. [Azure Portal](https://portal.azure.com) öffnen
2. Resource Group "skillswap-rg" suchen
3. Übersicht aller Services

### Application Insights (Automatisch integriert)
```bash
# Performance Metriken anzeigen
az monitor app-insights metrics list \
    --app skillswap-insights \
    --resource-group skillswap-rg

# Live Logs streamen
az monitor app-insights live-stream \
    --app skillswap-insights \
    --resource-group skillswap-rg
```

### Container Apps Logs
```bash
# Logs für spezifischen Service
az containerapp logs show \
    --name gateway \
    --resource-group skillswap-rg \
    --follow

# Alle Revision auflisten (Deployment History)
az containerapp revision list \
    --name gateway \
    --resource-group skillswap-rg \
    --output table
```

### Health Checks
```bash
# Gateway Health Check
curl https://gateway-xxxxx.azurecontainerapps.io/health

# Service Status prüfen
for app in gateway userservice skillservice; do
    echo "Checking $app..."
    az containerapp show \
        --name $app \
        --resource-group skillswap-rg \
        --query "properties.runningStatus" \
        --output tsv
done
```

---

## 🔧 Häufige Probleme & Lösungen

### Problem 1: "Container App kann nicht auf PostgreSQL zugreifen"
**Lösung:**
```bash
# Firewall-Regel für Azure Services hinzufügen
az postgres flexible-server firewall-rule create \
    --resource-group skillswap-rg \
    --name skillswap-staging-postgres \
    --rule-name AllowAzureServices \
    --start-ip-address 0.0.0.0 \
    --end-ip-address 0.0.0.0
```

### Problem 2: "Service Bus Connection Failed"
**Lösung:**
```bash
# Connection String abrufen
az servicebus namespace authorization-rule keys list \
    --resource-group skillswap-rg \
    --namespace-name skillswap-staging-bus \
    --name RootManageSharedAccessKey \
    --query primaryConnectionString \
    --output tsv
```

### Problem 3: "Container Image Pull Failed"
**Lösung:**
```bash
# ACR Credentials prüfen
az acr credential show \
    --name skillswapstaginacr \
    --resource-group skillswap-rg

# Container App Registry-Credentials updaten
az containerapp registry set \
    --name gateway \
    --resource-group skillswap-rg \
    --server skillswapstaginacr.azurecr.io \
    --username <username> \
    --password <password>
```

### Problem 4: "GitHub Actions failed"
**Lösung:**
1. Prüfe AZURE_CREDENTIALS Secret
2. Prüfe Service Principal Permissions:
```bash
az role assignment list \
    --assignee <CLIENT_ID> \
    --resource-group skillswap-rg
```

### Problem 5: "Zu hohe Kosten"
**Lösung:**
```bash
# Aktuelle Kosten prüfen
az consumption usage list \
    --start-date 2024-01-01 \
    --end-date 2024-01-31 \
    --resource-group skillswap-rg

# Services auf minimum skalieren
az containerapp update \
    --name gateway \
    --resource-group skillswap-rg \
    --min-replicas 0 \
    --max-replicas 2
```

---

## 🚀 Nächste Schritte

### Jetzt (MVP/Staging):
1. ✅ Azure Account erstellen
2. ✅ Infrastructure mit Bicep deployen
3. ✅ GitHub Actions einrichten
4. ✅ Erste Services deployen
5. ⏳ Monitoring einrichten
6. ⏳ Custom Domain hinzufügen

### Später (Production):
1. ⏸️ SSL-Zertifikate konfigurieren
2. ⏸️ Backup-Strategie implementieren
3. ⏸️ Disaster Recovery Plan
4. ⏸️ Multi-Region Deployment
5. ⏸️ Azure Front Door für Global CDN
6. ⏸️ Advanced Security (WAF, DDoS Protection)

---

## 📚 Wichtige Links

- [Azure Portal](https://portal.azure.com)
- [Azure Container Apps Docs](https://learn.microsoft.com/azure/container-apps/)
- [Bicep Documentation](https://learn.microsoft.com/azure/azure-resource-manager/bicep/)
- [Azure CLI Reference](https://learn.microsoft.com/cli/azure/)
- [Azure Pricing Calculator](https://azure.microsoft.com/pricing/calculator/)
- [Azure Free Account](https://azure.microsoft.com/free/)

---

## 📝 Notizen

### Umgebungs-Variablen für Services:
```env
# Alle Services
ASPNETCORE_ENVIRONMENT=Staging
ASPNETCORE_URLS=http://+:5000

# Database
ConnectionStrings__DefaultConnection=Host=skillswap-staging-postgres.postgres.database.azure.com;Database=skillswap;Username=skillswapadmin;Password=XXX

# Redis
Redis__ConnectionString=skillswap-staging-redis.redis.cache.windows.net:6379,password=XXX

# Service Bus (statt RabbitMQ)
ServiceBus__ConnectionString=Endpoint=sb://skillswap-staging-bus.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=XXX

# Frontend
REACT_APP_API_URL=https://gateway-xxxxx.azurecontainerapps.io
```

### Cleanup (Alles löschen):
```bash
# VORSICHT: Löscht ALLE Resourcen!
az group delete \
    --name skillswap-rg \
    --yes \
    --no-wait
```

---

**Stand:** Januar 2024
**Autor:** Skillswap Team
**Status:** Ready for Deployment 🚀