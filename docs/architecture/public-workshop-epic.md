# Public Workshop Feature - Separates Epic

> **Status**: OUT OF SCOPE fuer MVP
> **Grund**: Technische Komplexitaet (SFU-Architektur erforderlich)
> **Erstellt**: 2024-12-30

## Warum aus MVP ausgelagert?

### 1. Technische Komplexitaet

Video-Calls mit 100+ Usern erfordern eine komplett andere Architektur:

| Aspekt | Aktuelle Implementierung | Public Workshop Anforderung |
|--------|--------------------------|------------------------------|
| Architektur | Peer-to-Peer (WebRTC) | SFU (Selective Forwarding Unit) |
| Max Teilnehmer | 2-4 User | 100+ User |
| Server-Last | Minimal (nur Signaling) | Hoch (Media Routing) |
| Infrastruktur | Bestehend | Neue Server noetig |

**Erforderliche Technologien**:
- SFU-Server: Janus, Jitsi, oder mediasoup
- Media Server fuer Video-Routing
- Lastverteilung fuer hohe Teilnehmerzahlen

### 2. Scope-Risiko

Wuerde MVP-Timeline gefaehrden:

| Komponente | Geschaetzter Aufwand |
|------------|----------------------|
| SFU-Server Setup & Integration | 2-4 Wochen |
| Video-Grid mit Pagination | 1-2 Wochen |
| Teilnehmer-Management UI | 1 Woche |
| Host-Controls (Mute/Kick/etc.) | 1 Woche |
| Testing & Stabilisierung | 1-2 Wochen |
| **Gesamt** | **6-10 Wochen** |

### 3. Unabhaengigkeit

Das Feature kann nach MVP ohne Breaking Changes hinzugefuegt werden:
- Neues Entity-Modell (PublicWorkshop, WorkshopParticipant)
- Separate API-Endpoints
- Eigene Video-Komponenten
- Keine Aenderungen an bestehendem Skill/Matchmaking-Flow noetig

---

## Spaetere Implementierung - Anforderungen

### Funktionale Anforderungen

#### Workshop-Erstellung (Host)
- Titel und Beschreibung
- Category und ProficiencyLevel (wie bei Skills)
- **Exakter Zeitpunkt** (keine PreferredDays/Times - Workshop ist einmalig!)
- Dauer in Minuten
- Mindestanzahl Teilnehmer (z.B. min 5)
- Maximalanzahl Teilnehmer (z.B. max 100)
- Workshop-Status: draft, published, cancelled, live, completed

#### Teilnahmeanfrage (Participant)
- **Kein MatchRequest** - stattdessen Teilnahmeanfrage
- Motivation-Text: "Warum moechtest du teilnehmen?"
- Anfrage-Status: pending, approved, rejected
- Host kann Teilnehmer manuell genehmigen/ablehnen

#### Workshop-Durchfuehrung
- Host ist immer Initiator (kein Peer-to-Peer-Match)
- Mindestanzahl muss erreicht sein fuer Start
- Host kann trotzdem starten wenn Mindestanzahl nicht erreicht
- Host kann Workshop absagen

### Technische Anforderungen

#### SFU-Server (empfohlen: Jitsi)

**Warum Jitsi?**
- Open Source (Apache 2.0)
- Erprobt (Millionen von Nutzern)
- Gute Dokumentation
- Self-Hosting moeglich
- Skalierbar

**Alternativen**:
- Janus (mehr Kontrolle, komplexer)
- mediasoup (Node.js-basiert, flexibel)
- Twilio (SaaS, einfacher aber teurer)

