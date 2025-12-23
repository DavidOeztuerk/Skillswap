# Feature-Based Architecture Masterplan

## Executive Summary

**Ziel:** Umstellung von Layer-Based auf Feature-Based Architecture für bessere Wartbarkeit, Lesbarkeit und Debuggbarkeit.

**Umfang:** 443 Dateien, ~15 Features

**Prinzipien:**
1. **Co-Location:** Zusammengehörige Dateien gehören zusammen
2. **Isolation:** Features sind unabhängig voneinander
3. **Shared Core:** Nur wirklich geteilte Logik im shared/ Ordner
4. **Clean Exports:** Jedes Feature exportiert nur seine Public API

---

## AKTUELLE STRUKTUR (Layer-Based) ❌

```
src/
├── api/services/           # 13 Services (gemischt)
├── components/             # 25 Ordner (nach Feature)
│   ├── auth/               # 13 Komponenten
│   ├── skills/             # 3 Komponenten
│   ├── matchmaking/        # 6 Komponenten
│   ├── appointments/       # 8 Komponenten
│   ├── chat/               # 9 Komponenten
│   ├── videocall/          # 15 Komponenten
│   ├── ui/                 # 14 UI-Komponenten
│   └── layout/             # 10 Layout-Komponenten
├── contexts/               # 8 Contexts (gemischt)
├── features/               # NUR Redux Slices
│   ├── auth/
│   ├── skills/
│   └── ...
├── hooks/                  # 40 Hooks (FLAT - Problem!)
│   └── videocall/          # 8 Hooks (bereits ausgelagert)
├── pages/                  # Nach Feature gruppiert
│   ├── skills/
│   ├── admin/
│   └── ...
├── schemas/                # 7 Zod Schemas
├── services/               # 3 Services (signalr, firebase)
├── store/
│   ├── adapters/           # 11 Entity Adapters
│   └── selectors/          # 13 Selectors
├── types/
│   ├── models/             # 14 Models
│   └── contracts/          # 50+ Contracts
├── styles/                 # Design Tokens
├── utils/                  # Utilities
└── workers/                # Web Workers
```

### PROBLEME der aktuellen Struktur:

| Problem | Beschreibung |
|---------|-------------|
| **Verstreute Logik** | Auth-Logik in 6+ Ordnern verstreut |
| **Debugging schwierig** | Suche nach zugehörigen Dateien zeitaufwendig |
| **Flache Hooks** | 40 Hooks ohne Organisation |
| **Doppelte Patterns** | Ähnliche Logik in verschiedenen Features |
| **Import-Chaos** | Relative Imports über 5+ Ebenen |
| **Coupling** | Features sind implizit gekoppelt |

---

## NEUE STRUKTUR (Feature-Based) ✅

