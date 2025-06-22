# 🚀 SkillSwap - Vollständige API Dokumentation

## 📋 **Übersicht**

SkillSwap bietet eine umfassende REST API über ein zentrales Gateway auf **Port 8080**. Alle Anfragen werden über `http://localhost:8080/api` geleitet.

### **🔗 Base URL**

```
http://localhost:8080/api
```

### **🔐 Authentication**

Die meisten Endpoints erfordern JWT-Token im `Authorization` Header:

```
Authorization: Bearer {token}
```

---

## 👤 **UserService API**

### **Authentication Endpoints**

#### **POST** `/users/register`

**Beschreibung:** Registriert einen neuen Benutzer

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

#### **POST** `/users/login`

**Beschreibung:** Benutzer-Anmeldung

```json
{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

#### **POST** `/users/refresh-token`

**Beschreibung:** JWT Token erneuern

```json
{
  "refreshToken": "refresh_token_here"
}
```

#### **POST** `/users/verify-email`

**Beschreibung:** E-Mail-Adresse verifizieren

```json
{
  "token": "verification_token_here"
}
```

### **Password Management Endpoints**

#### **POST** `/users/request-password-reset`

**Beschreibung:** Passwort-Reset anfordern

```json
{
  "email": "john@example.com"
}
```

#### **POST** `/users/reset-password`

**Beschreibung:** Passwort zurücksetzen

```json
{
  "token": "reset_token_here",
  "newPassword": "NewSecurePassword123!"
}
```

#### **POST** `/users/change-password` 🔒

**Beschreibung:** Passwort ändern (authentifiziert)

```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!"
}
```

### **User Profile Endpoints**

#### **GET** `/users/profile` 🔒

**Beschreibung:** Eigenes Profil abrufen

#### **PUT** `/users/profile` 🔒

**Beschreibung:** Profil aktualisieren

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "bio": "Software Developer",
  "location": "Berlin, Germany",
  "phoneNumber": "+49 123 456789"
}
```

### **User Management Endpoints (Admin)**

#### **GET** `/users/search` 🔒👑

**Beschreibung:** Benutzer suchen (Admin)
**Query Parameters:**

- `searchTerm` (string): Suchbegriff
- `page` (int): Seitenzahl
- `pageSize` (int): Anzahl pro Seite

#### **GET** `/users/statistics` 🔒👑

**Beschreibung:** Benutzerstatistiken (Admin)

#### **GET** `/users/{userId}/activity` 🔒

**Beschreibung:** Benutzeraktivitäten abrufen

#### **GET** `/users/email-availability`

**Beschreibung:** E-Mail-Verfügbarkeit prüfen
**Query Parameters:**

- `email` (string): E-Mail-Adresse

#### **GET** `/users/{userId}/roles` 🔒

**Beschreibung:** Benutzerrollen abrufen

---

## 🎯 **SkillService API**

### **Core Skill Management**

#### **POST** `/skills` 🔒

**Beschreibung:** Neue Fähigkeit erstellen

```json
{
  "name": "React Development",
  "description": "Frontend development with React",
  "categoryId": "programming-category-id",
  "proficiencyLevelId": "advanced-level-id",
  "isOffering": true,
  "isRequesting": false,
  "tags": ["react", "frontend", "javascript"],
  "isRemote": true,
  "location": "Berlin"
}
```

#### **PUT** `/skills/{skillId}` 🔒

**Beschreibung:** Fähigkeit aktualisieren

#### **DELETE** `/skills/{skillId}` 🔒

**Beschreibung:** Fähigkeit löschen

#### **GET** `/skills`

**Beschreibung:** Fähigkeiten suchen
**Query Parameters:**

- `searchTerm` (string): Suchbegriff
- `categoryId` (string): Kategorie-Filter
- `proficiencyLevelId` (string): Level-Filter
- `isOffering` (bool): Nur Angebote
- `isRequesting` (bool): Nur Gesuche
- `isRemote` (bool): Remote-Filter
- `location` (string): Standort-Filter
- `tags` (array): Tag-Filter
- `minRating` (decimal): Mindestbewertung
- `sortBy` (string): Sortierung
- `page` (int): Seitenzahl
- `pageSize` (int): Anzahl pro Seite

#### **GET** `/skills/{skillId}`

**Beschreibung:** Fähigkeitsdetails abrufen
**Query Parameters:**

- `includeReviews` (bool): Bewertungen einschließen
- `includeEndorsements` (bool): Empfehlungen einschließen

#### **GET** `/users/{userId}/skills`

**Beschreibung:** Fähigkeiten eines Benutzers

#### **GET** `/my/skills` 🔒

**Beschreibung:** Eigene Fähigkeiten abrufen

### **Skill Interactions**

#### **POST** `/skills/{skillId}/rate` 🔒

**Beschreibung:** Fähigkeit bewerten

```json
{
  "rating": 5,
  "review": "Excellent teaching skills!",
  "isAnonymous": false
}
```

#### **POST** `/skills/{skillId}/endorse` 🔒

**Beschreibung:** Fähigkeit empfehlen

```json
{
  "message": "Highly recommended for React development"
}
```

