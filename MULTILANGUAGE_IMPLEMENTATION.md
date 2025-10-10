# 🌍 Multi-Language Implementation Plan - Skillswap

> **Status**: 🔮 Geplant für spätere Phase
> **Priorität**: Medium (nach Core Features)
> **Geschätzte Dauer**: 3-4 Arbeitstage
> **Letzte Aktualisierung**: 01.10.2025

---

## 🎯 Ziel

Vollständige Internationalisierung (i18n) der Skillswap-Plattform mit Support für:
- 🇩🇪 **Deutsch** (DE)
- 🇬🇧 **Englisch** (EN)
- 🇫🇷 **Französisch** (FR)
- 🇵🇹 **Portugiesisch** (PT)

**Scope:**
- UI-Text & Labels
- Email-Templates
- Push-Notifications
- Backend-Fehlermeldungen
- Date/Time/Currency Formatting

---

## 🏗️ Architektur-Übersicht

### Language Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   MULTI-LANGUAGE ARCHITECTURE                   │
└─────────────────────────────────────────────────────────────────┘

USER PREFERENCE
    ↓
┌───────────────────────┐
│  User Profile         │
│  preferredLanguage:   │
│  "de" | "en" | "fr"   │
│  | "pt"               │
└───────────────────────┘
    ↓
┌───────────────────────────────────────────────────────────┐
│                      FRONTEND                             │
│  • i18next für React                                      │
│  • LocalStorage: last selected language                   │
│  • Auto-detect: Browser language als fallback             │
│  • Language Switcher im Header                            │
└───────────────────────────────────────────────────────────┘
    ↓
┌───────────────────────────────────────────────────────────┐
│                      BACKEND                              │
│  • Accept-Language Header auslesen                        │
│  • Resource Files (.resx) für alle Services               │
│  • Localized Error Messages                               │
│  • Localized Email Templates                              │
└───────────────────────────────────────────────────────────┘
    ↓
┌───────────────────────────────────────────────────────────┐
│                    EMAIL SERVICE                          │
│  • Template Selection basierend auf User Language         │
│  • Fallback zu EN bei nicht verfügbarer Sprache          │
└───────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technologie-Stack

### Frontend: **i18next**

**Warum i18next?**
- ✅ Industry Standard für React (200k+ NPM downloads/week)
- ✅ TypeScript Support
- ✅ Namespace Support (Organizatio bei vielen Texten)
- ✅ Lazy Loading von Translations
- ✅ ICU Message Format (Plurals, Variables)
- ✅ **Kostenlos & Open Source**

**Packages:**
```json
{
  "i18next": "^23.7.0",
  "react-i18next": "^13.5.0",
  "i18next-browser-languagedetector": "^7.2.0",
  "i18next-http-backend": "^2.4.2"
}
```

### Backend: **ASP.NET Core Localization**

**Built-in .NET Features:**
- ✅ Resource Files (.resx) für Translations
- ✅ `IStringLocalizer<T>` Interface
- ✅ Request-based Culture Selection
- ✅ **Kostenlos (Teil von .NET)**

### Optional: **DeepL API** für User-Generated Content

**Use Case:** Match Request Messages automatisch übersetzen

**DeepL Free Tier:**
- ✅ 500,000 Zeichen/Monat **kostenlos**
- ✅ Beste Translation Quality (besser als Google Translate)
- ✅ API in 30+ Sprachen

---

## 📦 Frontend Implementation

### 1. i18next Setup

```typescript
// src/client/src/i18n/config.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

import deTranslations from './locales/de/translation.json';
import enTranslations from './locales/en/translation.json';
import frTranslations from './locales/fr/translation.json';
import ptTranslations from './locales/pt/translation.json';

i18n
  .use(Backend) // Load translations from files
  .use(LanguageDetector) // Auto-detect user language
  .use(initReactI18next)
  .init({
    resources: {
      de: { translation: deTranslations },
      en: { translation: enTranslations },
      fr: { translation: frTranslations },
      pt: { translation: ptTranslations },
    },
    lng: 'de', // Default language
    fallbackLng: 'en', // Fallback if translation missing

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false, // React already escapes
    },

    // Namespaces für Organization
    ns: ['translation', 'common', 'errors', 'emails'],
    defaultNS: 'translation',
  });

export default i18n;
```

