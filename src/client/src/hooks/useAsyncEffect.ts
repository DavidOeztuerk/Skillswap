import { useEffect, type DependencyList } from 'react';

/**
 * useAsyncEffect - Einfacher Hook für async Operationen in useEffect
 *
 * Verwendung:
 * ```tsx
 * useAsyncEffect(async () => {
 *   if (!hasPermission('admin:access_dashboard')) {
 *     await navigate('/');
 *     return;
 *   }
 *   await fetchDashboardStats();
 * }, [hasPermission, navigate, fetchDashboardStats]);
 * ```
 */
export function useAsyncEffect(effect: () => Promise<void>, deps: DependencyList): void {
  useEffect(() => {
    void effect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export default useAsyncEffect;