#### Video-Grid Komponente

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    HOST (Grosser Bildschirm)                │
│                                                             │
│                    Screen-Share / Kamera                    │
│                                                             │
├───────────┬───────────┬───────────┬───────────┬─────────────┤
│ User 1    │ User 2    │ User 3    │ User 4    │ +96 more    │
│ [Avatar]  │ [Avatar]  │ [Avatar]  │ [Avatar]  │ [Pagination]│
└───────────┴───────────┴───────────┴───────────┴─────────────┘
```

**Features**:
- Host-View immer prominent
- Thumbnail-Grid fuer Teilnehmer
- Pagination bei vielen Teilnehmern (wie MS Teams)
- Active Speaker Highlighting
- Mute-Status-Anzeige

#### Host-Controls
- Mute/Unmute alle Teilnehmer
- Einzelne Teilnehmer stummschalten
- Teilnehmer entfernen (Kick)
- Screen-Sharing
- Chat-Integration (ThreadId)
- Aufzeichnung (optional)

### Datenmodell

#### PublicWorkshop Entity

```csharp
public class PublicWorkshop : Entity
{
    // Identifikation
    public Guid Id { get; private set; }
    public string HostUserId { get; private set; }

    // Inhalt
    public string Title { get; private set; }
    public string Description { get; private set; }
    public Guid CategoryId { get; private set; }
    public Guid ProficiencyLevelId { get; private set; }

    // Zeitplanung (EXAKT, nicht Preferences!)
    public DateTime ScheduledAt { get; private set; }
    public int DurationMinutes { get; private set; }

    // Teilnehmer-Limits
    public int MinParticipants { get; private set; }
    public int MaxParticipants { get; private set; } = 100;

    // Status
    public WorkshopStatus Status { get; private set; }
    public DateTime? StartedAt { get; private set; }
    public DateTime? CompletedAt { get; private set; }
    public DateTime? CancelledAt { get; private set; }
    public string? CancellationReason { get; private set; }

    // Navigation
    public ICollection<WorkshopParticipant> Participants { get; private set; }

    // Video-Call Referenz (wenn live)
    public Guid? VideoCallSessionId { get; private set; }
}

public enum WorkshopStatus
{
    Draft,      // Entwurf, noch nicht oeffentlich
    Published,  // Veroeffentlicht, Anmeldung moeglich
    Cancelled,  // Abgesagt
    Live,       // Gerade live
    Completed   // Abgeschlossen
}
```

#### WorkshopParticipant Entity

```csharp
public class WorkshopParticipant : Entity
{
    public Guid Id { get; private set; }
    public Guid WorkshopId { get; private set; }
    public string UserId { get; private set; }

    // Bewerbung
    public string Motivation { get; private set; }
    public DateTime AppliedAt { get; private set; }

    // Status
    public ParticipantStatus Status { get; private set; }
    public DateTime? ApprovedAt { get; private set; }
    public DateTime? RejectedAt { get; private set; }
    public string? RejectionReason { get; private set; }

    // Teilnahme
    public bool HasJoined { get; private set; }
    public DateTime? JoinedAt { get; private set; }
    public DateTime? LeftAt { get; private set; }

    // Navigation
    public PublicWorkshop Workshop { get; private set; }
}

public enum ParticipantStatus
{
    Pending,    // Warten auf Genehmigung
    Approved,   // Genehmigt
    Rejected,   // Abgelehnt
    Waitlist    // Auf Warteliste (wenn Max erreicht)
}
```

### API-Endpoints

```
POST   /api/workshops                    # Workshop erstellen
GET    /api/workshops                    # Workshops suchen/filtern
GET    /api/workshops/{id}               # Workshop-Details
PUT    /api/workshops/{id}               # Workshop bearbeiten
DELETE /api/workshops/{id}               # Workshop loeschen
POST   /api/workshops/{id}/publish       # Veroeffentlichen
POST   /api/workshops/{id}/cancel        # Absagen
POST   /api/workshops/{id}/start         # Live starten