### 2. Translation Files Structure

```
src/client/src/i18n/
├── config.ts
└── locales/
    ├── de/
    │   ├── translation.json
    │   ├── common.json
    │   ├── errors.json
    │   └── emails.json
    ├── en/
    │   ├── translation.json
    │   ├── common.json
    │   ├── errors.json
    │   └── emails.json
    ├── fr/
    │   └── ...
    └── pt/
        └── ...
```

### 3. Translation File Example

```json
// locales/de/translation.json
{
  "common": {
    "welcome": "Willkommen",
    "login": "Anmelden",
    "logout": "Abmelden",
    "save": "Speichern",
    "cancel": "Abbrechen",
    "delete": "Löschen",
    "edit": "Bearbeiten",
    "search": "Suchen",
    "loading": "Lädt...",
    "error": "Fehler",
    "success": "Erfolg"
  },

  "navigation": {
    "home": "Startseite",
    "skills": "Skills",
    "matches": "Matches",
    "appointments": "Termine",
    "profile": "Profil",
    "settings": "Einstellungen"
  },

  "skills": {
    "title": "Skills",
    "addSkill": "Skill hinzufügen",
    "skillName": "Skill-Name",
    "category": "Kategorie",
    "proficiency": "Erfahrungslevel",
    "isOffered": "Skill anbieten",
    "searchPlaceholder": "Skills durchsuchen..."
  },

  "matchmaking": {
    "title": "Matchmaking",
    "sendRequest": "Anfrage senden",
    "requestSent": "Anfrage gesendet",
    "requestReceived": "Anfrage erhalten",
    "accept": "Akzeptieren",
    "reject": "Ablehnen",
    "counterOffer": "Gegenangebot",
    "matchMessage": "Deine Nachricht...",
    "preferredDays": "Bevorzugte Tage",
    "preferredTimes": "Bevorzugte Uhrzeiten",
    "monetary": "Monetärer Austausch",
    "skillExchange": "Skill-Austausch"
  },

  "appointments": {
    "title": "Termine",
    "upcoming": "Anstehend",
    "past": "Vergangen",
    "schedule": "Termin vereinbaren",
    "reschedule": "Termin verschieben",
    "cancel": "Termin absagen",
    "complete": "Termin abschließen",
    "status": {
      "pending": "Ausstehend",
      "confirmed": "Bestätigt",
      "cancelled": "Abgesagt",
      "completed": "Abgeschlossen"
    },
    "joinMeeting": "Meeting beitreten",
    "meetingStartsIn": "Meeting startet in {{minutes}} Minuten"
  },

  "videocall": {
    "title": "Videoanruf",
    "muteAudio": "Mikrofon stumm schalten",
    "unmuteAudio": "Mikrofon aktivieren",
    "disableVideo": "Kamera ausschalten",
    "enableVideo": "Kamera einschalten",
    "shareScreen": "Bildschirm teilen",
    "stopSharing": "Teilen beenden",
    "leaveCall": "Anruf verlassen",
    "chat": "Chat",
    "participants": "Teilnehmer"
  },

  "errors": {
    "general": "Ein Fehler ist aufgetreten",
    "network": "Netzwerkfehler",
    "notFound": "Nicht gefunden",
    "unauthorized": "Nicht autorisiert",
    "validation": "Validierungsfehler"
  }
}
```

### 4. Usage in Components

```typescript
// Component mit useTranslation Hook
import { useTranslation } from 'react-i18next';

const SkillsPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Box>
      <Typography variant="h4">{t('skills.title')}</Typography>
      <Button>{t('skills.addSkill')}</Button>
      <TextField
        placeholder={t('skills.searchPlaceholder')}
      />
    </Box>
  );
};

// Mit Variablen (Interpolation)
<Typography>
  {t('appointments.meetingStartsIn', { minutes: 5 })}
</Typography>
// Output: "Meeting startet in 5 Minuten"

// Mit Plurals
{t('matches.requestCount', { count: 3 })}
// translation.json: "requestCount_one": "{{count}} Anfrage"
//                   "requestCount_other": "{{count}} Anfragen"
// Output: "3 Anfragen"
```

