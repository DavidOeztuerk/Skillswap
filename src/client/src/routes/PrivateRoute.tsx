import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/ui/LoadingSpinner';

interface PrivateRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  requiredRole?: string;
  requiredPermissions?: string[];
  requiredPermission?: string;
  redirectTo?: string;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({
  children,
  requiredRoles = [],
  requiredRole,
  requiredPermissions = [],
  requiredPermission,
  redirectTo = '/auth/login',
}) => {
  const { isAuthenticated, isLoading, user, hasAnyRole, hasAnyPermission } = useAuth();
  const location = useLocation();
debugger
  // Warte bis User und Authentication vollständig geladen sind
  // ODER führe manuellen Token-Check durch
  if (isLoading) {
    return <LoadingSpinner fullPage message="Überprüfe Berechtigung..." />;
  }
  
  // Falls nicht authentifiziert, prüfe ob Token vorhanden ist
  if (!isAuthenticated) {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      // Token vorhanden, aber User nicht geladen - zeige Loading
      return <LoadingSpinner fullPage message="Lade Benutzerdaten..." />;
    }
    // Kein Token - redirect zum Login
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Falls authentifiziert aber User noch nicht geladen
  if (isAuthenticated && !user) {
    return <LoadingSpinner fullPage message="Lade Benutzerprofil..." />;
  }

  const rolesToCheck = requiredRole ? [requiredRole] : requiredRoles;
  
  if (rolesToCheck.length > 0 && user) {
    // Extrahiere Rollen basierend auf deinem User-Type
    // let userRoles: string[] = [];
    
    // if (user?.roles && Array.isArray(user.roles)) {
      // Prüfe ob es ein Array von Strings ist
    //   if (user.roles.length > 0 && typeof user.roles[0] === 'string') {
    //     userRoles = user.roles as string[];
    //   }
    //   // Prüfe ob es ein Array von Objekten mit 'name' Property ist
    //   else if (user.roles.length > 0 && typeof user.roles[0] === 'object' && 'name' in user.roles[0]) {
    //     userRoles = user.roles.map((role: any) => role.name);
    //   }
    // }
    
    // // Normalisiere die Rollen (lowercase für Vergleich)
    // const normalizedUserRoles = userRoles.map(role => 
    //   typeof role === 'string' ? role.toLowerCase().trim() : ''
    // ).filter(Boolean);
    
    // const normalizedRequiredRoles = rolesToCheck.map(role => 
    //   role.toLowerCase().trim()
    // );
    
    // const hasRequiredRole = normalizedRequiredRoles.some(requiredRole =>
    //   normalizedUserRoles.includes(requiredRole)
    // );
    
    // if (!hasRequiredRole) {
    //   console.warn(`Access denied for path ${location.pathname}. User roles: ${normalizedUserRoles.join(', ')}, Required: ${normalizedRequiredRoles.join(', ')}`);
    //   return <Navigate to="/unauthorized" replace />;
    // }
    const hasRequiredRole = hasAnyRole(rolesToCheck);
    if (!hasRequiredRole) {
      return <Navigate to="/forbidden" replace />;
    }
  }

  const permissionsToCheck = requiredPermission ? [requiredPermission] : requiredPermissions;
  if (permissionsToCheck?.length > 0 && user) {
    const hasRequiredPermission = hasAnyPermission(permissionsToCheck);
    if (!hasRequiredPermission) {
      return <Navigate to="/forbidden" replace />;
    }
  }
  
  return <>{children}</>;
};

export default PrivateRoute;