POST   /api/workshops/{id}/apply         # Teilnahme beantragen
GET    /api/workshops/{id}/participants  # Teilnehmer-Liste
POST   /api/workshops/{id}/participants/{userId}/approve  # Genehmigen
POST   /api/workshops/{id}/participants/{userId}/reject   # Ablehnen
DELETE /api/workshops/{id}/participants/{userId}          # Entfernen
```

### Frontend-Komponenten

```
src/client/src/features/workshops/
├── components/
│   ├── WorkshopForm.tsx              # Workshop erstellen/bearbeiten
│   ├── WorkshopCard.tsx              # Workshop-Karte in Liste
│   ├── WorkshopDetailView.tsx        # Detailansicht
│   ├── WorkshopApplicationForm.tsx   # Teilnahmeanfrage mit Motivation
│   ├── WorkshopParticipantList.tsx   # Teilnehmer verwalten (Host)
│   ├── WorkshopVideoGrid.tsx         # Video-Grid mit Pagination
│   └── WorkshopHostControls.tsx      # Host-Steuerung
├── pages/
│   ├── WorkshopsPage.tsx             # Workshop-Uebersicht
│   ├── WorkshopDetailPage.tsx        # Detail + Anmeldung
│   └── WorkshopLivePage.tsx          # Live-Workshop-Ansicht
├── hooks/
│   ├── useWorkshop.ts
│   └── useWorkshopVideo.ts
├── services/
│   └── workshopService.ts
├── types/
│   └── Workshop.ts
└── schemas/
    └── workshop.ts
```

---

## Implementierungs-Roadmap (nach MVP)

### Phase 1: Grundlagen (2-3 Wochen)
- [ ] PublicWorkshop + WorkshopParticipant Entities
- [ ] CRUD Commands/Queries
- [ ] API-Endpoints
- [ ] Frontend: WorkshopForm, WorkshopCard, WorkshopDetailView

### Phase 2: Teilnehmer-Management (1-2 Wochen)
- [ ] WorkshopApplicationForm mit Motivation
- [ ] Genehmigung/Ablehnung durch Host
- [ ] Warteliste-Logik
- [ ] E-Mail-Benachrichtigungen

### Phase 3: SFU-Integration (3-4 Wochen)
- [ ] Jitsi/Janus Server aufsetzen
- [ ] Integration mit bestehendem VideocallService
- [ ] WorkshopVideoGrid Komponente
- [ ] Pagination fuer Teilnehmer-Thumbnails

### Phase 4: Host-Controls (1-2 Wochen)
- [ ] Mute/Unmute Controls
- [ ] Teilnehmer entfernen
- [ ] Screen-Sharing
- [ ] Chat-Integration

### Phase 5: Polish (1 Woche)
- [ ] Testing mit 50+ simulierten Usern
- [ ] Performance-Optimierung
- [ ] UX-Verbesserungen
- [ ] Dokumentation

---

## Abhaengigkeiten

### Bestehende Infrastruktur (wiederverwendbar)
- User-Authentifizierung
- Category/ProficiencyLevel System
- Notification-System
- Chat-Integration (ThreadId)

### Neue Infrastruktur (erforderlich)
- SFU-Server (Jitsi empfohlen)
- Evtl. separater Media-Server
- Erweiterte Video-Komponenten

---

## Risiken & Mitigationen

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|-------------------|--------|------------|
| SFU-Integration komplexer als erwartet | Mittel | Hoch | Jitsi-as-a-Service als Fallback |
| Performance-Probleme bei 100 Usern | Mittel | Hoch | Fruehe Lasttests, evtl. User-Limit senken |
| Browser-Kompatibilitaet | Niedrig | Mittel | Nur moderne Browser unterstuetzen |

---

## Entscheidungspunkte fuer spaeter

1. **SFU-Wahl**: Jitsi (empfohlen) vs. Janus vs. mediasoup vs. SaaS
2. **Max Teilnehmer**: 100 initial, spaeter erweiterbar?
3. **Monetarisierung**: Kostenpflichtige Workshops moeglich?
4. **Aufzeichnung**: Workshops aufzeichnen und spaeter ansehen?
5. **Q&A-Feature**: Fragen-Queue fuer Teilnehmer?

---

*Dieses Dokument wird bei Beginn der Public Workshop Implementierung aktualisiert.*
