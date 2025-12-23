# Oracle Cloud Infrastructure (OCI) Deployment Guide

## Übersicht

Skillswap wird auf Oracle Cloud Infrastructure (OCI) gehostet. Diese Dokumentation beschreibt die Infrastruktur und den Deployment-Prozess.

## Warum Oracle Cloud?

| Aspekt | Oracle Cloud | Azure |
|--------|--------------|-------|
| **Free Tier** | Dauerhaft: 4 OCPUs, 24GB RAM | Begrenzt: 12 Monate |
| **Compute Kosten** | ~50% günstiger | Basis |
| **Egress** | 10TB/Monat gratis | Ab GB 1 kostenpflichtig |
| **Kubernetes** | Control Plane kostenlos | Kostenpflichtig |

## Architektur

```
┌─────────────────────────────────────────────────────────────┐
│                    Oracle Cloud (OCI)                        │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    VCN (10.0.0.0/16)                 │   │
│  │                                                      │   │
│  │  ┌──────────────────┐   ┌──────────────────────┐   │   │
│  │  │ Public Subnet    │   │ Private Subnet       │   │   │
│  │  │ (10.0.1.0/24)    │   │ (10.0.2.0/24)        │   │   │
│  │  │                  │   │                       │   │   │
│  │  │  ┌────────────┐  │   │  ┌────────────────┐  │   │   │
│  │  │  │ Frontend   │  │   │  │ PostgreSQL     │  │   │   │
│  │  │  │ :80/:443   │  │   │  │ :5432          │  │   │   │
│  │  │  └────────────┘  │   │  └────────────────┘  │   │   │
│  │  │                  │   │                       │   │   │
│  │  │  ┌────────────┐  │   │  ┌────────────────┐  │   │   │
│  │  │  │ Gateway    │  │   │  │ Redis          │  │   │   │
│  │  │  │ :8080      │  │   │  │ :6379          │  │   │   │
│  │  │  └────────────┘  │   │  └────────────────┘  │   │   │
│  │  │                  │   │                       │   │   │
│  │  │  ┌────────────┐  │   │  ┌────────────────┐  │   │   │
│  │  │  │ ARM VM     │  │   │  │ RabbitMQ       │  │   │   │
│  │  │  │ (Free Tier)│  │   │  │ :5672          │  │   │   │
│  │  │  └────────────┘  │   │  └────────────────┘  │   │   │
│  │  └──────────────────┘   └──────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Infrastruktur-Komponenten

### Free Tier Ressourcen (dauerhaft kostenlos)

| Ressource | Spezifikation | Nutzung |
|-----------|---------------|---------|
| ARM VM (A1.Flex) | 4 OCPUs, 24GB RAM | Alle Services via Docker |
| Boot Volume | 200GB | OS + Docker Images |
| Object Storage | 20GB | Backups, Assets |
| Egress | 10TB/Monat | API Traffic |

### Services auf der VM

Alle Services laufen als Docker Container auf einer einzelnen ARM VM:

```
skillswap-vm (ARM A1.Flex)
├── Infrastructure
│   ├── postgres:15-alpine
│   ├── redis:7-alpine
│   └── rabbitmq:3-management
│
├── Application
│   ├── gateway:latest
│   ├── userservice:latest
│   ├── skillservice:latest
│   ├── matchmakingservice:latest
│   ├── appointmentservice:latest
│   ├── notificationservice:latest
│   ├── chatservice:latest
│   ├── videocallservice:latest
│   └── frontend:latest
│
└── Management
    └── watchtower (Auto-Updates)
```

## Deployment

### Voraussetzungen

1. **OCI Account** mit Free Tier
2. **OCI CLI** konfiguriert (`~/.oci/config`)
3. **Terraform** >= 1.0 installiert
4. **SSH Key** für VM-Zugang

### OCI Account Setup

```bash
# 1. OCI CLI installieren
brew install oci-cli  # macOS
# oder: pip install oci-cli

# 2. OCI CLI konfigurieren
oci setup config

# 3. API Key generieren und hochladen
# Gehe zu: OCI Console → Profile → API Keys → Add API Key
```

### Terraform Deployment

```bash
# 1. In das Terraform-Verzeichnis wechseln
cd infrastructure/oracle

# 2. Variablen-Datei erstellen
cp terraform.tfvars.example terraform.tfvars

# 3. terraform.tfvars bearbeiten mit deinen Werten
vim terraform.tfvars

# 4. Terraform initialisieren
terraform init

# 5. Plan prüfen
terraform plan

# 6. Infrastruktur deployen
terraform apply
```

### Docker Compose Deployment

Nach dem Terraform-Deployment:

```bash
# 1. SSH zur VM
ssh opc@<VM_PUBLIC_IP>

# 2. Ins App-Verzeichnis wechseln
cd /opt/skillswap

# 3. .env Datei erstellen
cat > .env << 'EOF'
ENVIRONMENT=staging
REGISTRY=fra.ocir.io/your-namespace/skillswap
IMAGE_TAG=latest

