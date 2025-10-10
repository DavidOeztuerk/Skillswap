import React, { useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../contexts/PermissionContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { withDefault } from '../utils/safeAccess';
import { getToken } from '../utils/authHelpers';

/**
 * Konfiguration für die PrivateRoute
 */
interface PrivateRouteConfig {
  roles?: string[];
  permissions?: string[];
  redirectTo?: string;
  unauthorizedRedirect?: string;
  loadingComponent?: React.ComponentType<{ message?: string }>;
}

interface PrivateRouteProps extends PrivateRouteConfig {
  children: React.ReactNode;
}

/**
 * Status-Enum für bessere Lesbarkeit
 */
enum AuthStatus {
  LOADING = 'loading',
  AUTHENTICATED = 'authenticated',
  UNAUTHENTICATED = 'unauthenticated',
  UNAUTHORIZED = 'unauthorized',
}

/**
 * Hook für die Authentifizierungslogik
 */
const useAuthorizationStatus = (
  config: Required<Pick<PrivateRouteConfig, 'roles' | 'permissions'>>
) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { hasAnyRole, hasAnyPermission, roles: contextRoles, permissions: contextPermissions } = usePermissions();
  
  return useMemo(() => {
    console.log('🔐 PrivateRoute: Authorization check', {
      isLoading,
      isAuthenticated,
      hasUser: !!user,
      hasStoredToken: !!getToken(),
      requiredRoles: config.roles,
      requiredPermissions: config.permissions
    });

    // Schritt 1: Prüfe ob noch geladen wird (AuthProvider initialization)
    if (isLoading) {
      return { status: AuthStatus.LOADING, reason: 'Überprüfe Berechtigung...' };
    }
    
    // Schritt 2: Prüfe Authentifizierung
    if (!isAuthenticated) {
      // Fallback: Prüfe Token im Storage über authHelpers
      const hasStoredToken = Boolean(getToken());
      
      if (hasStoredToken) {
        console.log('⚠️ PrivateRoute: Token found but not authenticated - AuthProvider might be initializing');
        return { status: AuthStatus.LOADING, reason: 'Lade Benutzerdaten...' };
      }
      
      console.log('🚫 PrivateRoute: No authentication found, redirecting to login');
      return { status: AuthStatus.UNAUTHENTICATED, reason: 'Nicht angemeldet' };
    }
    
    // Schritt 3: Bei Authentifizierung ohne User-Daten (Edge case nach AuthProvider fix)
    if (!user) {
      const hasStoredToken = Boolean(getToken());
      
      if (!hasStoredToken) {
        console.log('⚠️ PrivateRoute: No user data and no token - redirecting to login');
        return { status: AuthStatus.UNAUTHENTICATED, reason: 'Session abgelaufen' };
      }
      
      console.log('⚠️ PrivateRoute: Authenticated but no user data - waiting briefly for user profile load');
      return { status: AuthStatus.LOADING, reason: 'Lade Benutzerprofil...' };
    }
    
    // Schritt 4: Prüfe Rollen (nur wenn spezifische Rollen gefordert sind)
    const safeRoles = config.roles;
    if (safeRoles.length > 0 && !hasAnyRole(...safeRoles)) {
      console.log('🔐 PrivateRoute: Role check failed', {
        required: safeRoles,
        userRoles: contextRoles,
        hasAnyRole: hasAnyRole(...safeRoles)
      });
      return { 
        status: AuthStatus.UNAUTHORIZED, 
        reason: 'Fehlende Rolle',
        details: { required: safeRoles, user: contextRoles }
      };
    }
    
    // Schritt 5: Prüfe Berechtigungen
    const safePermissions = config.permissions;
    if (safePermissions.length > 0 && !hasAnyPermission(...safePermissions)) {
      return { 
        status: AuthStatus.UNAUTHORIZED, 
        reason: 'Fehlende Berechtigung',
        details: { required: safePermissions, user: contextPermissions }
      };
    }
    
    return { status: AuthStatus.AUTHENTICATED };
  }, [isAuthenticated, isLoading, user, config.roles, config.permissions, hasAnyRole, hasAnyPermission, contextRoles, contextPermissions]);
};

/**
 * PrivateRoute Komponente
 * Schützt Routen basierend auf Authentifizierung, Rollen und Berechtigungen
 */
const PrivateRoute: React.FC<PrivateRouteProps> = ({
  children,
  roles = [],
  permissions = [],
  redirectTo = '/auth/login',
  unauthorizedRedirect = '/forbidden',
  loadingComponent: LoadingComponent = LoadingSpinner,
}) => {
  const location = useLocation();

  const config = useMemo(() => ({
    roles,
    permissions,
  }), [roles, permissions]);
  
  // Verwende den Authorization Hook
  const authStatus = useAuthorizationStatus(config);
  
  // Logging für Debugging (nur in Development)
  if (process.env.NODE_ENV === 'development' && authStatus.status === AuthStatus.UNAUTHORIZED) {
    console.warn(
      `[PrivateRoute] Access denied for ${location.pathname}`,
      authStatus.details
    );
  }
  
  // Render basierend auf Status
  switch (authStatus.status) {
    case AuthStatus.LOADING:
      return <LoadingComponent message={withDefault(authStatus.reason, 'Lädt...')} />;
      
    case AuthStatus.UNAUTHENTICATED:
      return (
        <Navigate 
          to={redirectTo} 
          state={{ from: location }} 
          replace 
        />
      );
      
    case AuthStatus.UNAUTHORIZED:
      return (
        <Navigate 
          to={unauthorizedRedirect} 
          state={{ from: location, reason: authStatus.reason }} 
          replace 
        />
      );
      
    case AuthStatus.AUTHENTICATED:
      return <>{children}</>;
      
    default:
      // Sollte nie erreicht werden
      return null;
  }
};

// Exportiere auch eine HOC-Version für mehr Flexibilität
export const withPrivateRoute = <P extends object>(
  Component: React.ComponentType<P>,
  config?: PrivateRouteConfig
) => {
  const WrappedComponent: React.FC<P> = (props) => (
    <PrivateRoute {...(config || {})}>
      <Component {...props} />
    </PrivateRoute>
  );
  
  WrappedComponent.displayName = `withPrivateRoute(${withDefault(Component.displayName, Component.name || 'Component')})`;
  
  return WrappedComponent;
};

export default PrivateRoute;

// Typen exportieren für externe Verwendung
export type { PrivateRouteProps, PrivateRouteConfig };