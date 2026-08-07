export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    REFRESH: '/auth/refresh',
    SIGNUP: '/auth/signup',
  },
  SALES: {
    PAYMASTER: '/paymaster',
    PAYMASTER_ADMIN: '/paymaster-admin',
    SESSION: '/session',
  },
  CUSTOMER_SUCCESS: {
    BATCH: '/portfolio-batch',
    DRILLDOWN: '/customer-success',
    ACTIVITIES: '/activities',
    AUTOPILOT: '/autopilot',
  },
} as const;
