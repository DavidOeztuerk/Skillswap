# Contract Validation Library

Diese Bibliothek stellt FluentValidation-basierte Validators für alle API-Contracts im Skillswap-Projekt bereit.

## Features

### ✅ **Basis-Validators**
- **EmailValidator**: Validiert E-Mail-Adressen mit Format- und Längenbeschränkungen
- **PasswordValidator**: Starke Passwort-Validierung mit Sicherheitsanforderungen
- **UsernameValidator**: Benutzername-Validierung mit erlaubten Zeichen
- **PersonNameValidator**: Namen-Validierung mit internationalen Zeichen
- **PhoneNumberValidator**: Telefonnummer-Validierung im internationalen Format
- **UrlValidator**: URL-Validierung für HTTP/HTTPS
- **GuidValidator**: GUID-Format-Validierung

### ✅ **Service-spezifische Validators**
- **User**: RegisterUserRequestValidator, LoginRequestValidator, ChangePasswordRequestValidator
- **Skill**: CreateSkillRequestValidator
- **Pagination**: PagedRequestValidator, FilteredPagedRequestValidator, AdvancedFilterRequestValidator

### ✅ **Contract Versioning**
- **IVersionedContract**: Interface für versionierte Contracts
- **IMigratableContract**: Interface für migrierbare Contracts
- **ContractVersionAttribute**: Attribute für Versionskennzeichnung
- **ContractMigrationService**: Service für automatische Contract-Migration

### ✅ **Erweiterte Pagination & Filtering**
- **PagedRequest**: Basis-Pagination-Contract
- **SortedPagedRequest**: Pagination mit Sortierung
- **FilteredPagedRequest**: Pagination mit Suche und einfachen Filtern
- **AdvancedFilterRequest**: Erweiterte Filterung mit komplexen Kriterien
- **FilterCriteria**: Typsichere Filter-Definition mit verschiedenen Operatoren

## Verwendung

### Service Registration

```csharp
// In Program.cs oder Startup.cs
services.AddContractValidators();

// Oder für mehrere Assemblies
services.AddContractValidators(Assembly.GetExecutingAssembly(), otherAssembly);
```

### Verwendung in MediatR Pipeline

Die Validators werden automatisch durch das `ValidationBehavior` in der CQRS-Pipeline aufgerufen:

```csharp
// Automatische Validierung durch MediatR Pipeline
var result = await mediator.Send(new RegisterUserRequest(...));
```

### Manuelle Validierung

```csharp
// Direkte Verwendung
var validator = new RegisterUserRequestValidator();
var result = await validator.ValidateAsync(request);

if (!result.IsValid)
{
    throw new ValidationException(result.Errors);
}
```

### Contract Versioning

```csharp
// V1 Contract
public record UserRequest(...) : IVersionedContract
{
    public string ApiVersion => "v1";
}

// V2 Contract mit Migration
public record UserRequestV2(...) : IMigratableContract<UserRequest>
{
    public string ApiVersion => "v2";
    
    public static IVersionedContract MigrateFrom(UserRequest previous)
    {
        return new UserRequestV2(...);
    }
}

// Migration Service
var migrationService = new ContractMigrationService();
var v2Request = migrationService.Migrate<UserRequest, UserRequestV2>(v1Request);
```

### Erweiterte Filterung

```csharp
// Einfache Pagination
var pagedRequest = new PagedRequest(PageNumber: 1, PageSize: 20);

// Mit Sortierung
var sortedRequest = new SortedPagedRequest(
    PageNumber: 1, 
    PageSize: 20, 
    SortBy: "name", 
    SortDirection: SortDirection.Ascending
);

// Mit Filterung
var filteredRequest = new AdvancedFilterRequest(
    PageNumber: 1,
    PageSize: 20,
    Filters: new List<FilterCriteria>
    {
        new() { Field = "status", Operator = FilterOperator.Equal, Value = "Active" },
        new() { Field = "createdAt", Operator = FilterOperator.GreaterThan, Value = DateTime.Now.AddDays(-30) }
    },
    LogicalOperator: LogicalOperator.And
);
```

## Validation Rules

### Password Requirements
- Mindestens 8 Zeichen
- Maximal 100 Zeichen
- Mindestens ein Kleinbuchstabe
- Mindestens ein Großbuchstabe
- Mindestens eine Ziffer
- Mindestens ein Sonderzeichen

### Email Requirements
- Gültiges E-Mail-Format
- Maximal 256 Zeichen

### Username Requirements
- 3-50 Zeichen
- Nur Buchstaben, Zahlen, Punkte, Unterstriche und Bindestriche

### Filter Operators
- `Equal`, `NotEqual`
- `GreaterThan`, `GreaterThanOrEqual`, `LessThan`, `LessThanOrEqual`
- `Contains`, `StartsWith`, `EndsWith`
- `In`, `NotIn`
- `IsNull`, `IsNotNull`
- `Between`

## Error Handling

Die Validators verwenden die standardisierte `ApiErrorResponse` für einheitliche Fehlerbehandlung:

```csharp
// Validation Error Response
{
    "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
    "title": "One or more validation errors occurred.",
    "status": 400,
    "errors": {
        "Email": ["Invalid email format"],
        "Password": ["Password must contain at least one uppercase letter"]
    },
    "traceId": "...",
    "timestamp": "2024-01-01T00:00:00Z"
}
```

## Konfiguration

### Anpassung erlaubter Felder für Sortierung/Filterung

```csharp
public class CustomSortedPagedRequestValidator : AbstractValidator<SortedPagedRequest>
{
    private static readonly string[] AllowedSortFields = 
    {
        "customField1", "customField2", "customField3"
    };
    
    // ... Implementierung
}
```

### Eigene Validators

```csharp
public class CustomRequestValidator : AbstractValidator<CustomRequest>
{
    public CustomRequestValidator()
    {
        RuleFor(x => x.Email)
            .SetValidator(new EmailValidator());
            
        RuleFor(x => x.CustomField)
            .NotEmpty()
            .WithMessage("Custom field is required");
    }
}
```

## Migration zwischen Contract-Versionen

Das System unterstützt automatische Migration zwischen Contract-Versionen:

1. Implementiere `IMigratableContract<TPrevious>` für neue Versionen
2. Verwende `ContractVersionAttribute` für Metadaten
3. Der `ContractMigrationService` erkennt und registriert Migrations automatisch

## Best Practices

1. **Wiederverwendung**: Nutze die Basis-Validators für häufige Validierungen
2. **Komposition**: Kombiniere mehrere Validators mit `SetValidator()`
3. **Conditional Validation**: Verwende `When()` für bedingte Validierungen
4. **Konsistente Fehlermeldungen**: Nutze einheitliche Error Messages
5. **Performance**: Validators werden als Singletons registriert
6. **Testing**: Teste Validators isoliert mit verschiedenen Input-Szenarien