### **Categories & Levels**

#### **GET** `/categories`

**Beschreibung:** Alle Kategorien abrufen

#### **POST** `/categories` 🔒👑

**Beschreibung:** Kategorie erstellen (Admin)

```json
{
  "name": "Programming",
  "description": "Software development skills",
  "iconName": "code",
  "color": "#007bff"
}
```

#### **PUT** `/categories/{categoryId}` 🔒👑

**Beschreibung:** Kategorie aktualisieren (Admin)

#### **GET** `/proficiency-levels`

**Beschreibung:** Alle Proficiency-Level abrufen

#### **POST** `/proficiency-levels` 🔒👑

**Beschreibung:** Proficiency-Level erstellen (Admin)

### **Analytics & Discovery**

#### **GET** `/skills/analytics/statistics`

**Beschreibung:** Fähigkeitsstatistiken

#### **GET** `/skills/analytics/popular-tags`

**Beschreibung:** Beliebte Tags

#### **GET** `/skills/recommendations` 🔒

**Beschreibung:** Personalisierte Fähigkeitsempfehlungen

---

## 🎯 **MatchmakingService API**

### **Matching Endpoints**

#### **POST** `/matches/find` 🔒

**Beschreibung:** Nach Matches suchen

```json
{
  "skillIds": ["skill-id-1", "skill-id-2"],
  "preferences": {
    "maxDistance": 50,
    "isRemoteOnly": false,
    "minRating": 4.0
  }
}
```

#### **GET** `/matches/{matchId}` 🔒

**Beschreibung:** Match-Details abrufen

#### **POST** `/matches/{matchId}/accept` 🔒

**Beschreibung:** Match akzeptieren

#### **POST** `/matches/{matchId}/reject` 🔒

**Beschreibung:** Match ablehnen

```json
{
  "reason": "Not available at the moment"
}
```

#### **GET** `/my/matches` 🔒

**Beschreibung:** Eigene Matches abrufen
**Query Parameters:**

- `status` (string): Match-Status Filter
- `page` (int): Seitenzahl
- `pageSize` (int): Anzahl pro Seite

#### **GET** `/matches/statistics`

**Beschreibung:** Matching-Statistiken

---

## 📅 **AppointmentService API**

### **Appointment Management**

#### **POST** `/appointments` 🔒

**Beschreibung:** Termin erstellen

```json
{
  "matchId": "match-id-here",
  "proposedStartTime": "2024-01-15T14:00:00Z",
  "proposedEndTime": "2024-01-15T15:00:00Z",
  "description": "React tutoring session",
  "isVirtual": true,
  "location": "Online via SkillSwap"
}
```

#### **POST** `/appointments/{appointmentId}/accept` 🔒

**Beschreibung:** Termin akzeptieren

#### **POST** `/appointments/{appointmentId}/cancel` 🔒

**Beschreibung:** Termin absagen

```json
{
  "reason": "Scheduling conflict"
}
```

#### **GET** `/appointments/{appointmentId}` 🔒

**Beschreibung:** Termindetails abrufen

#### **GET** `/my/appointments` 🔒

**Beschreibung:** Eigene Termine abrufen
**Query Parameters:**

- `status` (string): Status-Filter
- `startDate` (datetime): Start-Datum
- `endDate` (datetime): End-Datum
- `page` (int): Seitenzahl
- `pageSize` (int): Anzahl pro Seite

---

## 📹 **VideocallService API**

### **Video Call Management**

#### **POST** `/calls/create` 🔒

**Beschreibung:** Video-Call-Session erstellen

```json
{
  "appointmentId": "appointment-id-here",
  "maxParticipants": 2
}
```

#### **POST** `/calls/{sessionId}/join` 🔒

**Beschreibung:** Video-Call beitreten

#### **POST** `/calls/{sessionId}/leave` 🔒

**Beschreibung:** Video-Call verlassen

#### **POST** `/calls/{sessionId}/start` 🔒

**Beschreibung:** Video-Call starten

#### **POST** `/calls/{sessionId}/end` 🔒

**Beschreibung:** Video-Call beenden

```json
{
  "duration": 3600,
  "rating": 5,
  "feedback": "Great session!"
}
```

#### **GET** `/calls/{sessionId}` 🔒

**Beschreibung:** Call-Session-Details abrufen

#### **GET** `/my/calls` 🔒

**Beschreibung:** Eigene Call-Historie abrufen

#### **GET** `/calls/statistics`

**Beschreibung:** Call-Statistiken

### **WebRTC SignalR Hub**

**Endpoint:** `/videocall` (WebSocket)
**Beschreibung:** Real-time WebRTC Signaling für Video-Calls

---

## 🔔 **NotificationService API**

### **Notification Management**

#### **POST** `/notifications/send` 🔒

**Beschreibung:** Benachrichtigung senden

```json
{
  "recipientId": "user-id-here",
  "type": "Email",
  "templateName": "SkillMatchFound",
  "data": {
    "matcherName": "John Doe",
    "skillName": "React Development"
  },
  "priority": "High",
  "scheduledFor": "2024-01-15T10:00:00Z"
}
```

