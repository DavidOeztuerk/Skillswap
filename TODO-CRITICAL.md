# TODO-CRITICAL.md - Kritische Probleme und Sofortmaßnahmen

## 🔥 KRITISCHE PROBLEME (Stand: 2025-08-18)

### 1. Docker Container Health Issues
**Problem:** Alle Microservices zeigen Status "unhealthy" obwohl sie laufen und auf Requests antworten

**Symptome:** 
- Services antworten mit HTTP 200 OK
- Health checks schlagen trotzdem fehl  
- Thread pool starvation Warnungen in allen Services

**Lösungsansatz:**
- Health check Timeouts erhöhen
- Thread pool Konfiguration optimieren
- Memory/CPU Limits in docker-compose.yml prüfen

---

### 2. Performance Probleme
**Problem:** Thread pool starvation in allen Services

**Symptome:**
- Warnung: "heartbeat has been running for >1s"
- Langsame Response-Zeiten (bis zu 20s für einfache Requests)
- Kestrel meldet thread pool starvation

**Lösungsansatz:**
- ThreadPool.SetMinThreads() in Program.cs konfigurieren
- Async/await Pattern konsequent verwenden
- Database Connection Pooling optimieren

---

### 3. Firebase Integration
**Status:** Deaktiviert aber funktionsfähig

**Problem:**
- Firebase credentials fehlen im Docker Container
- Push-Notifications derzeit nicht verfügbar

**Lösungsansatz:**
- Firebase credentials als Docker Secret mounten
- Oder Firebase komplett optional machen (bereits teilweise umgesetzt mit FIREBASE_ENABLED flag)

---

### 4. ITokenRevocationService
**Status:** ✅ BEHOBEN (2025-08-18)
- Service wurde erfolgreich in ServiceCollectionExtensions registriert
- Verwendet Redis wenn verfügbar, sonst In-Memory Fallback

---

## 📋 SOFORT-MAßNAHMEN

### 1. Health Checks reparieren

```csharp
// In Program.cs jedes Services:
builder.Services.AddHealthChecks()
    .AddDbContextCheck<DbContext>(
        name: "database",
        failureStatus: HealthStatus.Degraded,
        timeout: TimeSpan.FromSeconds(5))
    .AddRedis(
        redisConnectionString,
        name: "redis",
        timeout: TimeSpan.FromSeconds(2))
    .AddRabbitMQ(
        rabbitConnectionString,
        name: "rabbitmq",
        timeout: TimeSpan.FromSeconds(3));

// Health check endpoint configuration
app.MapHealthChecks("/health", new HealthCheckOptions
{
    ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
});
```

### 2. Thread Pool Optimierung

```csharp
// Am Anfang von Program.cs vor builder creation:
ThreadPool.SetMinThreads(200, 200);
ThreadPool.SetMaxThreads(1000, 1000);

// Oder via Environment Variable:
var minThreads = Environment.GetEnvironmentVariable("MIN_THREADS") ?? "200";
ThreadPool.SetMinThreads(int.Parse(minThreads), int.Parse(minThreads));
```

### 3. Docker Resource Limits anpassen

```yaml
# docker-compose.yml für jeden Service:
services:
  userservice:
    mem_limit: 512m
    mem_reservation: 256m
    cpus: '0.5'
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    environment:
      - ASPNETCORE_URLS=http://+:5001
      - MIN_THREADS=200
      - DOTNET_SYSTEM_THREADING_THREADPOOL_MINTHREADS=200
```

### 4. Database Connection Pooling

```csharp
// In Program.cs für jeden Service mit DB:
var connectionString = configuration.GetConnectionString("DefaultConnection");
services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString, npgsqlOptions =>
    {
        npgsqlOptions.EnableRetryOnFailure(5, TimeSpan.FromSeconds(10), null);
        npgsqlOptions.CommandTimeout(30);
    })
    .UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking) // für Read-heavy workloads
);

// Connection String mit Pooling:
// "Host=postgres;Database=mydb;Username=user;Password=pass;Pooling=true;Minimum Pool Size=10;Maximum Pool Size=100;"
```