# Database
POSTGRES_PASSWORD=your-secure-password
POSTGRES_CONNECTION=Host=postgres;Database=skillswap;Username=skillswap;Password=your-secure-password

# Redis
REDIS_CONNECTION=redis:6379

# RabbitMQ
RABBITMQ_PASSWORD=your-rabbitmq-password
RABBITMQ_CONNECTION=amqp://skillswap:your-rabbitmq-password@rabbitmq:5672

# Auth
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters
SUPERADMIN_PASSWORD=your-admin-password
EOF

# 4. Docker Compose Datei kopieren
# (wird von Terraform erstellt oder manuell kopieren)

# 5. Services starten
docker compose up -d

# 6. Status prüfen
docker compose ps
docker compose logs -f
```

## Container Registry (OCIR)

### Registry Setup

```bash
# 1. Auth Token erstellen
# OCI Console → Profile → Auth Tokens → Generate Token

# 2. Docker Login
docker login fra.ocir.io
# Username: <tenancy-namespace>/<username>
# Password: <auth-token>

# 3. Image taggen
docker tag skillswap/gateway:latest fra.ocir.io/<namespace>/skillswap/gateway:latest

# 4. Image pushen
docker push fra.ocir.io/<namespace>/skillswap/gateway:latest
```

### Registry URL Format

```
<region>.ocir.io/<tenancy-namespace>/<repo-name>/<image-name>:<tag>

Beispiel:
fra.ocir.io/mytenancy/skillswap/gateway:v1.0.0
```

## Monitoring & Logs

### Docker Logs

```bash
# Alle Services
docker compose logs -f

# Einzelner Service
docker compose logs -f gateway

# Letzte 100 Zeilen
docker compose logs --tail=100 gateway
```

### System Monitoring

```bash
# Ressourcen-Nutzung
htop

# Docker Stats
docker stats

# Disk Usage
df -h

# Network
netstat -tulpn
```

## Backup & Recovery

### Datenbank Backup

```bash
# Backup erstellen
docker compose exec postgres pg_dump -U skillswap skillswap > backup_$(date +%Y%m%d).sql

# Backup wiederherstellen
docker compose exec -T postgres psql -U skillswap skillswap < backup_20241223.sql
```

### Volume Backup

```bash
# Volumes auflisten
docker volume ls

# Volume backup
docker run --rm -v skillswap_postgres_data:/data -v $(pwd):/backup alpine tar cvf /backup/postgres_data.tar /data
```

## Troubleshooting

### Container startet nicht

```bash
# Logs prüfen
docker compose logs <service-name>

# Container Status
docker compose ps

# Container neustarten
docker compose restart <service-name>

# Container neu erstellen
docker compose up -d --force-recreate <service-name>
```

### Netzwerk-Probleme

```bash
# Firewall prüfen
sudo firewall-cmd --list-all

# Port öffnen
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --reload

# Docker Network prüfen
docker network ls
docker network inspect skillswap-network
```

### Speicher voll

```bash
# Docker Cleanup
docker system prune -af
docker volume prune -f

# Alte Images löschen
docker image prune -af
```

## Kosten-Übersicht

### Free Tier (empfohlen für MVP)

| Ressource | Kosten |
|-----------|--------|
| ARM VM (4 OCPU, 24GB) | $0 |
| Boot Volume (200GB) | $0 |
| Object Storage (20GB) | $0 |
| Egress (10TB) | $0 |
| **Gesamt** | **$0/Monat** |

### Nach Free Tier

| Ressource | Kosten |
|-----------|--------|
| ARM VM (4 OCPU, 24GB) | ~$30/Monat |
| Additional Storage | ~$0.025/GB |
| Managed PostgreSQL | ~$25/Monat |
| **Gesamt** | **~$55-60/Monat** |

## Migration zu anderen Clouds

Da Skillswap komplett in Docker-Containern läuft, ist eine Migration einfach:

### Zu Azure

```bash
# 1. Bicep-Templates reaktivieren (azure-deploy/bicep/)
# 2. Azure CLI konfigurieren
# 3. Images zu ACR pushen
# 4. Container Apps deployen
```

### Zu AWS

```bash
# 1. ECR Repository erstellen
# 2. Images zu ECR pushen
# 3. ECS/Fargate Task Definitions erstellen
# 4. Service deployen
```

### Zu Kubernetes (OKE/AKS/EKS)

```bash
# 1. Helm Charts erstellen
# 2. Kubernetes Cluster provisionieren
# 3. Helm install
```

## Nächste Schritte

1. [ ] OCI Account erstellen/konfigurieren
2. [ ] SSH Keys generieren
3. [ ] Terraform deployen
4. [ ] Docker Images bauen und pushen
5. [ ] Services starten
6. [ ] DNS konfigurieren
7. [ ] SSL/TLS mit Let's Encrypt
