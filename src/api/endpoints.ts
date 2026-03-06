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
    user: '/user'
  }, list: {
    role: '/role',
    department: '/department',
    user: '/user'
  }, info: {
    role: '/role/:id',
    department: '/department/:id',
    user: '/user/:id'
  }, create: {
    role: '/role',
    department: '/department',
    user: '/user'
  }, update: {
    role: '/role/:id',
    department: '/department/:id',
    user: '/user/:id'
  }, delete: {
    role: '/role/:id',
    department: '/department/:id',
    user: '/user/:id'
  }, drop_downs: {
    user: '/user/drop-downs'
  }
} as const;