### 5. Language Switcher Component

```typescript
// src/client/src/components/common/LanguageSwitcher.tsx
import { useTranslation } from 'react-i18next';
import { Select, MenuItem } from '@mui/material';

const LANGUAGES = [
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
];

export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const handleChange = async (langCode: string) => {
    await i18n.changeLanguage(langCode);

    // Optional: Save to backend
    await userService.updateLanguagePreference(langCode);
  };

  return (
    <Select
      value={i18n.language}
      onChange={(e) => handleChange(e.target.value)}
    >
      {LANGUAGES.map(lang => (
        <MenuItem key={lang.code} value={lang.code}>
          {lang.flag} {lang.name}
        </MenuItem>
      ))}
    </Select>
  );
};
```

### 6. Date/Time/Currency Formatting

```typescript
// Use Intl API (built-in browser)
const formatDate = (date: Date, locale: string) => {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

// German: "1. Oktober 2025, 14:30"
// English: "October 1, 2025, 2:30 PM"

const formatCurrency = (amount: number, locale: string, currency: string) => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
};

// German: "50,00 €"
// English: "€50.00"
```

---

## 📦 Backend Implementation

### 1. ASP.NET Core Localization Setup

```csharp
// Program.cs
builder.Services.AddLocalization(options =>
{
    options.ResourcesPath = "Resources";
});

builder.Services.Configure<RequestLocalizationOptions>(options =>
{
    var supportedCultures = new[] { "de", "en", "fr", "pt" };

    options.SetDefaultCulture("de")
        .AddSupportedCultures(supportedCultures)
        .AddSupportedUICultures(supportedCultures);

    // Read from Accept-Language header
    options.RequestCultureProviders = new List<IRequestCultureProvider>
    {
        new AcceptLanguageHeaderRequestCultureProvider(),
        new QueryStringRequestCultureProvider(),
        new CookieRequestCultureProvider()
    };
});

var app = builder.Build();

app.UseRequestLocalization();
```

### 2. Resource Files Structure

```
src/services/UserService/
└── Resources/
    ├── Controllers/
    │   └── UsersController.de.resx
    │   └── UsersController.en.resx
    │   └── UsersController.fr.resx
    │   └── UsersController.pt.resx
    ├── Errors/
    │   └── ErrorMessages.de.resx
    │   └── ErrorMessages.en.resx
    │   └── ErrorMessages.fr.resx
    │   └── ErrorMessages.pt.resx
    └── Emails/
        └── EmailTemplates.de.resx
        └── EmailTemplates.en.resx
        └── EmailTemplates.fr.resx
        └── EmailTemplates.pt.resx
```

### 3. Resource File Example (.resx)

```xml
<!-- Resources/Errors/ErrorMessages.de.resx -->
<?xml version="1.0" encoding="utf-8"?>
<root>
  <data name="UserNotFound" xml:space="preserve">
    <value>Benutzer nicht gefunden</value>
  </data>
  <data name="InvalidCredentials" xml:space="preserve">
    <value>Ungültige Anmeldedaten</value>
  </data>
  <data name="EmailAlreadyExists" xml:space="preserve">
    <value>Diese E-Mail-Adresse existiert bereits</value>
  </data>
  <data name="SkillNotFound" xml:space="preserve">
    <value>Skill nicht gefunden</value>
  </data>
  <data name="AppointmentConflict" xml:space="preserve">
    <value>Terminkonflikt: Sie haben bereits einen Termin zu dieser Zeit</value>
  </data>
</root>

<!-- ErrorMessages.en.resx -->
<root>
  <data name="UserNotFound" xml:space="preserve">
    <value>User not found</value>
  </data>
  <!-- ... -->
</root>
```

### 4. Usage in Controllers/Services

```csharp
// Controllers/UsersController.cs
public class UsersController : ControllerBase
{
    private readonly IStringLocalizer<UsersController> _localizer;

    public UsersController(IStringLocalizer<UsersController> localizer)
    {
        _localizer = localizer;
    }

    [HttpGet("{userId}")]
    public async Task<IActionResult> GetUser(string userId)
    {
        var user = await _userRepository.GetByIdAsync(userId);

        if (user == null)
        {
            return NotFound(new ErrorResponse
            {
                Message = _localizer["UserNotFound"],
                ErrorCode = "USER_NOT_FOUND"
            });
        }

        return Ok(user);
    }
}

// Mit Parametern
_localizer["AppointmentScheduledFor", userName, appointmentDate]
// Resources: "AppointmentScheduledFor" = "Termin vereinbart für {0} am {1}"
// Output: "Termin vereinbart für Max Mustermann am 15.10.2025"
```

