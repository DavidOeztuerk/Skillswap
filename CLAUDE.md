# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Frontend (React + TypeScript)
```bash
# Navigate to frontend directory
cd src/client

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint
```

### Backend (.NET 9)
```bash
# Build entire solution
dotnet build Skillswap.sln

# Run a specific service (from root directory)
dotnet run --project src/services/UserService
dotnet run --project src/services/SkillService
dotnet run --project src/services/MatchmakingService
dotnet run --project src/services/AppointmentService
dotnet run --project src/services/VideocallService
dotnet run --project src/services/NotificationService
dotnet run --project src/services/Gateway

# Run tests
dotnet test src/services/UserService.Tests
```

### Docker Development
```bash
# Start all services with docker-compose
docker-compose up --build

# Start specific service
docker-compose up gateway userservice

# View logs
docker-compose logs -f [service-name]
```

## Architecture Overview

### Microservices Architecture
This is a skill-swapping platform built with a microservices architecture:

**Core Services:**
- **Gateway** (Port 8080): API Gateway using Ocelot for routing requests
- **UserService** (Port 5001): User authentication, registration, and profile management
- **SkillService** (Port 5002): Skill creation, categories, and proficiency management
- **MatchmakingService** (Port 5003): Skill matching and match request handling
- **AppointmentService** (Port 5004): Appointment scheduling and management
- **VideocallService** (Port 5005): WebRTC video call coordination using SignalR
- **NotificationService** (Port 5006): Email/SMS notifications and templates

**Frontend:**
- React 19 with TypeScript
- Vite for build tooling
- Material-UI for components
- Redux Toolkit for state management
- React Router for navigation

**Infrastructure:**
- RabbitMQ for event-driven communication
- Redis for caching and session storage
- Entity Framework Core with in-memory database (development)
- SignalR for real-time communication
- Docker for containerization

### Shared Libraries
- **CQRS**: Command Query Responsibility Segregation with MediatR
- **Events**: Event definitions for inter-service communication
- **Contracts**: API request/response contracts
- **Infrastructure**: Common middleware, logging, security
- **EventSourcing**: Event store implementation

### Key Patterns
- **CQRS with MediatR**: Commands and queries separated with pipeline behaviors
- **Event-Driven Architecture**: Services communicate via RabbitMQ events
- **Domain Events**: Domain-driven design with event sourcing capabilities
- **Pipeline Behaviors**: Logging, validation, performance monitoring, auditing

## Development Guidelines

### Backend Development
- Services use minimal APIs with .NET 9
- Entity Framework Core with DbContext per service
- MediatR for CQRS pattern implementation
- FluentValidation for request validation
- Serilog for structured logging
- Each service has its own database context

### Frontend Development
- Uses functional components with React hooks
- Redux Toolkit for state management with slices per feature
- Material-UI component library
- TypeScript for type safety
- Vite for fast development and building

### Testing
- Unit tests using xUnit for .NET services
- Tests located in `src/services/[ServiceName].Tests/`
- Frontend tests not yet implemented

### Event Communication
Services communicate through RabbitMQ events:
- MassTransit for message bus abstraction
- Event contracts defined in `src/shared/Events/`
- Each service can publish and consume relevant events

### Security
- JWT-based authentication
- CORS configured for frontend origin
- Security headers middleware
- Rate limiting capabilities
- User authorization with custom requirements

## Service Dependencies

### Environment Variables Required
```bash
JWT_SECRET=your-secret-key
JWT_ISSUER=Skillswap
JWT_AUDIENCE=Skillswap
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email
SMTP_PASSWORD=your-password
```

### Service Communication
- All external API calls go through the Gateway
- Internal service communication via RabbitMQ events
- Frontend communicates only with Gateway (port 8080)
- Real-time features use SignalR through VideocallService

## Common Development Tasks

### Adding a New Service
1. Create service directory in `src/services/`
2. Add service to `docker-compose.yml`
3. Add service to `Skillswap.sln`
4. Configure service in Gateway's `ocelot.json`
5. Add health checks and environment variables

### Adding New API Endpoints
1. Create request/response contracts in `src/shared/Contracts/`
2. Implement commands/queries in service's `Application/` folder
3. Add minimal API endpoints in service's `Program.cs`
4. Update Gateway routing in `ocelot.json` if needed

### Event-Driven Communication
1. Define events in `src/shared/Events/`
2. Create consumers in service's `Consumer/` folder
3. Publish events from command handlers
4. Configure MassTransit in service's `Program.cs`

### Frontend Feature Development
1. Create Redux slice in `src/features/`
2. Implement API service in `src/api/services/`
3. Create React components in `src/components/`
4. Add pages in `src/pages/`
5. Configure routing in `src/routes/Router.tsx`