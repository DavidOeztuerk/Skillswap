# ESLint Fixes Required for Pages Directory

## Summary
Total: **762 problems** (372 errors, 390 warnings) across all page files (excluding admin)

## Common Error Patterns and Fixes

### 1. `@typescript-eslint/restrict-template-expressions` - Invalid template expression types
**Error**: Numbers, any, or unknown types in template literals
**Fix**: Wrap in `String()`

```typescript
// ❌ Before
`Level: ${userSkill.proficiencyLevel?.level}`
`Page ${currentPage}`

// ✅ After
`Level: ${String(userSkill.proficiencyLevel?.level)}`
`Page ${String(currentPage)}`
```

### 2. `@typescript-eslint/no-floating-promises` - Unhandled promises
**Error**: Promise not awaited or handled
**Fix**: Add `void` keyword or `await` in async context

```typescript
// ❌ Before
navigate('/dashboard');
dispatch(fetchData());

// ✅ After
void navigate('/dashboard');
void dispatch(fetchData());
// Or in async function:
await dispatch(fetchData()).unwrap();
```

### 3. `@typescript-eslint/explicit-function-return-type` - Missing return types
**Error**: Functions without explicit return type
**Fix**: Add `: void`, `: JSX.Element`, etc.

```typescript
// ❌ Before
const handleClick = () => {
  doSomething();
};

// ✅ After
const handleClick = (): void => {
  doSomething();
};
```

### 4. `@typescript-eslint/prefer-nullish-coalescing` - Use ?? instead of ||
**Error**: Using || operator where ?? is safer
**Fix**: Replace || with ??

```typescript
// ❌ Before
const name = user?.name || 'Unknown';

// ✅ After
const name = user?.name ?? 'Unknown';
```

### 5. `@typescript-eslint/strict-boolean-expressions` - Implicit boolean coercion
**Error**: Non-boolean in conditional
**Fix**: Explicit null/undefined/length checks

```typescript
// ❌ Before
if (data) { }
if (array?.length) { }

// ✅ After
if (data !== null && data !== undefined) { }
if (array !== undefined && array.length > 0) { }
```

### 6. `@typescript-eslint/no-unsafe-assignment` - Unsafe any type usage
**Error**: Assigning from error/any typed values
**Fix**: Proper typing with type assertions or guards

```typescript
// ❌ Before
const { data } = useSelector(state => state.something);

// ✅ After
const { data } = useSelector(state => state.something) as SomeType;
```

### 7. `@typescript-eslint/no-confusing-void-expression` - Void in expression
**Error**: Using void-returning function in expression
**Fix**: Separate void expressions to own statements

```typescript
// ❌ Before
const result = await dispatch(someAction());

// ✅ After
dispatch(someAction());
// Or if you need the result:
void dispatch(someAction());
```

### 8. `@typescript-eslint/await-thenable` - Awaiting non-promise
**Error**: Using await on non-Promise
**Fix**: Remove await or fix the function

```typescript
// ❌ Before
await dispatch(action());  // if dispatch doesn't return Promise

// ✅ After
dispatch(action());
```

### 9. `@typescript-eslint/no-unnecessary-condition` - Redundant checks
**Error**: Checking conditions that are always true/false
**Fix**: Remove unnecessary optional chains or conditions

```typescript
// ❌ Before
const value = appointment?.skill?.name ?? 'Skill';  // if skill is never undefined

// ✅ After
const value = appointment.skill.name;
```

### 10. `default-case` - Missing default in switch
**Error**: Switch statement without default case
**Fix**: Add default case

```typescript
// ❌ Before
switch (status) {
  case 'active': return 'Active';
  case 'pending': return 'Pending';
}

// ✅ After
switch (status) {
  case 'active': return 'Active';
  case 'pending': return 'Pending';
  default: return 'Unknown';
}
```

## File-Specific Error Counts

### High Priority (>20 errors)
- **VideoCallPage.tsx**: ~150+ errors (largest file)
- **AppointmentDetailPage.tsx**: ~40 errors
- **MatchDetailPage.tsx**: ~25 errors
- **AppointmentsPage.tsx**: ~25 errors

### Medium Priority (10-20 errors)
- **SkillsPage.tsx**
- **SkillDetailPage.tsx**
- **MatchmakingPage.tsx**
- **SearchResultsPage.tsx**

### Low Priority (<10 errors)
- **ProfilePage.tsx**
- **SessionDetailPage.tsx**
- **SkillEditPage.tsx**
- **FavoriteSkillsPage.tsx**
- **ErrorTestPage.tsx**

## Systematic Fix Approach

### Phase 1: Auto-fixable (DONE)
```bash
npx eslint src/pages/ --ignore-pattern "src/pages/admin/*" --fix
```

### Phase 2: Template Expressions
Find and fix all template expression errors:
- Wrap numeric properties in `String()`
- Wrap potentially undefined values with appropriate checks

### Phase 3: Floating Promises
Add `void` before all unhandled promises:
- navigate() calls
- dispatch() calls
- Other promise-returning functions

### Phase 4: Function Return Types
Add explicit return types to all functions:
- Event handlers: `: void`
- Components: `: JSX.Element`
- Async functions: `: Promise<void>` or `: Promise<T>`

### Phase 5: Null Coalescing
Replace || with ?? where appropriate:
- String defaults
- Number defaults
- Object defaults

### Phase 6: Boolean Expressions
Fix implicit boolean coercions:
- Add explicit !== null && !== undefined checks
- Add .length > 0 for arrays
- Add explicit boolean conversions where needed

