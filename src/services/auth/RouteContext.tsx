import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUserContext } from '@/services/auth/UserContext';
interface Permission {
    list: number;
    create: number;
    update: number;
    view: number;
    bulk_upload: number;
    assign_alternates: number;
}

interface RouteContextType {
    otherPermissions: Permission;
    setOtherPermissions: React.Dispatch<React.SetStateAction<Permission>>;
}

export const RouteContext = createContext<RouteContextType | undefined>(undefined);

const FULL_PERMISSIONS: Permission = { list: 1, create: 1, update: 1, view: 1, bulk_upload: 1, assign_alternates: 1 };
const EMPTY_PERMISSIONS: Permission = { list: 0, create: 0, update: 0, view: 0, bulk_upload: 0, assign_alternates: 0 };

/**
 * Maps each module's actions to their actual route URLs.
 * Permissions are resolved by checking these URLs against userInfo.permissions at runtime.
 */
const MODULE_URL_MAP: Record<string, {
    list: string;
    view: string;
    create: string;
    update: string;
    bulk_upload?: string;
    assign_alternates?: string;
}> = {
    admin_users: {
        list:   '/user-access/admin-users',
        view:   '/user-access/admin-users',
        create: '/user-access/admin-users',
        update: '/user-access/admin-users',
    },
    user_roles: {
        list:   '/user-access/roles',
        view:   '/user-access/roles',
        create: '/user-access/roles',
        update: '/user-access/roles',
    },
    departments: {
        list:   '/user-access/departments',
        view:   '/user-access/departments',
        create: '/user-access/departments',
        update: '/user-access/departments',
    },
    spare_management: {
        list:            '/spare-management/master',
        view:            '/spare-management/info',
        create:          '/spare-management/form',
        update:          '/spare-management/form',
        bulk_upload:     '/spare-management/bulk-upload',
        assign_alternates: '/spare-management/assign-alternates',
    },
    contact_management: {
        list:        '/contact-management/customer-master',
        view:        '/contact-management/customer-master/info',
        create:      '/contact-management/customer-master/form',
        update:      '/contact-management/customer-master/form',
        bulk_upload: '/contact-management/customer-master/bulk-upload',
    },
    // Submaster has no separate form page — modal is used for create/update.
    // All actions gated by the single /submaster/:model permission.
    submaster: {
        list:   '/submaster/:model',
        view:   '/submaster/:model',
        create: '/submaster/:model',
        update: '/submaster/:model',
    },
};

const resolveModuleKey = (pathname: string): string => {
    return pathname.slice(1).replace(/-/g, '_').split('/')[0];
};

export const RouteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [otherPermissions, setOtherPermissions] = useState<Permission>(EMPTY_PERMISSIONS);
    const [hasPermission, setHasPermission] = useState<boolean>(true);

    const location = useLocation();
    const navigate = useNavigate();
    const currentUrl = location.pathname;
    const { userInfo } = useUserContext();
    const isSuperAdmin: boolean = userInfo?.is_super_admin == true;

    useEffect(() => {
        // Super admin always gets full access
        if (isSuperAdmin) {
            setOtherPermissions(FULL_PERMISSIONS);
            setHasPermission(true);
            return;
        }

        if (!userInfo || Object.keys(userInfo).length === 0) return;

        const userPermissions: string[] = Array.isArray(userInfo.permissions) ? userInfo.permissions : [];
        const moduleKey = resolveModuleKey(currentUrl);
        const moduleUrls = MODULE_URL_MAP[moduleKey];

        if (!moduleUrls) {
            // Module not registered — allow through with full access
            setOtherPermissions(FULL_PERMISSIONS);
            setHasPermission(true);
            return;
        }

        // Check each action URL against the user's actual permissions array
        const resolved: Permission = {
            list:             userPermissions.includes(moduleUrls.list)                          ? 1 : 0,
            view:             userPermissions.includes(moduleUrls.view)                          ? 1 : 0,
            create:           userPermissions.includes(moduleUrls.create)                        ? 1 : 0,
            update:           userPermissions.includes(moduleUrls.update)                        ? 1 : 0,
            bulk_upload:      moduleUrls.bulk_upload      ? (userPermissions.includes(moduleUrls.bulk_upload)      ? 1 : 0) : 0,
            assign_alternates: moduleUrls.assign_alternates ? (userPermissions.includes(moduleUrls.assign_alternates) ? 1 : 0) : 0,
        };

        setOtherPermissions(resolved);
        setHasPermission(resolved.list === 1);
    }, [userInfo, currentUrl, isSuperAdmin]);

    useEffect(() => {
        if (!hasPermission) {
            console.log('You do not have permission for this route');
            navigate('/unauthorized');
        }
    }, [hasPermission]);

    return (
        <RouteContext.Provider value={{ otherPermissions, setOtherPermissions }}>
            {children}
        </RouteContext.Provider>
    );
};

export const useRouterContext = (): RouteContextType => {
    const context = useContext(RouteContext);
    if (!context) {
        throw new Error('useRouterContext must be used within a RouteProvider');
    }
    return context;
};