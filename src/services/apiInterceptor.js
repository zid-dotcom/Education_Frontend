/**
 * Global HTTP Interceptor for window.fetch
 * Detects 401 Unauthorized responses on authenticated requests
 * and alerts the auth system to trigger an automatic logout.
 */

let isInterceptorActive = false;
let sessionExpiredCallback = null;

export function setupAuthInterceptor(onSessionExpired) {
  if (typeof onSessionExpired === 'function') {
    sessionExpiredCallback = onSessionExpired;
  }

  if (isInterceptorActive || typeof window === 'undefined') return;
  isInterceptorActive = true;

  const originalFetch = window.fetch;

  window.fetch = async (resource, config = {}) => {
    let finalConfig = { ...config };

    const urlStr = typeof resource === 'string'
      ? resource
      : (resource && typeof resource.url === 'string' ? resource.url : '');

    // Bypass ngrok browser interstitial page (ERR_NGROK_6024) which lacks CORS headers
    if (urlStr.includes('ngrok')) {
      let headers;
      if (finalConfig.headers instanceof Headers) {
        headers = new Headers(finalConfig.headers);
      } else if (finalConfig.headers) {
        headers = new Headers(finalConfig.headers);
      } else {
        headers = new Headers();
      }

      if (!headers.has('ngrok-skip-browser-warning')) {
        headers.set('ngrok-skip-browser-warning', '69420');
      }
      finalConfig.headers = headers;
    }

    const response = await originalFetch(resource, finalConfig);

    if (response && response.status === 401) {
      // Exclude authentication endpoints so invalid login credentials don't trigger auto-logout
      const isAuthAttempt =
        urlStr.includes('/auth/login') ||
        urlStr.includes('/auth/super-admin-login') ||
        urlStr.includes('/auth/branch-admin-login') ||
        urlStr.includes('/auth/staff-login') ||
        urlStr.includes('/auth/register') ||
        urlStr.includes('/auth/logout');

      if (!isAuthAttempt) {
        if (typeof sessionExpiredCallback === 'function') {
          sessionExpiredCallback('Your session has expired. Please log in again.');
        }

        window.dispatchEvent(
          new CustomEvent('auth:session_expired', {
            detail: { status: 401, url: urlStr, reason: 'unauthorized' },
          })
        );
      }
    }

    return response;
  };
}

// Auto-activate immediately when imported in the browser
if (typeof window !== 'undefined') {
  setupAuthInterceptor();
}

