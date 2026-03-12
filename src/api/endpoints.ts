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
    customer: '/contact-management/customer'
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
    "upload": "/media/upload",
    "customer_status_update": "/contact-management/customer/:id/status"
  }
} as const;