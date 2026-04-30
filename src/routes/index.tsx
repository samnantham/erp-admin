import { Outlet, RouteObject } from 'react-router-dom';

import { ErrorPage } from '@/components/ErrorPage';
import Layout from '@/layout/Layout';
import Unauthorized from '@/pages/Unauthorized';
import { RouteProvider } from '@/services/auth/RouteContext';
import { UserProvider } from '@/services/auth/UserContext';

import Login from '@/pages/Auth/Login';
import Logout from '@/pages/Auth/Logout';
import PublicRouteGuard from '@/pages/Auth/PublicRouteGuard';
import AuthenticatedRouteGuard from '@/pages/Auth/AuthenticatedRouteGuard';
import PermissionGuard from '@/pages/Auth/PermissionGuard';

import Dashboard from '@/pages/Dashboard';

import { AdminUserMaster } from '@/pages/User-Access/AdminUsers/Master';
import { AdminUserForm } from '@/pages/User-Access/AdminUsers/Form';
import { DepartmentList } from '@/pages/User-Access/Departments/Master';
import { RoleList } from '@/pages/User-Access/Roles/Master';
import { RouteList } from '@/pages/User-Access/Routes/Master';
import { PermissionPage } from '@/pages/User-Access/Permissions/Master';

import { SubmasterPage } from '@/pages/Submaster';
import { SubmasterForm } from '@/pages/Submaster/Form';

import { CustomerMaster } from '@/pages/Master/Customer/Master';
import { CustomerForm } from '@/pages/Master/Customer/Form';
import { CustomerInfo } from '@/pages/Master/Customer/Info';
import { CustomerBulkUpload } from '@/pages/Master/Customer/BulkUpload';
import { CustomerRelationsBulkUpload } from '@/pages/Master/Customer/RelationBulkUpload';
import { ContactGroupMaster } from '@/pages/Master/Customer/ContactGroup/Master';
import { ContactGroupForm } from '@/pages/Master/Customer/ContactGroup/Form';

import { SpareMaster } from '@/pages/Master/Spare/Master';
import { SpareForm } from '@/pages/Master/Spare/Form';
import { SpareInfo } from '@/pages/Master/Spare/Info';
import { SpareBulkUpload } from '@/pages/Master/Spare/BulkUpload';
import { AssignAlternateParts } from '@/pages/Master/Spare/AssignAlternates';

import { SalesLogMaster } from '@/pages/Sales/Log/Master';
import { SalesLogForm } from '@/pages/Sales/Log/Form';
import { SalesQuotationMaster } from '@/pages/Sales/Quotation/Master';
import { SalesQuotationForm } from '@/pages/Sales/Quotation/Form';
import { SalesOrderMaster } from '@/pages/Sales/Order/Master';
import { SalesOrderForm } from '@/pages/Sales/Order/Form';

import { MaterialRequestMaster } from '@/pages/Purchase/Material-Request/Master';
import { MaterialRequestForm } from '@/pages/Purchase/Material-Request/Form';
import { PRFQMaster } from '@/pages/Purchase/RFQ/Master';
import { PRFQForm } from '@/pages/Purchase/RFQ/Form';
import { PRFQPreview } from '@/pages/Preview/PRFQPreview';
import { SupplierPricingUpdateMaster } from '@/pages/Purchase/SupplierPricingUpdate/Master';
import { SupplierPricingUpdateForm } from '@/pages/Purchase/SupplierPricingUpdate/Form';
import { CompareQuotations } from '@/pages/Purchase/SupplierPricingUpdate/CompareQuotations';
import { PurchaseOrderMaster } from '@/pages/Purchase/Order/Master';
import { DirectPOForm } from '@/pages/Purchase/Order/Form';
import { PurchaseOrderForm } from '@/pages/Purchase/Order/QuoteForm';
import { ReturnOrderMaster } from '@/pages/Purchase/Return-Order/Master';
import { ReturnOrderForm } from '@/pages/Purchase/Return-Order/Form';

import { InvoiceMaster } from '@/pages/Finance/Invoice/Master';
import { InvoiceForm } from '@/pages/Finance/Invoice/Form';
import { PaymentReceiptMaster } from '@/pages/Finance/Payment-Receipt/Master';
import { PaymentReceiptForm } from '@/pages/Finance/Payment-Receipt/Form';
import { PaymentMethodMaster } from '@/pages/Finance/Payment-Method/Master';
import { PaymentMethodForm } from '@/pages/Finance/Payment-Method/Form';

import { CUDRequestDashboard } from '@/pages/CUDRequests/Dashboard';
import { CUDRequestMaster } from '@/pages/CUDRequests/Master';

const AppShell = () => (
  <AuthenticatedRouteGuard>
    <UserProvider>
      <RouteProvider>
        <Layout>
          <PermissionGuard>
            <Outlet />
          </PermissionGuard>
        </Layout>
      </RouteProvider>
    </UserProvider>
  </AuthenticatedRouteGuard>
);