```
src/
├── features/                      # ⬅️ HAUPTORDNER für alle Features
│   ├── auth/                      # Authentication Feature
│   │   ├── components/
│   │   │   ├── LoginForm/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── LoginForm.types.ts
│   │   │   │   ├── useLoginForm.ts
│   │   │   │   └── index.ts
│   │   │   ├── RegisterForm/
│   │   │   ├── TwoFactorDialog/
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useEmailVerification.ts
│   │   │   ├── useTwoFactor.ts
│   │   │   └── index.ts
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   ├── authService.ts
│   │   │   └── index.ts
│   │   ├── store/
│   │   │   ├── authSlice.ts
│   │   │   ├── authAdapter.ts
│   │   │   ├── authSelectors.ts
│   │   │   └── index.ts
│   │   ├── schemas/
│   │   │   ├── loginSchema.ts
│   │   │   ├── registerSchema.ts
│   │   │   └── index.ts
│   │   ├── types/
│   │   │   ├── auth.types.ts
│   │   │   ├── auth.contracts.ts
│   │   │   └── index.ts
│   │   ├── constants/
│   │   │   └── permissions.ts
│   │   └── index.ts              # Public API Export
│   │
│   ├── skills/                    # Skills Feature
│   │   ├── components/
│   │   │   ├── SkillCard/
│   │   │   ├── SkillForm/
│   │   │   ├── SkillList/
│   │   │   └── SkillDetail/
│   │   │       ├── SkillDetailPage.tsx
│   │   │       ├── SkillDetailHeader.tsx
│   │   │       ├── SkillDetailSidebar.tsx
│   │   │       ├── SkillReviewsSection.tsx
│   │   │       ├── useSkillDetail.ts
│   │   │       ├── types.ts
│   │   │       └── index.ts
│   │   ├── hooks/
│   │   │   ├── useSkills.ts
│   │   │   ├── useSkillsPage.ts
│   │   │   ├── useSkillSearch.ts
│   │   │   └── index.ts
│   │   ├── pages/
│   │   │   ├── SkillsPage.tsx
│   │   │   ├── MySkillsPage.tsx
│   │   │   ├── FavoriteSkillsPage.tsx
│   │   │   ├── SkillEditPage.tsx
│   │   │   └── index.ts
│   │   ├── store/
│   │   ├── services/
│   │   ├── schemas/
│   │   ├── types/
│   │   └── index.ts
│   │
│   ├── matchmaking/               # Matchmaking Feature
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── store/
│   │   ├── services/
│   │   ├── types/
│   │   └── index.ts
│   │
│   ├── appointments/              # Appointments Feature
│   │   ├── components/
│   │   │   ├── AppointmentCard/
│   │   │   ├── AppointmentForm/
│   │   │   ├── CalendarView/
│   │   │   └── TimeSlotPicker/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── store/
│   │   ├── services/
│   │   ├── types/
│   │   └── index.ts
│   │
│   ├── videocall/                 # VideoCall Feature
│   │   ├── components/
│   │   │   ├── VideoRoom/
│   │   │   ├── Controls/
│   │   │   ├── Participants/
│   │   │   └── Chat/
│   │   ├── hooks/
│   │   │   ├── useVideoCallCore.ts
│   │   │   ├── useVideoCallMedia.ts
│   │   │   ├── useVideoCallE2EE.ts
│   │   │   ├── useVideoCallParticipants.ts
│   │   │   ├── useVideoCallChat.ts
│   │   │   ├── useVideoCallComposed.ts
│   │   │   └── index.ts
│   │   ├── pages/
│   │   ├── store/
│   │   ├── services/
│   │   ├── context/
│   │   │   └── VideoCallContext.tsx
│   │   ├── types/
│   │   └── index.ts
│   │
│   ├── chat/                      # Chat Feature
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── store/
│   │   ├── types/
│   │   └── index.ts
│   │
│   ├── notifications/             # Notifications Feature
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── store/
│   │   ├── types/
│   │   └── index.ts
│   │
│   ├── admin/                     # Admin Feature
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── store/
│   │   ├── services/
│   │   ├── types/
│   │   └── index.ts
│   │
│   ├── user/                      # User Profile Feature
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── types/
│   │   └── index.ts
│   │
│   ├── settings/                  # Settings Feature
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── types/
│   │   └── index.ts
│   │
│   ├── search/                    # Search Feature
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── store/
│   │   └── index.ts
│   │
│   └── dashboard/                 # Dashboard Feature
│       ├── components/
│       ├── hooks/
│       ├── pages/
│       └── index.ts
│
├── shared/                        # ⬅️ Geteilte Ressourcen
│   ├── components/
│   │   ├── ui/                    # Basis UI-Komponenten
│   │   │   ├── Button/
│   │   │   ├── Card/
│   │   │   ├── Modal/
│   │   │   ├── Alert/
│   │   │   ├── LoadingButton/
│   │   │   ├── SkeletonLoader/
│   │   │   ├── EmptyState/
│   │   │   └── index.ts
│   │   ├── layout/
│   │   │   ├── Sidebar/
│   │   │   ├── Header/
│   │   │   ├── Footer/
│   │   │   ├── Tabbar/
│   │   │   └── index.ts
│   │   ├── forms/
│   │   │   ├── FormField/
│   │   │   ├── FormSelect/
│   │   │   └── index.ts
│   │   ├── feedback/
│   │   │   ├── Toast/
│   │   │   ├── AlertMessage/
│   │   │   └── index.ts
│   │   └── error/
│   │       ├── ErrorBoundary/
│   │       └── index.ts
│   │
│   ├── hooks/
│   │   ├── useDebounce.ts
│   │   ├── useAsyncEffect.ts
│   │   ├── useAsyncOperation.ts
│   │   ├── useMobile.ts
│   │   ├── useResponsive.ts
│   │   ├── useToast.ts
│   │   ├── useTheme.ts
│   │   ├── useNetworkStatus.ts
│   │   └── index.ts
│   │
│   ├── services/
│   │   ├── errorService.ts
│   │   ├── analyticsService.ts
│   │   └── index.ts
│   │
│   ├── types/
│   │   ├── common.types.ts
│   │   ├── api.types.ts
│   │   └── index.ts
│   │
│   ├── utils/
│   │   ├── formatting/
│   │   ├── validation/
│   │   ├── crypto/
│   │   └── index.ts
│   │
│   ├── schemas/
│   │   ├── common.ts
│   │   └── index.ts
│   │
│   └── constants/
│       └── index.ts
│
├── core/                          # ⬅️ Core Infrastruktur
│   ├── api/
│   │   ├── apiClient.ts
│   │   ├── endpoints.ts
│   │   └── index.ts
│   │
│   ├── store/
│   │   ├── store.ts
│   │   ├── store.hooks.ts
│   │   ├── rootReducer.ts
│   │   └── index.ts
│   │
│   ├── router/
│   │   ├── Router.tsx
│   │   ├── routes.ts
│   │   ├── PrivateRoute.tsx
│   │   └── index.ts
│   │
│   ├── providers/
│   │   ├── AppProvider.tsx
│   │   ├── ThemeProvider.tsx
│   │   └── index.ts
│   │
│   ├── config/
│   │   ├── constants.ts
│   │   ├── environment.ts
│   │   └── index.ts
│   │
│   └── signalr/
│       ├── hubConnections.ts
│       └── index.ts
│
├── styles/                        # ⬅️ Globale Styles
│   ├── tokens/
│   │   ├── colors.ts
│   │   ├── spacing.ts
│   │   ├── typography.ts
│   │   └── index.ts
│   ├── mixins.ts
│   ├── theme.ts
│   └── index.ts
│
├── workers/                       # ⬅️ Web Workers
│   └── encryption.worker.ts
│
├── App.tsx
└── main.tsx
```