### 5. Email Templates with Localization

```csharp
// Services/EmailService.cs
public class EmailService : IEmailService
{
    private readonly IStringLocalizer<EmailTemplates> _emailLocalizer;
    private readonly IUserRepository _userRepository;

    public async Task SendMatchRequestEmail(string userId, MatchRequest request)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        var userLanguage = user.PreferredLanguage ?? "en";

        // Set culture for this operation
        CultureInfo.CurrentCulture = new CultureInfo(userLanguage);
        CultureInfo.CurrentUICulture = new CultureInfo(userLanguage);

        var emailSubject = _emailLocalizer["MatchRequestReceived_Subject"];
        var emailBody = _emailLocalizer["MatchRequestReceived_Body",
            request.RequesterName,
            request.SkillName];

        await _emailSender.SendEmailAsync(user.Email, emailSubject, emailBody);
    }
}
```

**Email Template Resource:**
```xml
<!-- EmailTemplates.de.resx -->
<data name="MatchRequestReceived_Subject">
  <value>Neue Match-Anfrage erhalten</value>
</data>
<data name="MatchRequestReceived_Body">
  <value>
    Hallo,

    {0} hat eine Match-Anfrage für Skill "{1}" gesendet.

    Bitte melde dich an, um die Anfrage zu prüfen.

    Viele Grüße,
    Dein Skillswap Team
  </value>
</data>

<!-- EmailTemplates.en.resx -->
<data name="MatchRequestReceived_Subject">
  <value>New Match Request Received</value>
</data>
<data name="MatchRequestReceived_Body">
  <value>
    Hello,

    {0} has sent a match request for skill "{1}".

    Please log in to review the request.

    Best regards,
    Your Skillswap Team
  </value>
</data>
```

---

## 🔄 Optional: DeepL API für User-Generated Content

**Use Case:** Match Request Messages automatisch übersetzen, damit Empfänger in ihrer Sprache lesen kann.

### 1. DeepL API Setup

```csharp
// Services/TranslationService.cs
public class TranslationService : ITranslationService
{
    private readonly HttpClient _httpClient;
    private readonly string _deeplApiKey;

    public async Task<string> TranslateAsync(string text, string targetLang)
    {
        // DeepL API Call
        var request = new HttpRequestMessage(HttpMethod.Post, "https://api-free.deepl.com/v2/translate");
        request.Headers.Add("Authorization", $"DeepL-Auth-Key {_deeplApiKey}");

        var content = new FormUrlEncodedContent(new[]
        {
            new KeyValuePair<string, string>("text", text),
            new KeyValuePair<string, string>("target_lang", targetLang.ToUpperInvariant()),
        });

        request.Content = content;

        var response = await _httpClient.SendAsync(request);
        var result = await response.Content.ReadFromJsonAsync<DeeplResponse>();

        return result.Translations.FirstOrDefault()?.Text ?? text;
    }
}

public class DeeplResponse
{
    public List<Translation> Translations { get; set; }
}

public class Translation
{
    public string Text { get; set; }
}
```

### 2. Auto-Translation für Match Requests

```csharp
// Application/CommandHandlers/CreateMatchRequestCommandHandler.cs
public async Task<ApiResponse<CreateMatchRequestResponse>> Handle(
    CreateMatchRequestCommand request,
    CancellationToken cancellationToken)
{
    // Get target user's preferred language
    var targetUser = await _userRepository.GetByIdAsync(request.TargetUserId);
    var targetLanguage = targetUser.PreferredLanguage ?? "en";

    var matchRequest = new MatchRequest
    {
        Message = request.Message,
        OriginalLanguage = "de", // From requester
    };

    // Auto-translate if different language
    if (targetLanguage != "de")
    {
        matchRequest.TranslatedMessage = await _translationService.TranslateAsync(
            request.Message,
            targetLanguage);
    }

    await _repository.AddAsync(matchRequest);

    return ApiResponse.Success(...);
}
```

