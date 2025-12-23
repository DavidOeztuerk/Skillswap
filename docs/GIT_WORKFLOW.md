# Git Workflow - Skillswap

## Branch Struktur (Vereinfacht)

```
main (PRODUCTION)
  ↑
  └── develop (STAGING) ←── feature/*
                        ←── fix/*
                        ←── hotfix/*
```

**Kernprinzip:**
- `develop` = Staging-Umgebung (Auto-Deploy)
- `main` = Production-Umgebung (mit Approval)
- Kein separater `staging` Branch mehr!

## Deployment-Trigger

| Branch | Umgebung | Deploy-Art |
|--------|----------|------------|
| `develop` | Staging | Automatisch bei Push |
| `main` | Production | Mit Environment Approval |
| `feature/*` | - | Kein Deploy |
| `release/*` | - | Kein Deploy (nur Code-Freeze) |
| `hotfix/*` | - | Nach Merge auf main |

## Workflows

### 1. Feature entwickeln

```bash
# Von develop branchen
git checkout develop
git pull origin develop
git checkout -b feature/mein-feature

# Entwickeln und committen
git add .
git commit -m "feat(scope): beschreibung"
git push -u origin feature/mein-feature

# Pull Request erstellen
gh pr create --base develop --title "feat: Beschreibung"
```

**Nach Merge:** Feature landet automatisch auf Staging!

### 2. Release erstellen (Production-Deploy)

```bash
# Option A: Direkt von develop (wenn stabil)
gh pr create --base main --head develop --title "release: v1.4.0"

# Option B: Mit Release-Branch (für Code-Freeze)
git checkout develop
git checkout -b release/1.4.0
# ... nur Bugfixes, keine Features ...
git push -u origin release/1.4.0
gh pr create --base main --title "release: v1.4.0"
```

**Wichtig:** Nach dem Merge auf `main` → Backmerge wird automatisch erstellt!

### 3. Backmerge (PFLICHT nach Production-Deploy)

Ein automatischer Workflow erstellt einen PR: `main → develop`

```bash
# Falls manuell nötig:
git checkout develop
git merge main
git push origin develop
```

**Warum Backmerge?**
- Hotfixes und Release-Fixes müssen zurück in develop
- `main` ist die Quelle der Wahrheit für Production
- Verhindert Divergenz zwischen Branches

### 4. Hotfix (Notfall-Fix in Production)

```bash
# Direkt von main branchen
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug

# Fix implementieren
git add .
git commit -m "fix: kritischer Bug behoben"
git push -u origin hotfix/critical-bug

# PR direkt auf main
gh pr create --base main --title "hotfix: Kritischer Bug"
```

**Nach Merge:** Backmerge-Workflow erstellt automatisch PR zu develop!

## GitHub Actions Workflows

### deploy-cloud.yml
```yaml
Trigger:
  - push: develop → Deploy Staging
  - push: main → Deploy Production (mit Approval)
```

### backmerge.yml
```yaml
Trigger:
  - push: main → Erstellt PR (main → develop)
```

## Branch Protection Rules

| Branch | Force Push | Delete | PR Required | Approvals |
|--------|------------|--------|-------------|-----------|
| `main` | ❌ | ❌ | ✅ | 1+ |
| `develop` | ❌ | ❌ | ✅ | Optional |

## Environment Approval (GitHub)

1. Gehe zu **Settings → Environments**
2. Erstelle Environment `production`
3. Aktiviere **Required reviewers**
4. Füge Reviewer hinzu

## Commit Message Format

```bash
# Format: type(scope): description

feat(auth): Add 2FA support
fix(api): Resolve timeout issue
refactor(skills): Simplify matching algorithm
docs(readme): Update installation guide
test(user): Add unit tests for registration
chore(deps): Update dependencies
hotfix(payment): Fix critical transaction bug
```

## Quick Reference

```bash
# Feature starten
git checkout develop && git pull && git checkout -b feature/x

# Feature fertig → PR zu develop
gh pr create --base develop

# Release → PR zu main
gh pr create --base main --head develop

# Hotfix → PR zu main
git checkout main && git checkout -b hotfix/x
gh pr create --base main

# Backmerge prüfen
gh pr list --base develop --head main
```

## Wichtige Regeln

1. **Niemals direkt auf `main` oder `develop` pushen**
2. **Immer über Pull Requests arbeiten**
3. **Backmerge nach jedem Production-Deploy** (wird automatisch erstellt)
4. **Feature-Branches nach Merge löschen**
5. **Hotfixes gehen auf `main`, nicht auf `develop`**

## Flow-Diagramm

```
Developer Flow:
═══════════════

feature/x ──PR──► develop ──PR──► main
                     │              │
                     ▼              │
                  STAGING           │
                                    ▼
                               PRODUCTION
                                    │
                                    ▼
                    ◄────Backmerge────┘
```

## Dependabot PRs

Dependabot erstellt PRs automatisch auf `develop` (nicht `main`).

```yaml
# .github/dependabot.yml
target-branch: "develop"
```
