export const endPoints = {
  authentication: {
    login: "/auth/login",
  },
  profile: {
    profile_update: "/profile/update",
    password_update: "/profile/update-password",
    info: "/profile/info",
  },
  index: {
    role: '/role',
    department: '/department',
    user: '/user',
    submaster: '/submaster/:model',
    customer: '/contact-management/customer',
    update_delete_request: "/update-delete-requests/:model/:action"
  }, list: {
    role: '/role',
    department: '/department',
    user: '/user',
    submaster: '/submaster/:model',
    customer: '/contact-management/customer'
  }, info: {
    role: '/role/:id',
    department: '/department/:id',
    user: '/user/:id',
    submaster: '/submaster/:model/:id',
    customer: '/contact-management/customer/:id'
  }, create: {
    role: '/role',
    department: '/department',
    user: '/user',
    submaster: '/submaster/:model',
    customer: '/contact-management/customer',
    contact_manager: '/contact-management/customer/:customer_id/contact-managers',
    shipping_address: '/contact-management/customer/:customer_id/shipping-addresses',
    bank: '/contact-management/customer/:customer_id/banks',
    principle_of_owner: '/contact-management/customer/:customer_id/principle-owners',
    trader_reference: '/contact-management/customer/:customer_id/trader-references',
  }, update: {
    role: '/role/:id',
    department: '/department/:id',
    user: '/user/:id',
    submaster: '/submaster/:model/:id',
    customer: '/contact-management/customer/:id',
    contact_manager: '/contact-management/customer/:customer_id/contact-managers/:id',
    shipping_address: '/contact-management/customer/:customer_id/shipping-addresses/:id',
    bank: '/contact-management/customer/:customer_id/banks/:id',
    principle_of_owner: '/contact-management/customer/:customer_id/principle-owners/:id',
    trader_reference: '/contact-management/customer/:customer_id/trader-references/:id',
  }, delete: {
    role: '/role/:id',
    department: '/department/:id',
    user: '/user/:id',
    submaster: '/submaster/:model/:id',
    customer: '/contact-management/customer/:id',
    contact_manager: '/contact-management/customer/:customer_id/contact-managers/:id',
    shipping_address: '/contact-management/customer/:customer_id/shipping-addresses/:id',
    bank: '/contact-management/customer/:customer_id/banks/:id',
    principle_of_owner: '/contact-management/customer/:customer_id/principle-owners/:id',
    trader_reference: '/contact-management/customer/:customer_id/trader-references/:id',
  }, drop_downs: {
    user: '/user/drop-downs',
    customer: '/contact-management/customer/drop-downs'
  },
  others: {
    upload: "/media/upload",
    customer_status_update: "/contact-management/customer/:id/status",
    check_existing_unique_customers: "/contact-management/customer/check-existing-unique-customers",
    check_existing_unique_banks: "/contact-management/customer/check-existing-unique-banks",
    check_existing_unique_contact_managers: "/contact-management/customer/check-existing-unique-contact-managers",
    check_existing_unique_shipping_addresses: "/contact-management/customer/check-existing-unique-shipping-addresses",
    check_existing_unique_trader_references: "/contact-management/customer/check-existing-unique-trader-references",
    check_existing_unique_principle_of_owners: "/contact-management/customer/check-existing-unique-principle-owners",
    update_delete_request_dashboard: "/update-delete-requests/dashboard"
  },
  bulk_upload: {
    customer : "/contact-management/customer/bulk-upload",
    contact_manager: '/contact-management/customer/contact-managers/bulk-upload',
    shipping_address: '/contact-management/customer/shipping-addresses/bulk-upload',
    bank: '/contact-management/customer/banks/bulk-upload',
    principle_of_owner: '/contact-management/customer/principle-owners/bulk-upload',
    trader_reference: '/contact-management/customer/trader-references/bulk-upload',
  }
} as const;