---

## FEATURE-DETAIL-SPEZIFIKATIONEN

### 1. AUTH FEATURE (`features/auth/`)

**Verantwortlich für:**
- Login/Logout
- Registration
- Email Verification
- Two-Factor Authentication
- Password Reset
- Session Management
- Permissions/RBAC

**Dateien zu migrieren:**

| Von | Nach |
|-----|------|
| `components/auth/*` | `features/auth/components/` |
| `pages/auth/*` | `features/auth/pages/` |
| `hooks/useAuth.ts` | `features/auth/hooks/useAuth.ts` |
| `hooks/useEmailVerification.ts` | `features/auth/hooks/useEmailVerification.ts` |
| `hooks/useTwoFactorDialog.ts` | `features/auth/hooks/useTwoFactor.ts` |
| `api/services/authService.ts` | `features/auth/services/authService.ts` |
| `features/auth/authSlice.ts` | `features/auth/store/authSlice.ts` |
| `store/adapters/authAdapter+State.ts` | `features/auth/store/authAdapter.ts` |
| `store/selectors/authSelectors.ts` | `features/auth/store/authSelectors.ts` |
| `schemas/auth.ts` | `features/auth/schemas/` |
| `contexts/authContext*` | `features/auth/context/` |
| `contexts/permissionContext*` | `features/auth/context/PermissionContext.tsx` |
| `contexts/emailVerificationContext*` | `features/auth/context/EmailVerificationContext.tsx` |

