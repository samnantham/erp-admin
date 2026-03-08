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
    submaster: '/submaster/:model'
  }, list: {
    role: '/role',
    department: '/department',
    user: '/user',
    submaster: '/submaster/:model'
  }, info: {
    role: '/role/:id',
    department: '/department/:id',
    user: '/user/:id',
    submaster: '/submaster/:model/:id'
  }, create: {
    role: '/role',
    department: '/department',
    user: '/user',
    submaster: '/submaster/:model'
  }, update: {
    role: '/role/:id',
    department: '/department/:id',
    user: '/user/:id',
    submaster: '/submaster/:model/:id'
  }, delete: {
    role: '/role/:id',
    department: '/department/:id',
    user: '/user/:id',
    submaster: '/submaster/:model/:id'
  }, drop_downs: {
    user: '/user/drop-downs'
  }
} as const;