### Phase 7: Type Safety
Fix unsafe type operations:
- Add proper type annotations
- Use type guards
- Add type assertions where safe

## Quick Reference Commands

```bash
# Check errors per file
npx eslint src/pages/ --ignore-pattern "src/pages/admin/*" --format json | jq -r '.[] | "\(.filePath): \(.errorCount) errors"'

# Check specific error type
npx eslint src/pages/ --ignore-pattern "src/pages/admin/*" 2>&1 | grep "restrict-template-expressions"

# Fix specific file
npx eslint src/pages/videocall/VideoCallPage.tsx --fix

# Count total errors
npx eslint src/pages/ --ignore-pattern "src/pages/admin/*" 2>&1 | tail -1
```

## Recommended Next Steps

1. **Immediate**: Focus on VideoCallPage.tsx (largest impact)
2. **Short-term**: Fix all appointment and matchmaking pages
3. **Medium-term**: Fix skills and profile pages
4. **Long-term**: Fix test and edge case pages

## Notes

- DashboardPage.tsx: ✅ FIXED (was auto-fixed by linter)
- ForbiddenPage.tsx: ✅ CLEAN (no errors)
- NotFoundPage.tsx: ✅ CLEAN (no errors)

- Some errors require understanding business logic and can't be automatically fixed
- Type safety errors may require updating interfaces/types
- Be careful with void expressions - some dispatches return unwrappable promises





scheduleNextRefresh called
tokenRefreshService.ts:37 🔍 [TokenRefreshService] Has token: true
authHelpers.ts:261 🔐 Token expires in: 8 minutes
tokenRefreshService.ts:45 🔍 [TokenRefreshService] Is token expired? false
authHelpers.ts:261 🔐 Token expires in: 8 minutes
tokenRefreshService.ts:54 🔍 [TokenRefreshService] Time until expiry (ms): 450178
tokenRefreshService.ts:55 🔍 [TokenRefreshService] Time until expiry (minutes): 8
tokenRefreshService.ts:67 🔍 [TokenRefreshService] Will refresh in (ms): 330178
tokenRefreshService.ts:68 🔍 [TokenRefreshService] Will refresh in (minutes): 6
apiClient.ts:425 🚀 [req_1765987218888_9x1qqizum] POST /api/users/calendar/connect/apple data={"credentials":"ZGEub2VAaWNsb3VkLmNvbTpxYXh0LXhvY2Qta3BheC14dWNw"}
apiClient.ts:451 ✅ [req_1765987218888_9x1qqizum] Response in 134.70ms
useNetworkStatus.ts:226 🌐 Network Status Updated: {isOnline: true, effectiveType: '4g', connectionType: 'unknown', downlink: '10.00 Mbps', rtt: '50 ms', …}
react-dom_client.js?v=0492ff8c:13527 [Violation] 'click' handler took 322ms
apiClient.ts:425 🚀 [req_1765987245515_6mkwe5mza] PUT /api/notifications/preferences data={"emailEnabled":true,"emailMarketing":true,"emailSecurity":true,"emailUpdates":true,"smsEnabled":false,"smsSecurity":false,"smsReminders":false,"pushEnabled":true,"pushMarketing":false,"pushSecurity":true,"pushUpdates":true,"timeZone":"Europe/Berlin","digestFrequency":"Daily","language":"de"}
apiClient.ts:451 ✅ [req_1765987245515_6mkwe5mza] Response in 1005.90ms
react-dom_client.js?v=0492ff8c:13527 [Violation] 'loadend' handler took 347ms
useNetworkStatus.ts:226 🌐 Network Status Updated: {isOnline: true, effectiveType: '4g', connectionType: 'unknown', downlink: '10.00 Mbps', rtt: '50 ms', …}
useNetworkStatus.ts:226 🌐 Network Status Updated: {isOnline: true, effectiveType: '4g', connectionType: 'unknown', downlink: '10.00 Mbps', rtt: '50 ms', …}
useNetworkStatus.ts:226 🌐 Network Status Updated: {isOnline: true, effectiveType: '4g', connectionType: 'unknown', downlink: '10.00 Mbps', rtt: '50 ms', …}
authHelpers.ts:261 🔐 Token expires in: 5 minutes
tokenRefreshService.ts:36 🔍 [TokenRefreshService] scheduleNextRefresh called
tokenRefreshService.ts:37 🔍 [TokenRefreshService] Has token: true
authHelpers.ts:261 🔐 Token expires in: 5 minutes
tokenRefreshService.ts:45 🔍 [TokenRefreshService] Is token expired? false
authHelpers.ts:261 🔐 Token expires in: 5 minutes
tokenRefreshService.ts:54 🔍 [TokenRefreshService] Time until expiry (ms): 310155
tokenRefreshService.ts:55 🔍 [TokenRefreshService] Time until expiry (minutes): 5
tokenRefreshService.ts:67 🔍 [TokenRefreshService] Will refresh in (ms): 190155
tokenRefreshService.ts:68 🔍 [TokenRefreshService] Will refresh in (minutes): 3
useNetworkStatus.ts:226 🌐 Network Status Updated: {isOnline: true, effectiveType: '4g', connectionType: 'unknown', downlink: '10.00 Mbps', rtt: '50 ms', …}
useNetworkStatus.ts:226 🌐 Network Status Updated: {isOnline: true, effectiveType: '4g', connectionType: 'unknown', downlink: '10.00 Mbps', rtt: '50 ms', …}