**Public API (`features/auth/index.ts`):**
```typescript
// Components
export { LoginForm } from './components/LoginForm';
export { RegisterForm } from './components/RegisterForm';
export { TwoFactorDialog } from './components/TwoFactorDialog';

// Hooks
export { useAuth } from './hooks/useAuth';
export { useEmailVerification } from './hooks/useEmailVerification';
export { usePermissions } from './hooks/usePermissions';

// Context
export { AuthProvider, useAuthContext } from './context/AuthContext';
export { PermissionProvider } from './context/PermissionContext';

// Store
export { authSlice } from './store/authSlice';
export * from './store/authSelectors';

// Types
export type { User, LoginRequest, RegisterRequest } from './types';

// Constants
export { Permissions } from './constants/permissions';
```

---

### 2. SKILLS FEATURE (`features/skills/`)

**Verantwortlich für:**
- Skill CRUD
- Skill Search
- Skill Categories
- Proficiency Levels
- Favorites
- Ratings & Endorsements

**Dateien zu migrieren:**

| Von | Nach |
|-----|------|
| `components/skills/*` | `features/skills/components/` |
| `pages/skills/*` | `features/skills/pages/` |
| `hooks/useSkills.ts` | `features/skills/hooks/useSkills.ts` |
| `api/services/skillsService.ts` | `features/skills/services/skillsService.ts` |
| `features/skills/skillsSlice.ts` | `features/skills/store/skillsSlice.ts` |
| `store/adapters/skillsAdapter+State.ts` | `features/skills/store/skillsAdapter.ts` |
| `store/selectors/skillsSelectors.ts` | `features/skills/store/skillsSelectors.ts` |
| `store/adapters/categoriesAdapter+State.ts` | `features/skills/store/categoriesAdapter.ts` |
| `store/selectors/categoriesSelectors.ts` | `features/skills/store/categoriesSelectors.ts` |
| `store/adapters/proficiencyLevelAdapter+State.ts` | `features/skills/store/proficiencyAdapter.ts` |
| `store/selectors/proficiencyLevelSelectors.ts` | `features/skills/store/proficiencySelectors.ts` |
| `schemas/skill.ts` | `features/skills/schemas/` |
| `types/models/Skill.ts` | `features/skills/types/` |
| `types/contracts/responses/SkillResponses.ts` | `features/skills/types/` |

**Neue Hooks zu erstellen:**
```typescript
// features/skills/hooks/useSkillsPage.ts
export const useSkillsPage = (showOnly: 'all' | 'mine' | 'favorite') => {
  const { isLoading, error } = useSkillsLoading(showOnly);
  const { skills, handlers } = useSkillsData(showOnly);
  const permissions = useSkillPermissions();

  return { skills, isLoading, error, handlers, permissions };
};

// features/skills/hooks/useSkillsLoading.ts
export const useSkillsLoading = (showOnly: string) => { ... };

// features/skills/hooks/useSkillsData.ts
export const useSkillsData = (showOnly: string) => { ... };
```

---

### 3. MATCHMAKING FEATURE (`features/matchmaking/`)

**Verantwortlich für:**
- Match Requests
- Match List
- Match Status
- Request Management

**Dateien zu migrieren:**

| Von | Nach |
|-----|------|
| `components/matchmaking/*` | `features/matchmaking/components/` |
| `pages/matchmaking/*` | `features/matchmaking/pages/` |
| `hooks/useMatchmaking.ts` | `features/matchmaking/hooks/` |
| `api/services/matchmakingService.ts` | `features/matchmaking/services/` |
| `features/matchmaking/*` | `features/matchmaking/store/` |
| `store/adapters/matchmakingAdapter+State.ts` | `features/matchmaking/store/` |
| `store/selectors/matchmakingSelectors.ts` | `features/matchmaking/store/` |
| `schemas/match.ts` | `features/matchmaking/schemas/` |

---

### 4. APPOINTMENTS FEATURE (`features/appointments/`)

**Verantwortlich für:**
- Appointment Scheduling
- Calendar View
- Time Slots
- Appointment Management

**Dateien zu migrieren:**

