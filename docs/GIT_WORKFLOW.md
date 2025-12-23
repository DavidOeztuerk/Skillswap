# Git Flow Workflow - Skillswap

## Branch Struktur

```
main (production)
  └── staging (pre-production)
       └── develop (integration)
            └── feature/* (neue Features)
            └── fix/* (Bug Fixes)
            └── refactor/* (Code Improvements)
```

## Branch Protection Rules ✅

Alle drei Hauptbranches sind geschützt:
- **main**: Keine Force-Pushes, keine Löschungen
- **staging**: Keine Force-Pushes, keine Löschungen  
- **develop**: Keine Force-Pushes, keine Löschungen

## Workflow

### 1. Feature entwickeln
```bash
# Von develop branchen
git checkout develop
git pull origin develop
git checkout -b feature/mein-feature

# Entwickeln und committen
git add .
git commit -m "feat: beschreibung"
git push -u origin feature/mein-feature
```

### 2. Feature → Develop (PR)
```bash
# Pull Request erstellen
gh pr create --base develop --title "Feature: Beschreibung"

# Oder über GitHub Web:
# https://github.com/DavidOeztuerk/Skillswap/compare/develop...feature/mein-feature
```

### 3. Develop → Staging (PR)
```bash
# Wenn Features bereit für Testing
gh pr create --base staging --head develop --title "Release: Version X.Y"
```

### 4. Staging → Main (PR)
```bash
# Nach erfolgreichem Testing
gh pr create --base main --head staging --title "Production Release: Version X.Y"
```

## Quick Commands

```bash
# Status prüfen
git branch -a

# PR erstellen
gh pr create

# PR mergen (als Maintainer)
gh pr merge [PR-NUMBER]

# Lokale Branches aufräumen
git branch -d feature/mein-feature
git remote prune origin
```

## Wichtige Regeln

1. **Niemals direkt auf main, staging oder develop pushen**
2. **Immer über Pull Requests arbeiten**
3. **Feature-Branches nach Merge löschen**
4. **Regelmäßig develop in Feature-Branch mergen bei längeren Features**

## Commit Message Format

```bash
feat: Neue Funktion
fix: Bug Fix
refactor: Code Verbesserung
docs: Dokumentation
test: Tests hinzugefügt
chore: Wartungsarbeiten
```


