# 🧪 Caching Test Guide für Skillswap

## 1. Redis Status prüfen

```bash
# Prüfe ob Redis läuft
docker ps | grep redis

# Verbinde dich mit Redis CLI
docker exec -it skillswap-redis-1 redis-cli

# In Redis CLI:
PING  # sollte PONG zurückgeben
INFO  # zeigt Redis Statistiken
KEYS *  # zeigt alle gespeicherten Keys
```

## 2. Caching in Aktion testen

### A) Skills abrufen (mit Caching)

```bash
# Erster Request - wird gecached
curl -X GET "http://localhost:8080/api/skills?PageNumber=1&PageSize=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# In Redis CLI schauen:
docker exec -it skillswap-redis-1 redis-cli
KEYS skillservice:*  # sollte Cache Keys zeigen
GET "skillservice:skills:query:..."  # zeigt gecachte Daten

# Zweiter Request - kommt aus Cache (sollte schneller sein)
curl -X GET "http://localhost:8080/api/skills?PageNumber=1&PageSize=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### B) Cache Invalidierung testen

```bash
# 1. Erstelle einen neuen Skill
curl -X POST "http://localhost:8080/api/skills" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Caching",
    "categoryId": "some-category-id",
    "description": "Testing cache invalidation"
  }'

# 2. Prüfe in Redis - alte Cache Einträge sollten gelöscht sein
docker exec -it skillswap-redis-1 redis-cli
KEYS skillservice:*  # sollte leer oder neue Keys zeigen
```

## 3. Performance Vergleich

### Mit Cache (Redis läuft):
```bash
# Zeit messen
time curl -X GET "http://localhost:8080/api/skills?PageNumber=1&PageSize=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
# Erwarte: ~50-100ms beim ersten Mal, ~5-20ms beim zweiten Mal
```

### Ohne Cache (Redis stoppen zum Testen):
```bash
# Redis stoppen
docker stop skillswap-redis-1

# Request sollte trotzdem funktionieren (Fallback zu Memory Cache)
curl -X GET "http://localhost:8080/api/skills?PageNumber=1&PageSize=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
# Erwarte: ~100-200ms jedes Mal

# Redis wieder starten
docker start skillswap-redis-1
```

## 4. Cache Monitoring

### A) Redis Monitor in Echtzeit
```bash
docker exec -it skillswap-redis-1 redis-cli MONITOR
# Zeigt alle Redis Operationen in Echtzeit
```

### B) Service Logs prüfen
```bash
# SkillService logs
tail -f src/services/SkillService/logs/SkillService-*.log | grep -i cache

# Solltest sehen:
# - "Cache hit for key..."
# - "Cache miss for key..."
# - "Cache invalidated for pattern..."
```

## 5. Distributed Rate Limiting testen

```bash
# Schnell mehrere Requests senden
for i in {1..20}; do
  curl -X GET "http://localhost:8080/api/skills" \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" &
done

# Nach X Requests solltest du 429 (Too Many Requests) bekommen
```

## 6. Token Revocation testen

```bash
# 1. Login und JWT Token erhalten
TOKEN=$(curl -X POST "http://localhost:8080/api/users/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"Test123!"}' | jq -r '.data.token')

# 2. Logout (revoked das Token)
curl -X POST "http://localhost:8080/api/users/logout" \
  -H "Authorization: Bearer $TOKEN"

# 3. Versuche mit revoked Token
curl -X GET "http://localhost:8080/api/skills" \
  -H "Authorization: Bearer $TOKEN"
# Sollte 401 Unauthorized zurückgeben
```

## 7. Health Checks & Metrics

### Health Check Endpoints:
```bash
# Gateway Health
curl http://localhost:8080/health | jq

# Specific Service Health (durch Gateway)
curl http://localhost:8080/api/skills/health | jq

# Readiness Check
curl http://localhost:8080/health/ready | jq
```

### Metrics (Prometheus Format):
```bash
# Zeigt alle Metriken
curl http://localhost:8080/metrics

# Spezifische Metriken filtern
curl http://localhost:8080/metrics | grep http_requests_total
curl http://localhost:8080/metrics | grep cache_hit_ratio
```

## 8. Cache Statistiken

```bash
# In Redis CLI
docker exec -it skillswap-redis-1 redis-cli

# Wichtige Befehle:
INFO stats      # Zeigt hit/miss Verhältnis
DBSIZE         # Anzahl der Keys
MEMORY STATS   # Memory usage
CLIENT LIST    # Verbundene Clients
```

## 9. Automatisches Testing Script

Erstelle `test-cache.sh`:

```bash
#!/bin/bash

echo "🧪 Testing Skillswap Caching..."

# Farben
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# JWT Token (ersetze mit deinem)
TOKEN="YOUR_JWT_TOKEN"

echo -e "\n${GREEN}1. Clearing Redis Cache...${NC}"
docker exec -it skillswap-redis-1 redis-cli FLUSHDB

echo -e "\n${GREEN}2. First request (should be cached)...${NC}"
START=$(date +%s%N)
curl -s -X GET "http://localhost:8080/api/skills?PageNumber=1&PageSize=10" \
  -H "Authorization: Bearer $TOKEN" > /dev/null
END=$(date +%s%N)
DIFF1=$((($END - $START)/1000000))
echo "Time: ${DIFF1}ms"

echo -e "\n${GREEN}3. Checking Redis for cached data...${NC}"
KEYS=$(docker exec skillswap-redis-1 redis-cli KEYS "skillservice:*" | wc -l)
echo "Found $KEYS cache entries"

echo -e "\n${GREEN}4. Second request (from cache)...${NC}"
START=$(date +%s%N)
curl -s -X GET "http://localhost:8080/api/skills?PageNumber=1&PageSize=10" \
  -H "Authorization: Bearer $TOKEN" > /dev/null
END=$(date +%s%N)
DIFF2=$((($END - $START)/1000000))
echo "Time: ${DIFF2}ms"

echo -e "\n${GREEN}5. Performance comparison:${NC}"
echo "First request: ${DIFF1}ms"
echo "Cached request: ${DIFF2}ms"
IMPROVEMENT=$(( ($DIFF1 - $DIFF2) * 100 / $DIFF1 ))
echo "Performance improvement: ${IMPROVEMENT}%"

echo -e "\n${GREEN}✅ Cache testing complete!${NC}"
```

## 10. Troubleshooting

### Redis Connection Issues:
```bash
# Check Redis logs
docker logs skillswap-redis-1

# Test Redis connection
docker exec -it skillswap-redis-1 redis-cli ping
```

### Cache nicht funktioniert:
1. Prüfe Redis Verbindung in Service logs
2. Stelle sicher dass `Redis:ConnectionString` konfiguriert ist
3. Prüfe ob `CacheInvalidationService` registriert ist (nicht für Gateway)

### Performance nicht besser:
1. Cache TTL zu kurz? Check `CacheDuration` in Services
2. Cache Keys zu spezifisch? Check Key-Generation Logic
3. Zu viele Cache Misses? Monitor mit Redis MONITOR

## Expected Results

✅ **Funktioniert richtig wenn:**
- Zweite Anfrage 70-90% schneller als erste
- Redis Keys nach Queries sichtbar
- Cache wird nach Mutations invalidiert
- Services funktionieren auch ohne Redis (Fallback)
- Rate Limiting blockiert nach X Requests
- Token Revocation funktioniert sofort

❌ **Problem wenn:**
- Keine Performance Verbesserung
- Redis Keys bleiben leer
- Services crashen ohne Redis
- Cache wird nicht invalidiert nach Updates