# Validation Strategy

## Decision: Defense in Depth (Frontend + Backend Validation)

**Date:** December 2024
**Status:** Accepted

---

## Context

We evaluated two validation strategies for the Skillswap application:

### Option 1: Backend-Only Validation

```
Frontend → API Request → Backend validates → Error Response → Frontend displays error
```

**Pros:**
- Single source of truth for all validation rules
- Cannot be bypassed (security)
- Simpler frontend code
- Rules only maintained in one place

**Cons:**
- Slower feedback (requires server roundtrip)
- More API calls when validation fails
- Higher server load for simple validation errors

### Option 2: Frontend + Backend Validation (Defense in Depth)

```
Frontend validates (UX) → API Request → Backend validates (Security) → Response
```

**Pros:**
- Instant feedback for users (better UX)
- Reduced server load (invalid requests filtered early)
- Backend still validates (security not compromised)
- Faster perceived performance

**Cons:**
- Validation logic in two places
- Need to keep frontend/backend rules in sync

---

## Decision

We chose **Option 2: Defense in Depth** for the following reasons:

1. **Better User Experience**: Users get instant feedback without waiting for server responses
2. **Security Not Compromised**: Backend ALWAYS validates, regardless of frontend validation
3. **Performance**: Reduces unnecessary API calls and server load
4. **Pragmatic Balance**: Frontend handles format validation, backend handles business logic

---

## Implementation Guidelines

### Frontend Validation (Zod Schemas)

Used for:
- Required field checks
- Format validation (email, phone, etc.)
- Length constraints (min/max)
- Password complexity rules
- Field matching (e.g., confirmPassword === newPassword)

```typescript
// Example: Password change schema
const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password required'),
  newPassword: z.string()
    .min(8, 'Minimum 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[a-z]/, 'Must contain lowercase')
    .regex(/[0-9]/, 'Must contain number'),
  confirmPassword: z.string().min(1, 'Confirmation required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
```

### Backend Validation (FluentValidation)

Used for:
- All frontend validations (repeated for security)
- Business logic validation:
  - Email already registered?
  - Resource exists?
  - User has permission?
  - Cross-service validation

```csharp
// Example: FluentValidation for field validation
public class ChangePasswordCommandValidator : AbstractValidator<ChangePasswordCommand>
{
    public ChangePasswordCommandValidator()
    {
        RuleFor(x => x.CurrentPassword)
            .NotEmpty().WithMessage("Current password is required");

        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage("New password is required")
            .MinimumLength(8).WithMessage("Password must be at least 8 characters");
    }
}

// Business logic validation in Handler
public async Task<ApiResponse> Handle(ChangePasswordCommand request)
{
    var user = await _userRepository.GetByIdAsync(request.UserId);
    if (user == null)
        return ApiResponse.Failure("User not found");

    if (!_passwordHasher.Verify(request.CurrentPassword, user.PasswordHash))
        return ApiResponse.Failure("Current password is incorrect");

    // ... proceed with password change
}
```

### Special Case: confirmPassword

The `confirmPassword` field is **frontend-only** because:
- It's a UX feature to prevent typos, not a security measure
- Backend cannot determine if a user "intended" to type something else
- Sending it to backend serves no purpose
- If user makes a typo, they simply reset the password

```typescript
// Frontend: validates confirmPassword
changePassword({
  userId: user.id,
  currentPassword: data.currentPassword,
  newPassword: data.newPassword,
  // confirmPassword NOT sent - already validated by Zod
});
```

---

## Error Handling Flow

```
1. User submits form
   ↓
2. Zod validates on frontend
   ├── If invalid → Show inline errors immediately
   └── If valid → Continue to API call
       ↓
3. API request to backend
   ↓
4. FluentValidation validates
   ├── If invalid → Return 400 with errors
   └── If valid → Continue to handler
       ↓
5. Handler executes business logic
   ├── If business rule fails → Return error response
   └── If success → Return success response
       ↓
6. Frontend receives response
   ├── If error → Display error message (toast/inline)
   └── If success → Update UI, show success message
```

---

## Summary

| Validation Type | Frontend | Backend | Notes |
|-----------------|----------|---------|-------|
| Required fields | ✅ | ✅ | Both for UX + security |
| Format (email, etc.) | ✅ | ✅ | Both for UX + security |
| Length constraints | ✅ | ✅ | Both for UX + security |
| Password complexity | ✅ | ✅ | Both for UX + security |
| confirmPassword match | ✅ | ❌ | Frontend-only (UX feature) |
| Email already exists | ❌ | ✅ | Backend-only (database check) |
| Resource exists | ❌ | ✅ | Backend-only (database check) |
| User permissions | ❌ | ✅ | Backend-only (security) |
| Cross-service checks | ❌ | ✅ | Backend-only (architecture) |

This strategy provides the best balance between user experience and security.