### 5. Logging verbessern für Debugging

```csharp
// Structured Logging mit Performance Metrics:
builder.Services.AddSingleton<ILogger>(provider =>
{
    return new LoggerConfiguration()
        .MinimumLevel.Debug()
        .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
        .MinimumLevel.Override("Microsoft.EntityFrameworkCore", LogEventLevel.Information)
        .Enrich.FromLogContext()
        .Enrich.WithCorrelationId()
        .Enrich.WithProperty("Service", serviceName)
        .WriteTo.Console(new JsonFormatter())
        .CreateLogger();
});

// Slow Query Logging für EF Core:
optionsBuilder.LogTo(Console.WriteLine, 
    new[] { DbLoggerCategory.Database.Command.Name },
    LogLevel.Information)
    .EnableSensitiveDataLogging(isDevelopment);
```

---

## 🔄 NÄCHSTE SCHRITTE

### Phase 1: Stabilisierung (Diese Woche)
1. **Health Check Debugging**
   - [ ] Detaillierte Health Check Logs analysieren
   - [ ] Custom Health Checks mit mehr Details implementieren
   - [ ] Health Check UI Dashboard einrichten

2. **Performance Quick Wins**
   - [ ] Thread Pool Settings in allen Services anpassen
   - [ ] Database Indexes überprüfen und optimieren
   - [ ] Redis Cache Hit Ratio analysieren

### Phase 2: Monitoring (Nächste Woche)
1. **Observability einrichten**
   - [ ] Application Insights oder OpenTelemetry konfigurieren
   - [ ] Distributed Tracing implementieren
   - [ ] Custom Metrics für Business KPIs

2. **Performance Profiling**
   - [ ] dotnet-trace auf problematische Services anwenden
   - [ ] Memory Dumps bei hoher Auslastung analysieren
   - [ ] Database Query Performance optimieren

### Phase 3: Optimierung (In 2 Wochen)
1. **Docker Optimierung**
   - [ ] Multi-stage builds verbessern
   - [ ] Base Images aktualisieren (.NET 9 slim)
   - [ ] Layer Caching optimieren

2. **Code Optimierung**
   - [ ] Hot Paths identifizieren und optimieren
   - [ ] Unnecessary allocations reduzieren
   - [ ] Caching Strategy überarbeiten

---

## 📊 AKTUELLE BEWERTUNG

| Bereich | Status | Priorität |
|---------|--------|-----------|
| Services Running | ✅ Läuft | - |
| Health Checks | ❌ Failing | HOCH |
| Performance | ⚠️ Problematisch | HOCH |
| Firebase | ⚠️ Deaktiviert | NIEDRIG |
| Token Revocation | ✅ Behoben | - |
| API Responses | ✅ Funktioniert | - |
| Database | ✅ Verbunden | - |
| Redis | ✅ Verbunden | - |
| RabbitMQ | ✅ Verbunden | - |

**Gesamtbewertung: 7/10** - System funktionsfähig aber mit Performance-Problemen

---

## 🛠️ TOOLS & COMMANDS

### Debugging Commands
```bash
# Health Check Status
curl http://localhost:8080/health

# Container Resource Usage
docker stats

# Service Logs mit Fehlerfilter
docker-compose logs -f servicename | grep -E "ERROR|WARN|Exception"

# Thread Pool Info
dotnet-counters monitor -n servicename --counters System.Runtime

# Database Connections
docker exec postgres_userservice psql -U skillswap -c "SELECT count(*) FROM pg_stat_activity;"
```

### Performance Testing
```bash
# Load Test mit Apache Bench
ab -n 1000 -c 10 http://localhost:8080/api/skills

# Response Time Test
time curl http://localhost:8080/api/skills

# Memory Usage
docker exec servicename dotnet-dump collect
```

---

**Letzte Aktualisierung:** 2025-08-18 14:30 UTC
**Nächste Review:** Nach Implementierung der Sofortmaßnahmen