| Von | Nach |
|-----|------|
| `components/appointments/*` | `features/appointments/components/` |
| `pages/appointments/*` | `features/appointments/pages/` |
| `hooks/useAppointments.ts` | `features/appointments/hooks/` |
| `hooks/useCalendarIntegration.ts` | `features/appointments/hooks/` |
| `api/services/appointmentService.ts` | `features/appointments/services/` |
| `api/services/calendarService.ts` | `features/appointments/services/` |
| `features/appointments/*` | `features/appointments/store/` |
| `store/adapters/appointmentsAdapter+State.ts` | `features/appointments/store/` |
| `store/selectors/appointmentsSelectors.ts` | `features/appointments/store/` |
| `schemas/appointment.ts` | `features/appointments/schemas/` |

---

### 5. VIDEOCALL FEATURE (`features/videocall/`)

**Verantwortlich für:**
- Video Room Management
- Media Controls
- E2E Encryption
- Participants
- In-Call Chat
- Screen Sharing
- Network Quality

**Bereits teilweise migriert!** (`hooks/videocall/`)

**Dateien zu migrieren:**

| Von | Nach |
|-----|------|
| `components/videocall/*` | `features/videocall/components/` |
| `pages/videocall/*` | `features/videocall/pages/` |
| `hooks/videocall/*` | `features/videocall/hooks/` |
| `hooks/usePreCall.ts` | `features/videocall/hooks/` |
| `hooks/useNetworkQuality.ts` | `features/videocall/hooks/` |
| `api/services/videoCallService.ts` | `features/videocall/services/` |
| `features/videocall/*` | `features/videocall/store/` |
| `store/adapters/videoCallAdapter+State.ts` | `features/videocall/store/` |
| `store/selectors/videoCallSelectors.ts` | `features/videocall/store/` |
| `store/selectors/preCallSelectors.ts` | `features/videocall/store/` |
| `workers/encryption.worker.ts` | `features/videocall/workers/` |

---

### 6. CHAT FEATURE (`features/chat/`)

**Verantwortlich für:**
- Chat Threads
- Messages
- Attachments
- Real-time Updates

**Dateien zu migrieren:**

| Von | Nach |
|-----|------|
| `components/chat/*` | `features/chat/components/` |
| `hooks/useChat.ts` | `features/chat/hooks/` |
| `hooks/useInlineChat.ts` | `features/chat/hooks/` |
| `api/services/chatService.ts` | `features/chat/services/` |
| `services/signalr/chatHub.ts` | `features/chat/services/` |
| `features/chat/*` | `features/chat/store/` |
| `store/adapters/chatAdapter+State.ts` | `features/chat/store/` |
| `store/selectors/chatSelectors.ts` | `features/chat/store/` |

---

### 7. NOTIFICATIONS FEATURE (`features/notifications/`)

**Verantwortlich für:**
- In-App Notifications
- Push Notifications
- Email Notifications
- Notification Preferences

**Dateien zu migrieren:**

| Von | Nach |
|-----|------|
| `components/notifications/*` | `features/notifications/components/` |
| `pages/notifications/*` | `features/notifications/pages/` |
| `hooks/useNotifications.ts` | `features/notifications/hooks/` |
| `hooks/useNotificationHandler.ts` | `features/notifications/hooks/` |
| `hooks/usePushNotifications.ts` | `features/notifications/hooks/` |
| `api/services/notificationService.ts` | `features/notifications/services/` |
| `services/signalr/notificationHub.tsx` | `features/notifications/services/` |
| `services/firebase/*` | `features/notifications/services/firebase/` |
| `features/notifications/*` | `features/notifications/store/` |
| `store/adapters/notificationsAdapter+State.ts` | `features/notifications/store/` |
| `store/selectors/notificationsSelectors.ts` | `features/notifications/store/` |

---

### 8. ADMIN FEATURE (`features/admin/`)

**Verantwortlich für:**
- User Management
- System Metrics
- Announcements
- Email Templates
- Security Alerts

**Dateien zu migrieren:**

| Von | Nach |
|-----|------|
| `components/admin/*` | `features/admin/components/` |
| `pages/admin/*` | `features/admin/pages/` |
| `hooks/useAdmin.ts` | `features/admin/hooks/` |
| `hooks/useAnnouncements.ts` | `features/admin/hooks/` |
| `api/services/adminService.ts` | `features/admin/services/` |
| `api/services/emailTemplateService.ts` | `features/admin/services/` |
| `features/admin/*` | `features/admin/store/` |
| `store/adapters/adminAdapter+State.ts` | `features/admin/store/` |
| `store/selectors/adminSelectors.ts` | `features/admin/store/` |

