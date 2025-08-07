import React, { useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/ui/LoadingSpinner';

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
  // Legacy props für Abwärtskompatibilität (deprecated)
  requiredRoles?: string[];
  requiredRole?: string;
  requiredPermissions?: string[];
  requiredPermission?: string;
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
  const { isAuthenticated, isLoading, user, hasAnyRole, hasAnyPermission } = useAuth();
  
  return useMemo(() => {
    // Schritt 1: Prüfe ob noch geladen wird
    if (isLoading) {
      return { status: AuthStatus.LOADING, reason: 'Überprüfe Berechtigung...' };
    }
    
    // Schritt 2: Prüfe Authentifizierung
    if (!isAuthenticated) {
      // Fallback: Prüfe Token im Storage
      const hasStoredToken = Boolean(
        localStorage.getItem('token') || sessionStorage.getItem('token')
      );
      
      if (hasStoredToken) {
        return { status: AuthStatus.LOADING, reason: 'Lade Benutzerdaten...' };
      }
      
      return { status: AuthStatus.UNAUTHENTICATED };
    }
    
    // Schritt 3: Warte auf User-Daten
    if (!user) {
      return { status: AuthStatus.LOADING, reason: 'Lade Benutzerprofil...' };
    }
    
    // Schritt 4: Prüfe Rollen (nur wenn spezifische Rollen gefordert sind)
    if (config.roles.length > 0 && !hasAnyRole(config.roles)) {
      console.log('🔐 PrivateRoute: Role check failed', {
        required: config.roles,
        userRoles: user.roles,
        hasAnyRole: hasAnyRole(config.roles)
      });
      return { 
        status: AuthStatus.UNAUTHORIZED, 
        reason: 'Fehlende Rolle',
        details: { required: config.roles, user: user.roles }
      };
    }
    
    // Schritt 5: Prüfe Berechtigungen
    if (config.permissions.length > 0 && !hasAnyPermission(config.permissions)) {
      return { 
        status: AuthStatus.UNAUTHORIZED, 
        reason: 'Fehlende Berechtigung',
        details: { required: config.permissions, user: user.permissions }
      };
    }
    
    return { status: AuthStatus.AUTHENTICATED };
  }, [isAuthenticated, isLoading, user, config.roles, config.permissions, hasAnyRole, hasAnyPermission]);
};

/**
 * PrivateRoute Komponente
 * Schützt Routen basierend auf Authentifizierung, Rollen und Berechtigungen
 */
const PrivateRoute: React.FC<PrivateRouteProps> = ({
  children,
  // Neue Props
  roles = [],
  permissions = [],
  redirectTo = '/auth/login',
  unauthorizedRedirect = '/forbidden',
  loadingComponent: LoadingComponent = LoadingSpinner,
  // Legacy Props (für Abwärtskompatibilität)
  requiredRoles = [],
  requiredRole,
  requiredPermissions = [],
  requiredPermission,
}) => {
  const location = useLocation();
  
  // Konsolidiere alte und neue Props
  const config = useMemo(() => {
    const allRoles = [
      ...roles,
      ...requiredRoles,
      ...(requiredRole ? [requiredRole] : []),
    ].filter(Boolean);
    
    const allPermissions = [
      ...permissions,
      ...requiredPermissions,
      ...(requiredPermission ? [requiredPermission] : []),
    ].filter(Boolean);
    
    return {
      roles: allRoles,
      permissions: allPermissions,
    };
  }, [roles, permissions, requiredRoles, requiredRole, requiredPermissions, requiredPermission]);
  
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
      return <LoadingComponent message={authStatus.reason} />;
      
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
  
  WrappedComponent.displayName = `withPrivateRoute(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

export default PrivateRoute;

// Typen exportieren für externe Verwendung
export type { PrivateRouteProps, PrivateRouteConfig };