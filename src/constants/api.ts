/**
 * FocusFlow Design Tokens — API Configuration
 */

/** Backend base URLs by environment */
const API_URLS = {
  development: 'http://localhost:5000/api',
  production: 'https://focusflow-vo61.onrender.com/api',
} as const;

/** Determine current environment */
const getEnvironment = (): 'development' | 'production' => {
  return __DEV__ ? 'development' : 'production';
};

export const API_BASE_URL = API_URLS[getEnvironment()];

/** API endpoint paths */
export const endpoints = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    profile: '/auth/profile',
    settings: '/auth/settings',
  },
  tasks: {
    base: '/tasks',
    byId: (id: string) => `/tasks/${id}`,
  },
  habits: {
    base: '/habits',
    byId: (id: string) => `/habits/${id}`,
    checkin: (id: string) => `/habits/${id}/checkin`,
  },
  goals: {
    base: '/goals',
    byId: (id: string) => `/goals/${id}`,
  },
  focus: {
    session: '/focus/session',
    history: '/focus/history',
    stats: '/focus/stats',
    deleteSession: (id: string) => `/focus/session/${id}`,
  },
} as const;

/** Request timeout in milliseconds */
export const REQUEST_TIMEOUT = 15_000;

/** Max retry attempts for failed requests */
export const MAX_RETRIES = 3;
