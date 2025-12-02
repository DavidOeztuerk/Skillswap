// import React, { useMemo } from 'react';
// import { Navigate, useLocation } from 'react-router-dom';
// import { useAuth } from '../hooks/useAuth';
// import { usePermissions } from '../contexts/PermissionContext';
// import LoadingSpinner from '../components/ui/LoadingSpinner';
// import { withDefault } from '../utils/safeAccess';
// import { getToken } from '../utils/authHelpers';

// // ============================================================================
// // Types
// // ============================================================================

// /**
//  * Configuration for PrivateRoute
//  */
// interface PrivateRouteConfig {
//   /** Required roles (any match grants access) */
//   roles?: string[];
//   /** Required permissions (any match grants access) */
//   permissions?: string[];
//   /** Redirect path for unauthenticated users */
//   redirectTo?: string;
//   /** Redirect path for unauthorized users (missing roles/permissions) */
//   unauthorizedRedirect?: string;
//   /** Custom loading component */
//   loadingComponent?: React.ComponentType<{ message?: string }>;
// }

// interface PrivateRouteProps extends PrivateRouteConfig {
//   children: React.ReactNode;
// }

// /**
//  * Authorization status enum
//  */
// enum AuthStatus {
//   LOADING = 'loading',
//   AUTHENTICATED = 'authenticated',
//   UNAUTHENTICATED = 'unauthenticated',
//   UNAUTHORIZED = 'unauthorized',
// }

// interface AuthStatusResult {
//   status: AuthStatus;
//   reason?: string;
//   details?: {
//     required: string[];
//     user: string[];
//   };
// }

// // ============================================================================
// // Constants
// // ============================================================================

// const DEBUG = import.meta.env.DEV;

// // ============================================================================
// // Authorization Hook
// // ============================================================================

// /**
//  * Hook for authorization logic
//  * Separated for testability and reusability
//  */
// const useAuthorizationStatus = (
//   requiredRoles: string[],
//   requiredPermissions: string[]
// ): AuthStatusResult => {
//   const { isAuthenticated, isLoading, user } = useAuth();
//   const {
//     hasAnyRole,
//     hasAnyPermission,
//     roles: contextRoles,
//     permissions: contextPermissions,
//     loading: permissionsLoading,
//   } = usePermissions();

//   return useMemo(() => {
//     // Step 1: Check if auth is loading
//     if (isLoading) {
//       return { status: AuthStatus.LOADING, reason: 'Überprüfe Berechtigung...' };
//     }

//     // Step 2: Check authentication
//     if (!isAuthenticated) {
//       // Fallback: Check for stored token (AuthProvider might be initializing)
//       const hasStoredToken = Boolean(getToken());

//       if (hasStoredToken) {
//         if (DEBUG) {
//           console.debug('⏳ PrivateRoute: Token found but not authenticated - waiting for AuthProvider');
//         }
//         return { status: AuthStatus.LOADING, reason: 'Lade Benutzerdaten...' };
//       }

//       if (DEBUG) {
//         console.debug('🚫 PrivateRoute: No authentication found');
//       }
//       return { status: AuthStatus.UNAUTHENTICATED, reason: 'Nicht angemeldet' };
//     }

//     // Step 3: Check for user data (edge case after login)
//     if (!user) {
//       const hasStoredToken = Boolean(getToken());

//       if (!hasStoredToken) {
//         if (DEBUG) {
//           console.debug('⚠️ PrivateRoute: No user data and no token');
//         }
//         return { status: AuthStatus.UNAUTHENTICATED, reason: 'Session abgelaufen' };
//       }

//       if (DEBUG) {
//         console.debug('⏳ PrivateRoute: Authenticated but no user data - waiting for profile');
//       }
//       return { status: AuthStatus.LOADING, reason: 'Lade Benutzerprofil...' };
//     }

//     // Step 4: Wait for permissions to load if needed
//     if (permissionsLoading && (requiredRoles.length > 0 || requiredPermissions.length > 0)) {
//       return { status: AuthStatus.LOADING, reason: 'Lade Berechtigungen...' };
//     }

