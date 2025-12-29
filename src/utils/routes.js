// ============================================
// FILE: src/utils/routes.js (NEW FILE)
// ============================================
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  PORTAL: '/portal',
  DASHBOARD: '/dashboard',
  CARD: (slug) => `/card/${slug}`
};

export const updateURL = (path) => {
  window.history.pushState({}, '', path);
};

export const getCurrentSlug = () => {
  const path = window.location.pathname;
  if (path.startsWith('/card/')) {
    return path.replace('/card/', '');
  }
  return null;
};

export const isPublicCardRoute = () => {
  return window.location.pathname.startsWith('/card/');
};

export const isProtectedRoute = () => {
  const path = window.location.pathname;
  return path === '/portal' || path === '/dashboard';
};