## **2️⃣ API Contracts & Events (abgeleitet aus den User Stories)**

### **📌 API Contracts (Frontend ↔ Backend Kommunikation)**

| **Request Name**         | **Response Name**                    | **Beschreibung**                  |
| ------------------------ | ------------------------------------ | --------------------------------- |
| `RegisterUserRequest`    | `RegisterUserResponse (inkl. Token)` | Registrierung eines neuen Nutzers |
| `LoginRequest`           | `LoginResponse (Token)`              | Anmeldung eines Nutzers           |
| `CreateSkillRequest`     | `CreateSkillResponse`                | Erstellung eines neuen Skills     |
| `FindMatchRequest`       | `FindMatchResponse`                  | Suche nach Skill-Partnern         |
| `ScheduleMeetingRequest` | `ScheduleMeetingResponse`            | Terminplanung für Skill-Tausch    |
| `CallRequest`            | `CallResponse`                       | WebRTC Video-Call starten         |
| `SendMessageRequest`     | `SendMessageResponse`                | Chat-Nachricht senden             |

### **📌 Events für Event-Driven Architecture (RabbitMQ)**

| **Event Name**          | **Publisher**        | **Subscriber**        | **Beschreibung**                           |
| ----------------------- | -------------------- | --------------------- | ------------------------------------------ |
| `UserRegisteredEvent`   | `UserService`        | `NotificationService` | Begrüßungs-E-Mail senden                   |
| `SkillCreatedEvent`     | `SkillService`       | `MatchmakingService`  | Startet Matching für neue Skills           |
| `MatchFoundEvent`       | `MatchmakingService` | `CalendarService`     | Erstellt automatisch einen Terminvorschlag |
| `MeetingScheduledEvent` | `CalendarService`    | `NotificationService` | Erinnerungs-Benachrichtigung senden        |
| `CallInitiatedEvent`    | `VideoCallService`   | `SignalingServer`     | Startet WebRTC Call                        |
| `CallAcceptedEvent`     | `SignalingServer`    | `VideoCallService`    | Peer-Verbindung aufbauen                   |
| `MessageSentEvent`      | `ChatService`        | `NotificationService` | Benachrichtigung für neue Nachricht        |

---

🔥 **Nächster Schritt:**
✅ Finalisieren der **API Contracts & Events in der Shared Library** 🚀