**Frontend Display:**
```typescript
// Show original + translation
<Box>
  <Typography variant="body1">
    {request.translatedMessage || request.message}
  </Typography>

  {request.translatedMessage && (
    <Typography variant="caption" color="textSecondary">
      Original: {request.message}
    </Typography>
  )}
</Box>
```

---

## 💾 User Language Preference

### Database Schema

```sql
ALTER TABLE Users ADD COLUMN PreferredLanguage VARCHAR(2) DEFAULT 'de';

-- de, en, fr, pt
```

### API Endpoint

```csharp
// Controllers/UsersController.cs
[HttpPut("language")]
public async Task<IActionResult> UpdateLanguagePreference([FromBody] UpdateLanguageRequest request)
{
    var userId = User.GetUserId();
    var user = await _userRepository.GetByIdAsync(userId);

    user.PreferredLanguage = request.Language;
    await _userRepository.SaveChangesAsync();

    return Ok();
}

public record UpdateLanguageRequest(string Language);
```

---

## 📊 Translation Management

### Option 1: Manual (für MVP)

- Developer pflegen Translation Files manuell
- JSON/RESX Files in Git
- Review Process für neue Texte

### Option 2: Translation Management Platform (später)

**Empfehlung: Lokalise** (kostenloser Plan für kleine Teams)

**Features:**
- ✅ Web-UI für Translator (kein Code-Zugriff nötig)
- ✅ Auto-Sync mit Git
- ✅ Machine Translation Suggestions
- ✅ Context Screenshots
- ✅ Translation Memory

**Alternative:** Crowdin, Phrase, POEditor

---

## 🧪 Testing

### Test Cases

1. **Language Switcher**
   - Switch von DE → EN → FR → PT
   - UI aktualisiert sich sofort
   - LocalStorage speichert Auswahl

2. **Email Templates**
   - User mit Language=DE erhält deutsche Email
   - User mit Language=EN erhält englische Email

3. **Error Messages**
   - API Error in User-Sprache zurückgeben
   - Fallback zu EN bei nicht verfügbarer Sprache

4. **Date/Time Formatting**
   - Locale-spezifische Formate
   - Timezone Handling

---

## 📅 Implementierungs-Zeitplan

| Phase | Dauer | Tasks |
|-------|-------|-------|
| **Frontend Setup** | 1 Tag | i18next Config, Initial Translations (DE/EN) |
| **Backend Setup** | 1 Tag | Localization Middleware, Resource Files |
| **Email Templates** | 0.5 Tag | Localized Email Templates |
| **Additional Languages** | 1 Tag | FR/PT Translations |
| **Testing** | 0.5 Tag | Full Flow Testing |

**GESAMT: 4 Arbeitstage**

---

## 💰 Kosten

| Service | Cost | Notes |
|---------|------|-------|
| **i18next** | Free | Open Source |
| **ASP.NET Localization** | Free | Built-in .NET |
| **DeepL API** | Free (500k chars/month) | Optional, für Auto-Translation |
| **Lokalise** | Free (1 project) | Optional, für Translation Management |

**GESAMT: €0/month für MVP**

---

## 🚀 Go-Live Checklist

- [ ] All UI Texte übersetzt (DE, EN, FR, PT)
- [ ] Email Templates in allen Sprachen
- [ ] Error Messages lokalisiert
- [ ] Language Switcher im Header
- [ ] User Language Preference in DB
- [ ] Accept-Language Header Support
- [ ] Fallback zu EN funktioniert
- [ ] Date/Time/Currency Formatting getestet
- [ ] Browser Language Auto-Detection funktioniert

---

## 📚 Ressourcen

- [i18next Documentation](https://www.i18next.com/)
- [React-i18next Guide](https://react.i18next.com/)
- [ASP.NET Core Localization](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/localization)
- [DeepL API Docs](https://www.deepl.com/docs-api)
- [Lokalise](https://lokalise.com/)
- [ICU Message Format](https://unicode-org.github.io/icu/userguide/format_parse/messages/)

---

**Status**: 📝 Dokumentiert, bereit für Implementierung nach Core Features
