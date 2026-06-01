export const USER_ROLES = ['ROLE_USER', 'ROLE_SUPPORT', 'ROLE_ADMIN'] as const;
export type UserRole = typeof USER_ROLES[number];

export type AdminArea =
  | 'dashboard'
  | 'users'
  | 'resources'
  | 'products'
  | 'categories'
  | 'tickets'
  | 'invoices'
  | 'gateways'
  | 'queryInstances'
  | 'audioNodes'
  | 'notifications'
  | 'dns'
  | 'liveStatus'
  | 'profile';

const supportAreas = new Set<AdminArea>(['dashboard', 'tickets', 'invoices', 'profile']);

export function parseUserRole(value: unknown): UserRole | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  return USER_ROLES.includes(normalized as UserRole) ? normalized as UserRole : null;
}

export function hasAdminPanelAccess(role: UserRole | null): boolean {
  return role === 'ROLE_ADMIN' || role === 'ROLE_SUPPORT';
}

export function canAccessAdminArea(role: UserRole | null, area: AdminArea): boolean {
  if (role === 'ROLE_ADMIN') return true;
  return role === 'ROLE_SUPPORT' && supportAreas.has(area);
}

export function roleLabel(role: UserRole | null): string {
  switch (role) {
    case 'ROLE_ADMIN': return 'مدیر سامانه';
    case 'ROLE_SUPPORT': return 'کارشناس پشتیبانی';
    case 'ROLE_USER': return 'کاربر';
    default: return 'نقش نامشخص';
  }
}
