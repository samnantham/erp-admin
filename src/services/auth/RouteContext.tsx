
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUserContext } from '@/services/auth/UserContext';
import { replaceNumbersWithID } from '@/helpers/commonHelper'

interface Permission {
    list: number;
    create: number;
    update: number;
    view: number
};

interface RouteContextType {
    otherPermissions: Permission;
    setOtherPermissions: React.Dispatch<React.SetStateAction<Permission>>;
}

export const RouteContext = createContext<RouteContextType | undefined>(undefined);

export const RouteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const initialaPermissions: TODO = {list: 0, create: 0, update: 0, view: 0};
    const [otherPermissions, setOtherPermissions] = useState<TODO>(initialaPermissions);
    const [permissions, setPermissions] = useState<TODO>({});
    const [hasPermission, setHasPermission] = useState<boolean>(true);
    const currentPermissions: any = {
        admin_users: {
          list: {
            name: "listing",
            label: "List",
            url: "/admin-users",
            hasPermission: 1
          },
          view: {
            name: "view",
            label: "View",
            url: "/admin-users/:id",
            hasPermission: 1
          },
          create: {
            name: "create",
            label: "Create",
            url: "/admin-users/create",
            hasPermission: 1
          },
          update: {
            name: "update",
            label: "Update",
            url: "/admin-users/:id/edit",
            hasPermission: 1
          }
        },
        user_roles: {
            list: {
              name: "listing",
              label: "List",
              url: "/user-roles",
              hasPermission: 1
            },
            view: {
              name: "view",
              label: "View",
              url: "/user-role/:id",
              hasPermission: 1
            },
            create: {
              name: "create",
              label: "Create",
              url: "/user-role/create",
              hasPermission: 1
            },
            update: {
              name: "update",
              label: "Update",
              url: "/user-role/:id/edit",
              hasPermission: 1
            }
          },
          departments: {
            list: {
              name: "listing",
              label: "List",
              url: "/departments",
              hasPermission: 1
            },
            view: {
              name: "view",
              label: "View",
              url: "/department/:id",
              hasPermission: 1
            },
            create: {
              name: "create",
              label: "Create",
              url: "/department/create",
              hasPermission: 1
            },
            update: {
              name: "update",
              label: "Update",
              url: "/department/:id/edit",
              hasPermission: 1
            }
          }
    };
    const location = useLocation();
    const navigate = useNavigate();
    const currentUrl = location.pathname;
    const { userInfo } = useUserContext();

    useEffect(() => {
        console.log('Current URL:', currentUrl);
        console.log(replaceNumbersWithID(currentUrl, ':id'))
    }, [ navigate]);

    useEffect(() => {
        if(Object.keys(userInfo).length > 0){
            let clonedURL = currentUrl;
            let updatedURL = clonedURL.slice(1).replace("-", "_");
            let urlParts = updatedURL.split('/');
            setPermissions(currentPermissions[urlParts[0]] ? currentPermissions[urlParts[0]] : {});
        }
        
    }, [userInfo, currentUrl]);

    useEffect(() => {
        if(Object.keys(permissions).length > 0){
            Object.keys(permissions).forEach((item: any) => {
                if(permissions[item].url === replaceNumbersWithID(currentUrl, ':id')){
                    setOtherPermissions((prevData: any) => ({
                        ...prevData,
                        ['list'] : permissions['list'].hasPermission,
                        ['view'] : permissions['view'].hasPermission,
                        ['create'] : permissions['create'].hasPermission,
                        ['update'] : permissions['update'].hasPermission,
                    }));

                    setHasPermission(permissions[item].hasPermission === 1 ? true : false);
                }
            });
        }else{
            console.log('Module not added for permission');
            setHasPermission(true);
        }
        
    }, [permissions]);

    useEffect(() => {
        if(!hasPermission){
            console.log('you dont have permitted');
            navigate('/unauthorized');
        }
    }, [hasPermission]);

    useEffect(() => {
        //console.log(otherPermissions)
    }, [otherPermissions]);

    return (
        <RouteContext.Provider value={{ otherPermissions, setOtherPermissions }}>
            {children}
        </RouteContext.Provider>
    );
};

export const useRouterContext = (): RouteContextType => {
    const context = useContext(RouteContext);
    if (!context) {
        throw new Error('useUrl must be used within a UrlProvider');
    }
    return context;
};
