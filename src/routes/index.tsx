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

//Dashboard
import Dashboard from '@/pages/Dashboard';

// !<-- !!User Access Routes Start !!-->!
import { AdminUserMaster } from '@/pages/User-Access/AdminUsers/Master';
import { AdminUserForm } from '@/pages/User-Access/AdminUsers/Form';
//Department Routes
import { DepartmentList } from '@/pages/User-Access/Departments/Master';
//User Role Routes
import { RoleList } from '@/pages/User-Access/Roles/Master';
import { RouteList } from '@/pages/User-Access/Routes/Master';
import { PermissionPage } from '@/pages/User-Access/Permissions/Master';

import AuthenticatedRouteGuard from '@/pages/Auth/AuthenticatedRouteGuard';
// !<--!! User Access Routes Ends !!-->!

// !<--!! Submaster Routes Starts !!-->!
import { SubmasterPage } from '@/pages/Submaster';
import { SubmasterForm } from '@/pages/Submaster/Form';
// !<--!! Submaster Routes Ends !!-->!

// !<--!! Contact Management Routes Starts !!-->!
import { CustomerMaster } from '@/pages/Master/Customer/Master';
import { CustomerForm } from '@/pages/Master/Customer/Form';
import { CustomerInfo } from '@/pages/Master/Customer/Info';
import { CustomerBulkUpload } from '@/pages/Master/Customer/BulkUpload';
import { CustomerRelationsBulkUpload } from '@/pages/Master/Customer/RelationBulkUpload';
import { ContactGroupMaster } from '@/pages/Master/Customer/ContactGroup/Master';
import { ContactGroupForm } from '@/pages/Master/Customer/ContactGroup/Form';
// !<--!! Contact Management Routes Ends !!-->!

// !<--!! Spare Management Routes Starts !!-->!
import { SpareMaster } from '@/pages/Master/Spare/Master';
import { SpareForm } from '@/pages/Master/Spare/Form';
import { SpareInfo } from '@/pages/Master/Spare/Info';
import { SpareBulkUpload } from '@/pages/Master/Spare/BulkUpload';
import { AssignAlternateParts } from '@/pages/Master/Spare/AssignAlternates';
// !<--!! Spare Management Routes Ends !!-->!

// !<--!! Update Delete Request Routes Starts !!-->!
import { UpdateDeleteRequestDashboard } from '@/pages/UpdateDeleteRequests/Dashboard';
import { UpdateDeleteRequestMaster } from '@/pages/UpdateDeleteRequests/Master';
// !<--!! Update Delete Request Routes Ends !!-->!

// !<--!! Sales Log Routes Starts !!-->!
import { SalesLogMaster } from '@/pages/Sales-Log/Master';
import { SalesLogForm } from '@/pages/Sales-Log/Form';
// !<--!! Update Delete Request Routes Ends !!-->!

// !<--!! Material Request Routes Starts !!-->!
import { MaterialRequestMaster } from '@/pages/Purchase/Material-Request/Master';
import { MaterialRequestForm } from '@/pages/Purchase/Material-Request/Form';
// !<--!! Update Delete Request Routes Ends !!-->!

// !<--!! Purchase RFQ Routes Starts !!-->!
import { PRFQMaster } from '@/pages/Purchase/RFQ/Master';
import { PRFQForm } from '@/pages/Purchase/RFQ/Form';
// !<--!! Purchase RFQ Routes Ends !!-->!

// !<--!! Purchase RFQ Routes Starts !!-->!
import { SupplierPricingUpdateMaster } from '@/pages/Purchase/SupplierPricingUpdate/Master';
import { SupplierPricingUpdateForm } from '@/pages/Purchase/SupplierPricingUpdate/Form';
// !<--!! Purchase RFQ Routes Ends !!-->!

// !<--!! Preview Routes Starts !!-->!
import { PRFQPreview } from '@/pages/Preview/PRFQPreview';
// !<--!! Preview Routes Starts !!-->!

import PermissionGuard from '@/pages/Auth/PermissionGuard';

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

      {
        path: 'preview/purchase/rfq/:id',
        element: <PRFQPreview />,
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
                  {/* PermissionGuard wraps all child routes — redirects to /unauthorized if not permitted */}
                  <PermissionGuard>
                    <Outlet />
                  </PermissionGuard>
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
              { path: 'permissions/:id', element: <PermissionPage /> },
              {
                path: 'admin-users',
                children: [
                  { path: '', element: <AdminUserMaster /> },
                  { path: 'form/:id?/:mode?', element: <AdminUserForm /> },
                ],
              },
              { path: 'pages', element: <RouteList /> },
            ],
          },
          {
            path: 'submaster/:model',
            children: [
              { path: '', element: <SubmasterPage /> },
              { path: 'form/:id?/:mode?', element: <SubmasterForm /> },
            ],
          },
          {
            path: 'contact-management',
            children: [
              {
                path: 'master',
                children: [
                  { path: '', element: <CustomerMaster /> },
                  { path: 'form/:id?', element: <CustomerForm /> },
                  { path: 'bulk-upload', element: <CustomerBulkUpload /> },
                  { path: ':relationType/bulk-upload', element: <CustomerRelationsBulkUpload /> },
                  { path: 'info/:id', element: <CustomerInfo /> },
                ],
              },
              {
                path: 'contact-group',
                children: [
                  { path: '', element: <ContactGroupMaster /> },
                  { path: 'form/:id?/:mode?', element: <ContactGroupForm /> },
                ],
              },
            ],
          },
          {
            path: 'spare-management',
            children: [
              {
                path: '',
                children: [
                  { path: 'master', element: <SpareMaster /> },
                  { path: 'form/:id?', element: <SpareForm /> },
                  { path: 'bulk-upload', element: <SpareBulkUpload /> },
                  { path: 'info/:id', element: <SpareInfo /> },
                  { path: 'assign-alternates/:id', element: <AssignAlternateParts /> },
                ],
              },
            ],
          },
          {
            path: 'sales-management',
            children: [
              {
                path: '',
                children: [
                  { path: 'sales-log/master', element: <SalesLogMaster /> },
                  { path: 'sales-log/form/:id?', element: <SalesLogForm /> },
                ],
              },
            ],
          },
          {
            path: 'purchase',
            children: [
              {
                path: 'material-request',
                children: [
                  { path: 'master', element: <MaterialRequestMaster /> },
                  { path: 'form/:id?', element: <MaterialRequestForm /> },
                ],
              },
              {
                path: 'rfq',
                children: [
                  { path: 'master', element: <PRFQMaster /> },
                  { path: 'form/:id?', element: <PRFQForm /> },
                ],
              },
              {
                path: 'supplier-pricing-update',
                children: [
                  { path: 'master', element: <SupplierPricingUpdateMaster /> },
                  { path: 'form/:id?', element: <SupplierPricingUpdateForm /> },
                ],
              },
            ],
          },
          {
            path: 'update-delete-requests',
            children: [
              { path: 'dashboard', element: <UpdateDeleteRequestDashboard /> },
              { path: ':module', element: <UpdateDeleteRequestMaster /> },
            ],
          },
        ],
      },
      { path: '*', element: <ErrorPage /> },
    ],
  },
  { path: '*', element: <ErrorPage /> },
] satisfies RouteObject[];