export const routes = [
  {
    path: '/',
    errorElement: <ErrorPage />,
    element: <Outlet />,
    children: [
      { path: 'logout', element: <Logout /> },
      { path: 'login', element: <PublicRouteGuard><Login /></PublicRouteGuard> },
      { path: 'preview/purchase/rfq/:id', element: <PRFQPreview /> },
      { path: '*', element: <ErrorPage /> },

      {
        path: '',
        element: <AppShell />,
        children: [
          { path: '', element: <Dashboard /> },
          { path: '/unauthorized', element: <Unauthorized /> },

          // User Access
          {
            path: 'user-access',
            children: [
              { path: '', element: <AdminUserMaster /> },
              { path: 'roles', element: <RoleList /> },
              { path: 'departments', element: <DepartmentList /> },
              { path: 'pages', element: <RouteList /> },
              { path: 'permissions/:id', element: <PermissionPage /> },
              { path: 'admin-users', element: <AdminUserMaster /> },
              { path: 'admin-users/form/:id?/:mode?', element: <AdminUserForm /> },
            ],
          },

          // Submaster
          { path: 'submaster/:model', element: <SubmasterPage /> },
          { path: 'submaster/:model/form/:id?/:mode?', element: <SubmasterForm /> },

          // Contact Management
          { path: 'contact-management/master', element: <CustomerMaster /> },
          { path: 'contact-management/master/form/:id?', element: <CustomerForm /> },
          { path: 'contact-management/master/info/:id', element: <CustomerInfo /> },
          { path: 'contact-management/master/bulk-upload', element: <CustomerBulkUpload /> },
          { path: 'contact-management/master/:relationType/bulk-upload', element: <CustomerRelationsBulkUpload /> },
          { path: 'contact-management/contact-group', element: <ContactGroupMaster /> },
          { path: 'contact-management/contact-group/form/:id?/:mode?', element: <ContactGroupForm /> },

          // Spare Management
          { path: 'spare-management/master', element: <SpareMaster /> },
          { path: 'spare-management/form/:id?', element: <SpareForm /> },
          { path: 'spare-management/info/:id', element: <SpareInfo /> },
          { path: 'spare-management/bulk-upload', element: <SpareBulkUpload /> },
          { path: 'spare-management/assign-alternates/:id', element: <AssignAlternateParts /> },

          // Sales Management
          { path: 'sales-management/sales-log/master', element: <SalesLogMaster /> },
          { path: 'sales-management/sales-log/form/:id?', element: <SalesLogForm /> },
          { path: 'sales-management/quotation/master', element: <SalesQuotationMaster /> },
          { path: 'sales-management/quotation/form/:id?', element: <SalesQuotationForm /> },
          { path: 'sales-management/order/master', element: <SalesOrderMaster /> },
          { path: 'sales-management/order/form/:id?', element: <SalesOrderForm /> },

          // Purchase
          { path: 'purchase/material-request/master', element: <MaterialRequestMaster /> },
          { path: 'purchase/material-request/form/:id?', element: <MaterialRequestForm /> },
          { path: 'purchase/rfq/master', element: <PRFQMaster /> },
          { path: 'purchase/rfq/form/:id?', element: <PRFQForm /> },
          { path: 'purchase/supplier-pricing-update/master', element: <SupplierPricingUpdateMaster /> },
          { path: 'purchase/supplier-pricing-update/form/:id?', element: <SupplierPricingUpdateForm /> },
          { path: 'purchase/supplier-pricing-update/compare-quotations/:rfqId', element: <CompareQuotations /> },
          { path: 'purchase/order/master', element: <PurchaseOrderMaster /> },
          { path: 'purchase/order/form/:id?', element: <DirectPOForm /> },
          { path: 'purchase/order/quote-form/:id?', element: <PurchaseOrderForm /> },
          { path: 'purchase/return-order/master', element: <ReturnOrderMaster /> },
          { path: 'purchase/return-order/form/:id?', element: <ReturnOrderForm /> },

          // Finance
          { path: 'finance/invoice/master', element: <InvoiceMaster /> },
          { path: 'finance/invoice/form/:id?', element: <InvoiceForm /> },
          { path: 'finance/payment-receipt/master', element: <PaymentReceiptMaster /> },
          { path: 'finance/payment-receipt/form/:id?', element: <PaymentReceiptForm /> },
          { path: 'finance/payment-method/:method/master', element: <PaymentMethodMaster /> },
          { path: 'finance/payment-method/:method/form/:id?/:mode?', element: <PaymentMethodForm /> },

          // CUD Requests
          { path: 'cud-requests/dashboard', element: <CUDRequestDashboard /> },
          { path: 'cud-requests/:module', element: <CUDRequestMaster /> },
        ],
      },
    ],
  },
  { path: '*', element: <ErrorPage /> },
] satisfies RouteObject[];