#### **POST** `/notifications/bulk` 🔒👑

**Beschreibung:** Bulk-Benachrichtigungen senden (Admin)

```json
{
  "recipientIds": ["user1", "user2", "user3"],
  "type": "Email",
  "templateName": "SystemAnnouncement",
  "data": {
    "title": "New Feature Announcement",
    "message": "We've added video calling!"
  }
}
```

#### **POST** `/notifications/{notificationId}/cancel` 🔒

**Beschreibung:** Benachrichtigung stornieren

#### **POST** `/notifications/{notificationId}/retry` 🔒

**Beschreibung:** Fehlgeschlagene Benachrichtigung wiederholen

#### **POST** `/notifications/{notificationId}/read` 🔒

**Beschreibung:** Benachrichtigung als gelesen markieren

### **User Preferences**

#### **GET** `/notifications/preferences` 🔒

**Beschreibung:** Benachrichtigungseinstellungen abrufen

#### **PUT** `/notifications/preferences` 🔒

**Beschreibung:** Benachrichtigungseinstellungen aktualisieren

```json
{
  "emailNotifications": true,
  "smsNotifications": false,
  "pushNotifications": true,
  "preferences": {
    "skillMatches": {
      "email": true,
      "push": true,
      "sms": false
    },
    "appointments": {
      "email": true,
      "push": true,
      "sms": true
    },
    "marketing": {
      "email": false,
      "push": false,
      "sms": false
    }
  },
  "quietHoursStart": "22:00",
  "quietHoursEnd": "08:00",
  "timezone": "Europe/Berlin"
}
```

### **Templates (Admin)**

#### **GET** `/notifications/templates` 🔒👑

**Beschreibung:** E-Mail-Templates abrufen (Admin)

#### **POST** `/notifications/templates` 🔒👑

**Beschreibung:** E-Mail-Template erstellen (Admin)

```json
{
  "name": "WelcomeEmail",
  "language": "en",
  "subject": "Welcome to SkillSwap!",
  "htmlContent": "<h1>Welcome {{FirstName}}!</h1>",
  "textContent": "Welcome {{FirstName}}!",
  "variables": ["FirstName", "LastName", "Email"]
}
```

#### **PUT** `/notifications/templates/{templateId}` 🔒👑

**Beschreibung:** E-Mail-Template aktualisieren (Admin)

### **Analytics (Admin)**

#### **GET** `/notifications/analytics/statistics` 🔒👑

**Beschreibung:** Benachrichtigungsstatistiken (Admin)

---

## 🏥 **Health Check Endpoints**

Alle Services bieten Health Check Endpoints:

#### **GET** `/health/ready`

**Beschreibung:** Readiness Check (Service ist bereit)

#### **GET** `/health/live`

**Beschreibung:** Liveness Check (Service läuft)

---

## 📊 **Response Formats**

### **Erfolgreiche Responses**

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2024-01-15T10:00:00Z",
  "correlationId": "abc-123-def"
}
```

### **Paginierte Responses**

```json
{
  "success": true,
  "data": {
    "items": [...],
    "totalCount": 100,
    "pageNumber": 1,
    "pageSize": 20,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPreviousPage": false
  },
  "timestamp": "2024-01-15T10:00:00Z",
  "correlationId": "abc-123-def"
}
```

### **Error Responses**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  },
  "timestamp": "2024-01-15T10:00:00Z",
  "correlationId": "abc-123-def"
}
```

---

## 🔐 **Authentication & Authorization**

### **JWT Token Structure**

```json
{
  "user_id": "user-uuid-here",
  "email": "john@example.com",
  "roles": ["User"],
  "permissions": ["skill:create", "skill:update", "appointment:create"],
  "iat": 1642234567,
  "exp": 1642238167,
  "iss": "SkillSwap",
  "aud": "SkillSwap"
}
```

### **Rollen & Berechtigungen**

- **User**: Standardbenutzer mit Grundfunktionen
- **Admin**: Administrator mit erweiterten Rechten
- **Moderator**: Moderator mit begrenzten Admin-Rechten

### **Rate Limiting**

- **Login**: 10 Versuche pro Minute
- **Registration**: 5 Versuche pro Minute
- **Password Reset**: 3 Versuche pro Stunde
- **Allgemein**: 1000 Requests pro Stunde pro Benutzer

---

## 🚀 **Getting Started**

1. **Gateway starten**: `http://localhost:8080`
2. **Benutzer registrieren**: `POST /api/users/register`
3. **Anmelden**: `POST /api/users/login`
4. **JWT Token verwenden**: `Authorization: Bearer {token}`
5. **API erkunden**: Swagger UI verfügbar auf den einzelnen Services

---

## 📚 **Zusätzliche Ressourcen**

- **Swagger Documentation**: Verfügbar auf jedem Service Port
- **WebSocket Connection**: VideocallService auf `/videocall`
- **Health Monitoring**: Alle Services bieten `/health/*` Endpoints
- **Request Tracing**: Alle Responses enthalten `correlationId`

**🎯 Legende:**

- 🔒 = Authentifizierung erforderlich
- 👑 = Admin-Berechtigung erforderlich
