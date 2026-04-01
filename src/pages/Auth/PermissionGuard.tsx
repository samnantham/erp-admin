import { Navigate, useLocation } from 'react-router-dom';
import { useUserContext } from '@/services/auth/UserContext';

// Only these two are always allowed — needed to avoid infinite redirect loops
const ALWAYS_ALLOWED = ['/', '/unauthorized'];

const isPermitted = (pathname: string, permissions: string[]): boolean => {
  if (ALWAYS_ALLOWED.includes(pathname)) return true;

  // Exact match
  if (permissions.includes(pathname)) return true;

  // Strip one trailing numeric ID or UUID and check the base path
  // e.g. /contact-management/master/info/123 → /contact-management/master/info
  // e.g. /spare-management/assign-alternates/456 → /spare-management/assign-alternates
  const withoutTrailingId = pathname.replace(/\/[\w-]+$/, (seg) =>
    /^\/\d+$/.test(seg) || /^\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(seg)
      ? ''
      : seg
  );
  if (withoutTrailingId !== pathname && permissions.includes(withoutTrailingId)) return true;

  // Dynamic submaster: /submaster/bin-locations matches permission /submaster/:model
  if (/^\/submaster\/[^/]+/.test(pathname) && permissions.includes('/submaster/:model')) return true;

  return false;
};

const PermissionGuard = ({ children }: { children: React.ReactNode }) => {
  const { userInfo, isProfileLoading } = useUserContext();
  const { pathname } = useLocation();

  // Wait for profile API to finish — never redirect while loading
  if (isProfileLoading) return <>{children}</>;

  // Profile loaded but userInfo still empty — don't redirect
  if (!userInfo || Object.keys(userInfo).length === 0) return <>{children}</>;

  // Super admin bypasses all permission checks (handles both boolean true and integer 1)
  if (userInfo.is_super_admin == true) return <>{children}</>;

  const permissions: string[] = Array.isArray(userInfo?.permissions) ? userInfo.permissions : [];

  // Permissions array empty — don't redirect
  if (permissions.length === 0) return <>{children}</>;

  if (!isPermitted(pathname, permissions)) {
    console.warn(`[PermissionGuard] Access denied — path: ${pathname}`, {
      is_super_admin: userInfo.is_super_admin,
      permissions,
    });
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default PermissionGuard;