---

### 9. USER/PROFILE FEATURE (`features/user/`)

**Verantwortlich für:**
- User Profile
- Profile Editing
- Avatar Management

**Dateien zu migrieren:**

| Von | Nach |
|-----|------|
| `components/users/*` | `features/user/components/` |
| `pages/profile/*` | `features/user/pages/` |
| `schemas/user.ts` | `features/user/schemas/` |

---

### 10. SETTINGS FEATURE (`features/settings/`)

**Verantwortlich für:**
- App Settings
- Notification Preferences
- Calendar Integration
- Privacy Settings

**Dateien zu migrieren:**

| Von | Nach |
|-----|------|
| `components/settings/*` | `features/settings/components/` |
| `pages/settings/*` | `features/settings/pages/` |

---

### 11. SEARCH FEATURE (`features/search/`)

**Verantwortlich für:**
- Global Search
- Search Results
- Search Navigation

**Dateien zu migrieren:**

| Von | Nach |
|-----|------|
| `pages/search/*` | `features/search/pages/` |
| `hooks/useSearchNavigation.ts` | `features/search/hooks/` |
| `features/search/*` | `features/search/store/` |
| `store/adapters/searchAdapter+State.ts` | `features/search/store/` |
| `store/selectors/searchSelectors.ts` | `features/search/store/` |

---

### 12. DASHBOARD FEATURE (`features/dashboard/`)

**Verantwortlich für:**
- Dashboard Overview
- Quick Actions
- Statistics

**Dateien zu migrieren:**

| Von | Nach |
|-----|------|
| `pages/DashboardPage.tsx` | `features/dashboard/pages/` |
| `hooks/useDashboard.ts` | `features/dashboard/hooks/` |
| `store/selectors/dashboardSelectors.ts` | `features/dashboard/store/` |

---

## SHARED COMPONENTS SPEZIFIKATION

### UI Components (`shared/components/ui/`)

```
ui/
├── Button/
│   ├── Button.tsx
│   ├── Button.types.ts
│   ├── Button.styles.ts
│   └── index.ts
├── LoadingButton/
├── IconButton/
├── Card/
├── Paper/
├── Modal/
├── Dialog/
├── Alert/
├── AlertMessage/
├── Toast/
├── Tooltip/
├── Badge/
├── Avatar/
├── Chip/
├── SkeletonLoader/
├── EmptyState/
├── ConfirmDialog/
├── Pagination/
└── index.ts
```

### Layout Components (`shared/components/layout/`)

```
layout/
├── Sidebar/
│   ├── Sidebar.tsx
│   ├── SidebarHeader.tsx
│   ├── SidebarNavigation.tsx
│   ├── SidebarFooter.tsx
│   ├── useSidebar.ts
│   └── index.ts
├── Header/
├── Footer/
├── Tabbar/
├── PageContainer/
├── MainLayout/
└── index.ts
```

### Form Components (`shared/components/forms/`)

```
forms/
├── FormField/
├── FormSelect/
├── FormDatePicker/
├── FormSwitch/
├── FormCheckbox/
└── index.ts
```

---

## CORE INFRASTRUKTUR SPEZIFIKATION

### API (`core/api/`)

```typescript
// core/api/apiClient.ts
export const apiClient = {
  get, post, put, patch, delete,
  getPaged, // Paginierte Requests
};

// core/api/endpoints.ts
export const ENDPOINTS = {
  AUTH: { ... },
  SKILLS: { ... },
  MATCHMAKING: { ... },
  // ...
};
```

### Store (`core/store/`)

```typescript
// core/store/store.ts
import { authReducer } from '@/features/auth/store';
import { skillsReducer } from '@/features/skills/store';
// ...

const rootReducer = combineReducers({
  auth: authReducer,
  skills: skillsReducer,
  // ...
});

// core/store/store.hooks.ts
export const useAppDispatch = ...;
export const useAppSelector = ...;
```

### Router (`core/router/`)

