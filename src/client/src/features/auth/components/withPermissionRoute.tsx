import React from 'react';
import PermissionRoute, { type PermissionRouteConfig } from './PermissionRoute';

/**
 * Higher-Order Component version of PermissionRoute
 *
 * @example
 * const ProtectedPage = withPermissionRoute(MyPage, {
 *   roles: ['Admin'],
 *   permissions: ['users:manage']
 * });
 */
export const withPermissionRoute = <P extends object>(
  Component: React.ComponentType<P>,
  config?: PermissionRouteConfig
): React.FC<P> => {
  const WrappedComponent: React.FC<P> = (props) => (
    <PermissionRoute {...(config ?? { requireAuth: true })}>
      <Component {...props} />
    </PermissionRoute>
  );

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const componentName = Component.displayName ?? Component.name ?? 'Component';
  WrappedComponent.displayName = `withPermissionRoute(${componentName})`;

  return WrappedComponent;
};

export default withPermissionRoute;
