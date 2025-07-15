# SkillSwap Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- .NET 9 SDK (for local development)
- Node.js 18+ (for frontend development)

### 1. Environment Setup
```bash
# Clone the repository
git clone <repository-url>
cd Skillswap

# Copy environment variables
cp .env.example .env
# Edit .env with your specific values (JWT secrets, SMTP settings, etc.)
```

### 2. Start the Complete System
```bash
# Start all services with PostgreSQL
docker-compose up --build

# The system will be available at:
# - Frontend: http://localhost:3000
# - API Gateway: http://localhost:8080
# - Individual services: 5001-5006
```

### 3. Database Setup
The system automatically handles database setup:
- PostgreSQL starts first
- Services wait for PostgreSQL to be healthy
- EF Core migrations are applied automatically on service startup

## 📊 System Architecture

### Services
- **Gateway** (8080): API Gateway with authentication and routing
- **UserService** (5001): User management, authentication, profiles
- **SkillService** (5002): Skill management, search, categories
- **MatchmakingService** (5003): Intelligent skill matching
- **AppointmentService** (5004): Appointment scheduling
- **VideocallService** (5005): Video call coordination with SignalR
- **NotificationService** (5006): Multi-channel notifications

### Infrastructure
- **PostgreSQL** (5432): Primary database for all services
- **Redis** (6379): Caching and session storage
- **RabbitMQ** (5672/15672): Event bus for service communication

## 🧪 Testing

### Run Unit Tests
```bash
# Run all tests
dotnet test

# Run tests for specific service
dotnet test src/services/UserService.Tests/
```

### Run Integration Tests
```bash
# Integration tests use TestContainers for database isolation
dotnet test --filter "Category=Integration"
```

### Frontend Testing
```bash
cd src/client
npm test
```

## 🔧 Development Workflow

### Backend Development
```bash
# Build all services
dotnet build Skillswap.sln

# Run specific service locally
cd src/services/UserService
dotnet run

# Create new migration
dotnet ef migrations add <MigrationName> --project <ServiceName>
```

### Frontend Development
```bash
cd src/client
npm install
npm run dev  # Start development server
npm run build  # Build for production
```

## 📋 Health Checks

### System Health
```bash
# Check all services
curl http://localhost:8080/health

# Check individual services
curl http://localhost:5001/health/live  # UserService
curl http://localhost:5002/health/live  # SkillService
# ... etc for other services
```

### Database Health
```bash
# Check PostgreSQL
docker exec postgres pg_isready -U skillswap

# Check Redis
docker exec redis redis-cli ping

# Check RabbitMQ
curl http://localhost:15672/api/overview
```

## 🔐 Security Configuration

### JWT Configuration
Update `.env` file with secure values:
```bash
JWT_SECRET=your-super-secure-secret-key-here-min-32-characters
JWT_ISSUER=Skillswap
JWT_AUDIENCE=Skillswap
```

### Database Security
- Change default passwords in production
- Use connection string with SSL for production
- Configure database firewall rules

### SMTP Configuration
For email notifications:
```bash
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_USERNAME=your-email@domain.com
SMTP_PASSWORD=your-app-password
```

## 🐳 Production Deployment

### Environment Variables for Production
```bash
# Database
DATABASE_CONNECTION_STRING=Host=prod-db;Database=skillswap;Username=prod-user;Password=secure-password;

# Redis
REDIS_CONNECTION_STRING=prod-redis:6379

# RabbitMQ
RABBITMQ_HOST=prod-rabbitmq
```

### Kubernetes Deployment
```bash
# Apply all configurations
kubectl apply -f k8s/

# Check deployment status
kubectl get pods
kubectl get services
```

## 📈 Monitoring

### Application Metrics
- Health checks available at `/health/live` and `/health/ready`
- Structured logging with correlation IDs
- Performance metrics through custom behaviors

### Database Monitoring
- Connection pool monitoring
- Query performance tracking
- Migration status monitoring

## 🛠️ Troubleshooting

### Common Issues

#### Service Won't Start
1. Check if PostgreSQL is running: `docker ps | grep postgres`
2. Check service logs: `docker-compose logs <service-name>`
3. Verify environment variables: `docker-compose config`

#### Database Connection Issues
1. Check connection string format
2. Verify PostgreSQL health: `docker exec postgres pg_isready`
3. Check firewall/network issues

#### RabbitMQ Issues
1. Check RabbitMQ management UI: http://localhost:15672
2. Verify message queues are created
3. Check service bus configuration

### Log Analysis
```bash
# View all service logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f userservice

# Follow logs with correlation ID
docker-compose logs -f | grep "correlation-id"
```

## 📊 Performance Optimization

### Database Performance
- Ensure proper indexing on frequently queried columns
- Monitor connection pool usage
- Use read replicas for heavy read workloads

### Caching Strategy
- Redis caching is configured for CQRS queries
- Configure cache expiration policies
- Monitor cache hit rates

### Service Performance
- Enable response compression
- Configure rate limiting appropriately
- Monitor API response times

## 🔄 Backup and Recovery

### Database Backup
```bash
# Backup PostgreSQL
docker exec postgres pg_dump -U skillswap skillswap > backup.sql

# Restore PostgreSQL
docker exec -i postgres psql -U skillswap skillswap < backup.sql
```

### Configuration Backup
- Backup environment variables
- Backup SSL certificates
- Backup application configuration files

## 📞 Support

### Documentation
- API Documentation: http://localhost:8080/swagger
- Architecture Documentation: /docs/
- Development Guide: /CLAUDE.md

### Logging and Diagnostics
- Correlation IDs for request tracing
- Structured logging with Serilog
- Error tracking and alerting