```typescript
// core/router/routes.ts
import { LoginPage } from '@/features/auth';
import { SkillsPage } from '@/features/skills';

export const routes = [
  { path: '/login', element: <LoginPage /> },
  { path: '/skills', element: <SkillsPage /> },
  // ...
];
```

---

## MIGRATIONS-PLAN

### PHASE 1: Vorbereitung (2-3 Stunden)

1. **Ordnerstruktur erstellen**
   ```bash
   mkdir -p src/features/{auth,skills,matchmaking,appointments,videocall,chat,notifications,admin,user,settings,search,dashboard}/{components,hooks,pages,services,store,types,schemas}
   mkdir -p src/shared/{components/{ui,layout,forms,feedback,error},hooks,services,types,utils,schemas,constants}
   mkdir -p src/core/{api,store,router,providers,config,signalr}
   ```

2. **Path Aliases konfigurieren** (`tsconfig.json`)
   ```json
   {
     "compilerOptions": {
       "paths": {
         "@/*": ["./src/*"],
         "@features/*": ["./src/features/*"],
         "@shared/*": ["./src/shared/*"],
         "@core/*": ["./src/core/*"]
       }
     }
   }
   ```

3. **Vite Aliases konfigurieren** (`vite.config.ts`)
   ```typescript
   resolve: {
     alias: {
       '@': path.resolve(__dirname, './src'),
       '@features': path.resolve(__dirname, './src/features'),
       '@shared': path.resolve(__dirname, './src/shared'),
       '@core': path.resolve(__dirname, './src/core'),
     }
   }
   ```

---

### PHASE 2: Core & Shared migrieren (3-4 Stunden)

1. **Core API migrieren**
   - `api/apiClient.ts` → `core/api/apiClient.ts`
   - `config/endpoints.ts` → `core/api/endpoints.ts`
   - `config/constants.ts` → `core/config/constants.ts`

2. **Core Store migrieren**
   - `store/store.ts` → `core/store/store.ts`
   - `store/store.hooks.ts` → `core/store/store.hooks.ts`

3. **Core Router migrieren**
   - `routes/Router.tsx` → `core/router/Router.tsx`
   - `components/routing/*` → `core/router/`

4. **Shared UI migrieren**
   - `components/ui/*` → `shared/components/ui/`
   - Jede Komponente in eigenen Ordner

5. **Shared Layout migrieren**
   - `components/layout/*` → `shared/components/layout/`

6. **Shared Hooks migrieren**
   - Utility Hooks → `shared/hooks/`

7. **Styles migrieren**
   - `styles/*` → bleibt, ist bereits gut strukturiert

---

### PHASE 3: Auth Feature (2-3 Stunden)

1. Komponenten migrieren
2. Hooks migrieren
3. Pages migrieren
4. Services migrieren
5. Store migrieren
6. Schemas migrieren
7. Types konsolidieren
8. Index.ts erstellen
9. Imports aktualisieren

---

### PHASE 4: Skills Feature (3-4 Stunden)

1. Komponenten migrieren (inkl. Detail-Module)
2. Hooks migrieren + neue Hooks erstellen
3. Pages migrieren
4. Services migrieren
5. Store migrieren
6. Schemas migrieren
7. Types konsolidieren
8. Index.ts erstellen
9. Imports aktualisieren

---

### PHASE 5: Matchmaking Feature (2 Stunden)

*Analog zu Skills*

---

### PHASE 6: Appointments Feature (2-3 Stunden)

*Analog zu Skills*

---

### PHASE 7: VideoCall Feature (2 Stunden)

*Bereits teilweise vorbereitet*

---

### PHASE 8: Chat Feature (1-2 Stunden)

*Analog zu Skills*

---

### PHASE 9: Notifications Feature (1-2 Stunden)

*Analog zu Skills*

---

### PHASE 10: Admin Feature (2 Stunden)

*Analog zu Skills*

---

### PHASE 11: Restliche Features (2 Stunden)

- User/Profile
- Settings
- Search
- Dashboard

---

### PHASE 12: Cleanup & Verification (2 Stunden)

