export const hasAdminRole = (userRoles?: string[]): boolean => {
  if (!userRoles || !Array.isArray(userRoles)) return false;
  return userRoles.some((role) => role.toLowerCase().trim() === 'admin');
};

export const hasAnyRole = (userRoles?: string[], requiredRoles: string[] = []): boolean => {
  if (!userRoles || !Array.isArray(userRoles) || requiredRoles.length === 0) return false;

  const normalizedUserRoles = new Set(userRoles.map((role) => role.toLowerCase().trim()));
  const normalizedRequiredRoles = requiredRoles.map((role) => role.toLowerCase().trim());

  return normalizedRequiredRoles.some((role) => normalizedUserRoles.has(role));
};
