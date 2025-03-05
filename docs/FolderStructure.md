/skillswap
├── /frontend # React + TypeScript Frontend
│ ├── /src
│ │ ├── /components # UI-Komponenten
│ │ │ ├── VideoCall.tsx # WebRTC Video-Call-Komponente
│ │ │ ├── MatchList.tsx # Zeigt gefundene Matches
│ │ │ ├── SkillForm.tsx # Formular für neue Skills
│ │ ├── /services
│ │ │ ├── api.ts # Axios API-Client
│ │ │ ├── signaling.ts # WebSocket-Client für WebRTC-Signaling
│ │ │ ├── auth.ts # Authentifizierungs-Logik
│ │ ├── /store
│ │ │ ├── authSlice.ts # Redux Toolkit für Auth
│ │ │ ├── callSlice.ts # Redux Toolkit für WebRTC Calls
│ │ │ ├── skillSlice.ts # Redux Toolkit für Skills
│ │ ├── App.tsx
│ │ ├── index.tsx
│ ├── package.json
│ ├── tsconfig.json
│ ├── vite.config.ts
│
├── /backend # .NET 9 Backend mit Minimal API
│ ├── /UserService # Authentifizierung & Nutzerverwaltung
│ │ ├── Program.cs # Minimal API für UserService
│ │ ├── DbContext.cs # EF Core DB-Kontext
│ │ ├── User.cs # User Model
│ │ ├── UserRepository.cs # User-Repository
│ │ ├── EventPublisher.cs # RabbitMQ Publisher für UserEvents
│ │ ├── EventConsumer.cs # RabbitMQ Consumer für UserEvents
│ │ ├── appsettings.json
│
│ ├── /SkillService # Verwaltung von Fähigkeiten & Gesuchen
│ │ ├── Program.cs
│ │ ├── DbContext.cs
│ │ ├── Skill.cs
│ │ ├── SkillRepository.cs
│ │ ├── EventPublisher.cs
│ │ ├── EventConsumer.cs
│ │ ├── appsettings.json
│
│ ├── /MatchmakingService # Matching von Nutzern
│ │ ├── Program.cs
│ │ ├── MatchmakingAlgorithm.cs
│ │ ├── EventPublisher.cs
│ │ ├── EventConsumer.cs
│ │ ├── appsettings.json
│
│ ├── /CalendarService # Terminverwaltung & Kalender-Sync
│ │ ├── Program.cs
│ │ ├── Calendar.cs
│ │ ├── CalendarRepository.cs
│ │ ├── GoogleCalendarSync.cs
│ │ ├── OutlookCalendarSync.cs
│ │ ├── EventPublisher.cs
│ │ ├── EventConsumer.cs
│ │ ├── appsettings.json
│
│ ├── /VideoCallService # WebRTC Call-Verwaltung
│ │ ├── Program.cs
│ │ ├── Call.cs
│ │ ├── CallRepository.cs
│ │ ├── EventPublisher.cs
│ │ ├── EventConsumer.cs
│ │ ├── appsettings.json
│
│ ├── /NotificationService # E-Mail & Push-Benachrichtigungen
│ │ ├── Program.cs
│ │ ├── EmailService.cs
│ │ ├── EventConsumer.cs
│ │ ├── appsettings.json
│
│ ├── /Shared # Gemeinsame Ressourcen
│ │ ├── /Contracts # Event-Contracts für MassTransit
│ │ │ ├── WebRtcEvents.cs
│ │ │ ├── UserEvents.cs
│ │ │ ├── MatchEvents.cs
│ │ ├── /Infrastructure # RabbitMQ, DB, Logging
│
├── /signaling-server # WebRTC Signaling Server (Node.js + RabbitMQ)
│ ├── index.ts # WebSocket-Handling für Signaling
│ ├── signalingHandler.ts # Verarbeitung von Signaling-Nachrichten
│ ├── rabbitmqService.ts # RabbitMQ-Publisher/Consumer
│ ├── package.json
│ ├── tsconfig.json
│
├── /deployment # Deployment-Konfigurationen
│ ├── docker-compose.yml # Startet alle Microservices mit Docker
│ ├── k8s # Kubernetes Deployment-Files
│ │ ├── user-service.yaml
│ │ ├── signaling-service.yaml
│ │ ├── rabbitmq.yaml
│
└── README.md # Projektdokumentation