1. **Alte Ordner löschen**
   - `components/` (leer nach Migration)
   - `pages/` (leer nach Migration)
   - `contexts/` (in Features integriert)
   - `hocs/` (in Features integriert)

2. **Import-Überprüfung**
   - Alle relativen Imports → Alias Imports
   - Zirkuläre Abhängigkeiten prüfen

3. **TypeScript Check**
   ```bash
   npx tsc --noEmit
   ```

4. **ESLint Check**
   ```bash
   npx eslint src/ --max-warnings 0
   ```

5. **Build Check**
   ```bash
   npm run build
   ```

---

## IMPORT-KONVENTIONEN

### Vorher (chaotisch)
```typescript
import { useAuth } from '../../../hooks/useAuth';
import { LoginForm } from '../../../components/auth/LoginForm';
import { authService } from '../../../api/services/authService';
import { selectUser } from '../../../store/selectors/authSelectors';
```

### Nachher (sauber)
```typescript
import { useAuth, LoginForm, authService, selectUser } from '@features/auth';
// ODER für spezifische Imports:
import { useAuth } from '@features/auth/hooks';
import { LoginForm } from '@features/auth/components';
```

---

## FEATURE INDEX TEMPLATE

```typescript
// features/[feature]/index.ts

// Components
export * from './components';

// Hooks
export * from './hooks';

// Pages
export * from './pages';

// Store
export { [feature]Slice } from './store/[feature]Slice';
export * from './store/[feature]Selectors';

// Services
export * from './services';

// Types
export * from './types';

// Schemas (nur wenn extern genutzt)
export * from './schemas';
```

---

## HOOK-OPTIMIERUNG REGELN

### ✅ DO

```typescript
// Einfache Dependencies
const isFavorite = useMemo(
  () => selectedSkill?.id ? isFavoriteSkill(selectedSkill.id) : false,
  [selectedSkill, isFavoriteSkill] // Ganzes Objekt, nicht .id
);

// Handler direkt übergeben, nicht wrappen
onDelete={handleDelete}

// Kurze arrow functions mit braces für void
onClick={() => { setOpen(true); }}
```

### ❌ DON'T

```typescript
// Unnötige Wrapper
const handleDeleteForList = useCallback(
  (id) => handleDelete(id),
  [handleDelete]
);

// Fragmentierte Dependencies
[selectedSkill?.id, selectedSkill?.name]

// Implizite void returns
onClick={() => setOpen(true)}
```

---

## GESCHÄTZTER AUFWAND

| Phase | Beschreibung | Stunden |
|-------|-------------|---------|
| 1 | Vorbereitung | 2-3 |
| 2 | Core & Shared | 3-4 |
| 3 | Auth Feature | 2-3 |
| 4 | Skills Feature | 3-4 |
| 5 | Matchmaking Feature | 2 |
| 6 | Appointments Feature | 2-3 |
| 7 | VideoCall Feature | 2 |
| 8 | Chat Feature | 1-2 |
| 9 | Notifications Feature | 1-2 |
| 10 | Admin Feature | 2 |
| 11 | Restliche Features | 2 |
| 12 | Cleanup & Verification | 2 |
| **TOTAL** | | **24-32 Stunden** |

---

## NÄCHSTE SCHRITTE

1. [ ] **Phase 1:** Ordnerstruktur + Aliases konfigurieren
2. [ ] **Phase 2:** Core & Shared migrieren
3. [ ] **Phase 3:** Auth Feature komplett migrieren
4. [ ] **Phase 4:** Skills Feature komplett migrieren
5. [ ] Weitere Features in Reihenfolge migrieren
6. [ ] Cleanup durchführen
7. [ ] Vollständiger Build + Tests

---

## RISIKEN & MITIGATION

| Risiko | Mitigation |
|--------|-----------|
| Zirkuläre Imports | Features dürfen nur über Public API kommunizieren |
| Große PRs | In kleine, feature-basierte PRs aufteilen |
| Regressionen | TypeScript + ESLint strikt halten |
| Import-Chaos | Path Aliases konsequent nutzen |

---

*Erstellt am: 2025-12-19*
*Letzte Aktualisierung: 2025-12-19*
