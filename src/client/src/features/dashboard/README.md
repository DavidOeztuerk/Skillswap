# Dashboard Feature

Complete feature-based structure for the Dashboard module.

## Structure

```
features/dashboard/
├── components/          # Dashboard-specific components (empty - no specific components yet)
│   └── index.ts
├── hooks/              # Dashboard hooks
│   ├── useDashboard.ts # Main dashboard hook with selectors and actions
│   └── index.ts
├── pages/              # Dashboard pages
│   ├── DashboardPage.tsx  # Main dashboard page
│   └── index.ts
├── store/              # Empty (uses shared store/selectors/dashboardSelectors.ts)
├── index.ts            # Public API
└── README.md           # This file
```

## Key Files

### Pages

- **DashboardPage.tsx**: Main dashboard page showing user overview, stats, upcoming appointments, and skills

### Hooks

- **useDashboard.ts**: Selector-based hook that provides dashboard data and actions
  - Uses dashboard selectors from `@/store/selectors/dashboardSelectors`
  - Provides action dispatchers for loading/refreshing data
  - NO useEffects (prevents infinite loops)
  - Stateless design

### Store

Dashboard uses centralized selectors located at:

- `/src/client/src/store/selectors/dashboardSelectors.ts`

This follows the pattern of having shared selectors that combine data from multiple feature slices.

## Import Paths

### Internal (within dashboard feature)

```typescript
// In DashboardPage.tsx
import { useDashboard } from '../hooks/useDashboard';
```

### External (from other features/modules)

```typescript
// From router or other features
import { DashboardPage } from '@/features/dashboard';
import { useDashboard } from '@/features/dashboard';
```

## Migration Notes

Successfully migrated from:

- `src/pages/DashboardPage.tsx` → `src/features/dashboard/pages/DashboardPage.tsx`
- `src/hooks/useDashboard.ts` → `src/features/dashboard/hooks/useDashboard.ts`

All imports updated:

- ✅ Router.tsx updated to import from features/dashboard
- ✅ All internal imports use `@/` path alias
- ✅ Old files deleted
- ✅ TypeScript compilation successful

## Dependencies

### Internal Features

- `@/features/auth` - User authentication data
- `@/features/skills` - Skills data and thunks
- `@/features/matchmaking` - Matches and match requests
- `@/features/appointments` - Appointments data
- `@/features/notifications` - Notifications data

### Shared

- `@/store/selectors/dashboardSelectors` - Centralized dashboard selectors
- `@/components/layout/*` - Layout components (PageHeader, PageContainer)
- `@/components/ui/*` - UI components (SkeletonLoader)
- `@/components/error/*` - Error handling components
- `@/hooks/useApiErrorRecovery` - Error recovery hook
- `@/contexts/loadingContextHooks` - Loading state management

## Architecture

The dashboard follows a **selector-first approach**:

1. **Data Source**: Multiple Redux slices (skills, appointments, matches, notifications)
2. **Data Aggregation**: Centralized dashboard selectors combine and transform data
3. **Hook Layer**: `useDashboard` hook consumes selectors and provides actions
4. **UI Layer**: `DashboardPage` component uses the hook to display data

This architecture prevents prop drilling and ensures the dashboard always has access to the latest data from all features.
