import { Outlet, RouteObject } from 'react-router-dom';

import { ErrorPage } from '@/components/ErrorPage';
//Layout
import Layout from '@/layout/Layout';
//Unauthorized Route
import Unauthorized from '@/pages/Unauthorized';
import { RouteProvider } from '@/services/auth/RouteContext';
import { UserProvider } from '@/services/auth/UserContext';

//Auth Routes
import Login from '@/pages/Auth/Login';
import Logout from '@/pages/Auth/Logout';
import PublicRouteGuard from '@/pages/Auth/PublicRouteGuard';

//Admin User Routes
import { AdminUserMaster } from '@/pages/User-Access/AdminUsers/AdminUserMaster';
import { AdminUserForm } from '@/pages/User-Access/AdminUsers/AdminUserForm';
//Department Routes
import { DepartmentList } from '@/pages/User-Access/Departments/DepartmentList';
//User Role Routes
import { RoleList } from '@/pages/User-Access/Roles/RoleList';
import AuthenticatedRouteGuard from '@/pages/Auth/AuthenticatedRouteGuard';

//Dashboard
import Dashboard from '@/pages/Dashboard';

export const routes = [
  {
    path: '/',
    errorElement: <ErrorPage />,
    element: (
      <>
        <Outlet />
      </>
    ),
    children: [
      {
        path: 'logout',
        element: <Logout />,
      },

      /**
       * Public Routes
       */
      {
        path: 'login',
        element: (
          <PublicRouteGuard>
            <Login />
          </PublicRouteGuard>
        ),
      },
      /**
       * Authenticated Routes
       */
      {
        path: '',
        element: (
          <AuthenticatedRouteGuard>
            <UserProvider>
              <RouteProvider>
                <Layout>
                  <Outlet />
                </Layout>
              </RouteProvider>
            </UserProvider>
          </AuthenticatedRouteGuard>
        ),
        children: [
          {
            path: '',
            element: <Dashboard />,
          },
          {
            path: '/unauthorized',
            element: <Unauthorized />,
          },
          {
            path: 'user-access',
            children: [
              { path: '', element: <AdminUserMaster /> },
              { path: 'roles', element: <RoleList /> },
              { path: 'departments', element: <DepartmentList /> },
              {
                path: 'admin-users',
                children: [
                  { path: '', element: <AdminUserMaster /> },
                  { path: 'form', element: <AdminUserForm /> },
                ],
              }
            ],
          },
        ],
      },

      { path: '*', element: <ErrorPage /> },
    ],
  },
  { path: '*', element: <ErrorPage /> },
] satisfies RouteObject[];