//     // Step 5: Check roles (if specified)
//     if (requiredRoles.length > 0 && !hasAnyRole(...requiredRoles)) {
//       if (DEBUG) {
//         console.debug('🔐 PrivateRoute: Role check failed', {
//           required: requiredRoles,
//           userRoles: contextRoles,
//         });
//       }
//       return {
//         status: AuthStatus.UNAUTHORIZED,
//         reason: 'Fehlende Rolle',
//         details: { required: requiredRoles, user: contextRoles },
//       };
//     }

//     // Step 6: Check permissions (if specified)
//     if (requiredPermissions.length > 0 && !hasAnyPermission(...requiredPermissions)) {
//       if (DEBUG) {
//         console.debug('🔐 PrivateRoute: Permission check failed', {
//           required: requiredPermissions,
//           userPermissions: contextPermissions,
//         });
//       }
//       return {
//         status: AuthStatus.UNAUTHORIZED,
//         reason: 'Fehlende Berechtigung',
//         details: { required: requiredPermissions, user: contextPermissions },
//       };
//     }

//     // All checks passed
//     return { status: AuthStatus.AUTHENTICATED };
//   }, [
//     isAuthenticated,
//     isLoading,
//     user,
//     permissionsLoading,
//     requiredRoles,
//     requiredPermissions,
//     hasAnyRole,
//     hasAnyPermission,
//     contextRoles,
//     contextPermissions,
//   ]);
// };

// // ============================================================================
// // Component
// // ============================================================================

// /**
//  * PrivateRoute Component
//  * Protects routes based on authentication, roles, and permissions
//  *
//  * @example
//  * // Basic auth protection
//  * <PrivateRoute>
//  *   <Dashboard />
//  * </PrivateRoute>
//  *
//  * @example
//  * // With role requirement
//  * <PrivateRoute roles={['Admin']}>
//  *   <AdminPanel />
//  * </PrivateRoute>
//  *
//  * @example
//  * // With permission requirement
//  * <PrivateRoute permissions={['users:manage']}>
//  *   <UserManagement />
//  * </PrivateRoute>
//  */
// const PrivateRoute: React.FC<PrivateRouteProps> = ({
//   children,
//   roles = [],
//   permissions = [],
//   redirectTo = '/auth/login',
//   unauthorizedRedirect = '/forbidden',
//   loadingComponent: LoadingComponent = LoadingSpinner,
// }) => {
//   const location = useLocation();

//   // Get authorization status
//   const authStatus = useAuthorizationStatus(roles, permissions);

//   // Development logging for unauthorized access
//   if (DEBUG && authStatus.status === AuthStatus.UNAUTHORIZED) {
//     console.warn(
//       `[PrivateRoute] Access denied for ${location.pathname}`,
//       authStatus.details
//     );
//   }

//   // Render based on status
//   switch (authStatus.status) {
//     case AuthStatus.LOADING:
//       return <LoadingComponent message={withDefault(authStatus.reason, 'Lädt...')} />;

//     case AuthStatus.UNAUTHENTICATED:
//       return <Navigate to={redirectTo} state={{ from: location }} replace />;

//     case AuthStatus.UNAUTHORIZED:
//       return (
//         <Navigate
//           to={unauthorizedRedirect}
//           state={{ from: location, reason: authStatus.reason }}
//           replace
//         />
//       );

//     case AuthStatus.AUTHENTICATED:
//       return <>{children}</>;

//     default:
//       // Should never reach here
//       return null;
//   }
// };

// // ============================================================================
// // HOC Version
// // ============================================================================

// /**
//  * Higher-Order Component version of PrivateRoute
//  *
//  * @example
//  * const ProtectedPage = withPrivateRoute(MyPage, { roles: ['Admin'] });
//  */
// export const withPrivateRoute = <P extends object>(
//   Component: React.ComponentType<P>,
//   config?: PrivateRouteConfig
// ) => {
//   const WrappedComponent: React.FC<P> = (props) => (
//     <PrivateRoute {...(config || {})}>
//       <Component {...props} />
//     </PrivateRoute>
//   );

//   WrappedComponent.displayName = `withPrivateRoute(${
//     withDefault(Component.displayName, Component.name) || 'Component'
//   })`;

//   return WrappedComponent;
// };

// export default PrivateRoute;

// // Type exports
// export type { PrivateRouteProps, PrivateRouteConfig };
