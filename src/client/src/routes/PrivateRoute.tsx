import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/ui/LoadingSpinner';

interface PrivateRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  redirectTo?: string;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({
  children,
  requiredRoles = [],
  redirectTo = '/login',
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth status
  if (isLoading) {
    return <LoadingSpinner fullPage message="Überprüfe Berechtigung..." />;
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check role requirements if specified
  if (requiredRoles.length > 0 && user) {
    const hasRequiredRole = requiredRoles.some(role =>
      user.roles?.includes(role)
    );

    if (!hasRequiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Authenticated and authorized - render children
  return <>{children}</>;
};

export default PrivateRoute;